import { GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, signInWithCredential, signInWithPopup, type User } from "firebase/auth";
import { auth, provider } from "../firebase";
import { isAndroid, isIOS, nativeApp } from "./nativeApp";

/** Google blocks its sign-in page inside embedded webviews, and iOS has no native bridge yet. */
const iosUnavailable = () => Object.assign(new Error("Google sign-in is not available in the iOS app yet."), { code: "auth/ios-google-unavailable" });

export async function signInWithGoogle() {
  if (isIOS()) throw iosUnavailable();
  if (!isAndroid()) return signInWithPopup(auth, provider);
  const { idToken } = await nativeApp.getGoogleCredential();
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

export async function reauthenticateWithGoogle(user: User) {
  if (isIOS()) throw iosUnavailable();
  if (!isAndroid()) return reauthenticateWithPopup(user, provider);
  const { idToken } = await nativeApp.getGoogleCredential();
  return reauthenticateWithCredential(user, GoogleAuthProvider.credential(idToken));
}

export function androidAuthError(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  switch (error.code) {
    case "auth/android-not-configured": return "Google sign-in is not available in this build. Use email and password, or try rhymepage.com.";
    case "auth/android-sign-in-failed": return "Google sign-in could not finish. Check your connection and Google account, then retry.";
    case "auth/android-no-credential": return "No Google account is available. Add one in Android Settings, or use email and password.";
    case "auth/ios-google-unavailable": return "Google sign-in isn't available in the iPhone app yet. Use email and password, or sign in at rhymepage.com.";
    case "auth/request-pending": return "A Google sign-in request is already open.";
    case "auth/user-mismatch": return "Choose the Google account that belongs to your signed-in RhymePage account.";
    default: return null;
  }
}
