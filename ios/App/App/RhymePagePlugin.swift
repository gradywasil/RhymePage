import AuthenticationServices
import Capacitor
import CryptoKit
import Foundation

/// iOS half of the `RhymePage` bridge that Android implements in RhymePagePlugin.java.
/// It hands native Google and Apple identity tokens to the web layer, which exchanges
/// them for a Firebase session. Error codes match the ones the web layer already maps.
@objc(RhymePagePlugin)
public class RhymePagePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RhymePagePlugin"
    public let jsName = "RhymePage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getGoogleCredential", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAppleCredential", returnType: CAPPluginReturnPromise),
    ]

    private var inFlight = false
    private var webSession: ASWebAuthenticationSession?
    private var appleController: ASAuthorizationController?
    private var appleCall: CAPPluginCall?
    private var appleRawNonce = ""

    // MARK: - Shared

    /// One native sign-in sheet at a time, matching Android's `auth/request-pending`.
    private func begin(_ call: CAPPluginCall) -> Bool {
        if inFlight {
            call.reject("A sign-in request is already open.", "auth/request-pending")
            return false
        }
        inFlight = true
        return true
    }

    private func end() {
        inFlight = false
        webSession = nil
        appleController = nil
        appleCall = nil
    }

    private func fail(_ call: CAPPluginCall, _ code: String, _ message: String) {
        end()
        call.reject(message, code)
    }

    private func cancelled(_ call: CAPPluginCall) {
        fail(call, "auth/native-cancelled", "Sign-in was cancelled.")
    }

    private static func randomBytes(_ count: Int) -> [UInt8] {
        var bytes = [UInt8](repeating: 0, count: count)
        let status = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)
        // A failed system RNG must never degrade into a predictable nonce or verifier.
        precondition(status == errSecSuccess, "SecRandomCopyBytes failed")
        return bytes
    }

    private static func base64URL(_ data: Data) -> String {
        data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    private static func sha256(_ input: String) -> Data {
        Data(SHA256.hash(data: Data(input.utf8)))
    }

    // MARK: - Google (OAuth code + PKCE in a system browser session)

    @objc func getGoogleCredential(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.startGoogle(call) }
    }

    private func startGoogle(_ call: CAPPluginCall) {
        guard begin(call) else { return }
        guard let clientID = Bundle.main.object(forInfoDictionaryKey: "RhymePageGoogleClientID") as? String,
              clientID.hasSuffix(".apps.googleusercontent.com") else {
            fail(call, "auth/ios-not-configured", "Google sign-in is not configured in this build.")
            return
        }
        // Google's iOS clients redirect to the reversed client ID scheme.
        let scheme = "com.googleusercontent.apps." + clientID.replacingOccurrences(of: ".apps.googleusercontent.com", with: "")
        let redirectURI = "\(scheme):/oauth2redirect"
        let verifier = Self.base64URL(Data(Self.randomBytes(32)))
        let state = Self.base64URL(Data(Self.randomBytes(16)))

        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "code_challenge", value: Self.base64URL(Self.sha256(verifier))),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "prompt", value: "select_account"),
        ]
        guard let url = components.url else {
            fail(call, "auth/ios-sign-in-failed", "Google sign-in could not start.")
            return
        }

        let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { [weak self] callbackURL, error in
            guard let self else { return }
            if let error {
                if (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin {
                    self.cancelled(call)
                } else {
                    self.fail(call, "auth/ios-sign-in-failed", "Google sign-in could not finish.")
                }
                return
            }
            let items = URLComponents(url: callbackURL ?? url, resolvingAgainstBaseURL: false)?.queryItems ?? []
            let value = { (name: String) in items.first { $0.name == name }?.value }
            guard value("state") == state, let code = value("code") else {
                // `access_denied` is the user declining on Google's consent screen.
                if value("error") == "access_denied" { self.cancelled(call) }
                else { self.fail(call, "auth/ios-sign-in-failed", "Google sign-in could not finish.") }
                return
            }
            self.exchangeGoogleCode(call, clientID: clientID, code: code, verifier: verifier, redirectURI: redirectURI)
        }
        session.presentationContextProvider = self
        // Reuse the Safari Google session so people pick an account instead of retyping a password.
        session.prefersEphemeralWebBrowserSession = false
        webSession = session
        if !session.start() {
            fail(call, "auth/ios-sign-in-failed", "Google sign-in could not start.")
        }
    }

    private func exchangeGoogleCode(_ call: CAPPluginCall, clientID: String, code: String, verifier: String, redirectURI: String) {
        var request = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        var body = URLComponents()
        body.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "code", value: code),
            URLQueryItem(name: "code_verifier", value: verifier),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "grant_type", value: "authorization_code"),
        ]
        request.httpBody = body.percentEncodedQuery?.data(using: .utf8)

        URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            DispatchQueue.main.async {
                guard let self else { return }
                guard let data,
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let idToken = json["id_token"] as? String else {
                    self.fail(call, "auth/ios-sign-in-failed", "Google sign-in could not finish.")
                    return
                }
                self.end()
                call.resolve(["idToken": idToken])
            }
        }.resume()
    }

    // MARK: - Apple

    @objc func getAppleCredential(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.startApple(call) }
    }

    private func startApple(_ call: CAPPluginCall) {
        guard begin(call) else { return }
        // Apple embeds the SHA-256 of this nonce in the ID token; Firebase checks it against the raw value.
        let rawNonce = Self.randomBytes(32).map { String(format: "%02x", $0) }.joined()
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(rawNonce).map { String(format: "%02x", $0) }.joined()

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        appleRawNonce = rawNonce
        appleCall = call
        appleController = controller
        controller.performRequests()
    }
}

extension RhymePagePlugin: ASWebAuthenticationPresentationContextProviding, ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor { anchor() }
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor { anchor() }

    private func anchor() -> ASPresentationAnchor {
        bridge?.viewController?.view.window ?? ASPresentationAnchor()
    }
}

extension RhymePagePlugin: ASAuthorizationControllerDelegate {
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = appleCall else { return }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let idToken = String(data: tokenData, encoding: .utf8) else {
            fail(call, "auth/ios-sign-in-failed", "Apple sign-in could not finish.")
            return
        }
        var result: [String: Any] = ["idToken": idToken, "nonce": appleRawNonce]
        if let codeData = credential.authorizationCode, let code = String(data: codeData, encoding: .utf8) {
            result["authorizationCode"] = code
        }
        // Apple shares the name only on the first authorization for this app.
        if let given = credential.fullName?.givenName { result["givenName"] = given }
        if let family = credential.fullName?.familyName { result["familyName"] = family }
        end()
        call.resolve(result)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = appleCall else { return }
        if (error as? ASAuthorizationError)?.code == .canceled {
            cancelled(call)
        } else {
            fail(call, "auth/ios-sign-in-failed", "Apple sign-in could not finish. Check that you're signed in to iCloud on this device.")
        }
    }
}
