import { GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, signInWithCredential, signInWithPopup, type User } from "firebase/auth";
import { auth, provider } from "../firebase";
import { isAndroid, isIOS, nativeApp } from "./nativeApp";

/** Google blocks its sign-in page inside embedded webviews, so both apps hand the credential over from native code. */
const usesNativeGoogle = () => isAndroid() || isIOS();

export async function signInWithGoogle() {
  if (!usesNativeGoogle()) return signInWithPopup(auth, provider);
  const { idToken } = await nativeApp.getGoogleCredential();
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

export async function reauthenticateWithGoogle(user: User) {
  if (!usesNativeGoogle()) return reauthenticateWithPopup(user, provider);
  const { idToken } = await nativeApp.getGoogleCredential();
  return reauthenticateWithCredential(user, GoogleAuthProvider.credential(idToken));
}

/** Messages for the errors the Android and iOS bridges and Firebase's account linking raise. */
export function nativeAuthError(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  switch (error.code) {
    case "auth/android-not-configured": return "Google sign-in is not available in this build. Use email and password, or try rhymepage.com.";
    case "auth/android-sign-in-failed": return "Google sign-in could not finish. Check your connection and Google account, then retry.";
    case "auth/android-no-credential": return "No Google account is available. Add one in Android Settings, or use email and password.";
    case "auth/ios-not-configured": return "Sign-in is not available in this build. Use email and password, or try rhymepage.com.";
    case "auth/ios-sign-in-failed": return "Sign-in could not finish. Check your connection and account, then retry.";
    case "auth/native-cancelled": return "Sign-in was cancelled.";
    case "auth/account-exists-with-different-credential": return "An account with that email already exists. Sign in the way you did before, then try again.";
    case "auth/request-pending": return "A Google sign-in request is already open.";
    case "auth/user-mismatch": return "Choose the Google account that belongs to your signed-in RhymePage account.";
    default: return null;
  }
}
