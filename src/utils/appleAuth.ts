import { OAuthProvider, reauthenticateWithCredential, signInWithCredential, updateProfile, type User } from "firebase/auth";
import { auth } from "../firebase";
import { isIOS, nativeApp } from "./nativeApp";

/** Apple's sign-in is native-only for now; the web needs a Services ID that isn't set up. */
export const appleSignInAvailable = () => isIOS();

const unavailable = () => Object.assign(new Error("Sign in with Apple is only available in the iPhone app."), { code: "auth/ios-not-configured" });

async function appleCredential() {
  if (!appleSignInAvailable()) throw unavailable();
  const apple = await nativeApp.getAppleCredential();
  return { apple, credential: new OAuthProvider("apple.com").credential({ idToken: apple.idToken, rawNonce: apple.nonce }) };
}

export async function signInWithApple() {
  const { apple, credential } = await appleCredential();
  const result = await signInWithCredential(auth, credential);
  // Apple hands over the name only on the first authorization, and Firebase doesn't copy it.
  const name = [apple.givenName, apple.familyName].filter(Boolean).join(" ");
  if (name && !result.user.displayName) await updateProfile(result.user, { displayName: name });
  return result;
}

/** Returns Apple's authorization code, which account deletion needs to revoke the grant. */
export async function reauthenticateWithApple(user: User) {
  const { apple, credential } = await appleCredential();
  await reauthenticateWithCredential(user, credential);
  return apple.authorizationCode;
}
