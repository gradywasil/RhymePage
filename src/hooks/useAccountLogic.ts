import { useCallback, useState } from "react";
import {
  EmailAuthProvider,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { auth, functions } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { androidAuthError, reauthenticateWithGoogle } from "../utils/googleAuth";
import { publishProfile } from "../utils/profiles";
import { clearAccountDrafts } from "../utils/noteDraft";
import { getRecoveryStorage } from "../utils/recoveryStorage";
import { clearNativeGoogleSession } from "../utils/nativeApp";
import { toAppUser, type AppUser } from "../types/user";

export type ActionState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

const IDLE: ActionState = { status: "idle" };

/** Firebase error codes surfaced as something a person can act on. */
function readableError(error: unknown): string {
  const androidError = androidAuthError(error);
  if (androidError) return androidError;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "That password is not right.";
    case "auth/weak-password":
      return "Pick a password of at least six characters.";
    case "auth/email-already-in-use":
      return "Another account already uses that address.";
    case "auth/invalid-email":
      return "That does not look like an email address.";
    case "auth/requires-recent-login":
      return "Confirm your password first, then try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/popup-closed-by-user":
      return "The Google window closed before finishing.";
    case "functions/not-found":
    case "functions/unavailable":
      return "Account deletion is temporarily unavailable. No completed deletion was confirmed. Please retry later.";
    case "functions/internal":
      return "Deletion did not finish. Keep signed in, confirm your account, and retry to finish removing your data.";
    case "functions/failed-precondition":
      return "Confirm your account again, then retry deletion.";
    default:
      return "Something went wrong. Try again.";
  }
}

/** True when the account signs in with a password rather than only Google. */
export function usesPassword(): boolean {
  return (
    auth.currentUser?.providerData.some(
      (p) => p.providerId === EmailAuthProvider.PROVIDER_ID
    ) ?? false
  );
}

interface UseAccountLogicArgs {
  /**
   * Pushes a change back into the app's single source of truth for the signed
   * in user. Without this, a successful updateProfile call left Firebase
   * correct but the app's own state (and its localStorage boot cache) stale
   * until the next full auth event -- observed directly: the display name
   * changed on the account, but the cached copy kept the old one.
   */
  setCurrentUser: (user: AppUser | null) => void;
}

const useAccountLogic = ({ setCurrentUser }: UseAccountLogicArgs) => {
  const [nameState, setNameState] = useState<ActionState>(IDLE);
  const [emailState, setEmailState] = useState<ActionState>(IDLE);
  const [passwordState, setPasswordState] = useState<ActionState>(IDLE);
  const [deleteState, setDeleteState] = useState<ActionState>(IDLE);

  /**
   * Firebase refuses sensitive changes on a stale session. Prove who you are
   * with a password, or a Google popup for accounts that have no password.
   */
  const reauthenticate = useCallback(async (currentPassword: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in");

    if (usesPassword()) {
      if (!user.email) throw new Error("Account has no email address");
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, currentPassword)
      );
    } else {
      await reauthenticateWithGoogle(user);
    }
  }, []);

  const changeDisplayName = useCallback(async (displayName: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameState({ status: "error", message: "Pick a name first." });
      return;
    }

    setNameState({ status: "working" });
    try {
      await updateProfile(user, { displayName: trimmed });
      const appUser = { ...toAppUser(user), displayName: trimmed };
      // Keep the private doc, the public card, and the app's own state in step.
      await setDoc(
        doc(getFirestore(), "users", user.uid),
        { displayName: trimmed },
        { merge: true }
      );
      await publishProfile(appUser);
      setCurrentUser(appUser);
      setNameState({ status: "done", message: "Name updated." });
    } catch (error) {
      setNameState({ status: "error", message: readableError(error) });
    }
  }, [setCurrentUser]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const user = auth.currentUser;
      if (!user) return;
      if (newPassword.length < 6) {
        setPasswordState({
          status: "error",
          message: "Pick a password of at least six characters.",
        });
        return;
      }

      setPasswordState({ status: "working" });
      try {
        await reauthenticate(currentPassword);
        await updatePassword(user, newPassword);
        setPasswordState({ status: "done", message: "Password changed." });
      } catch (error) {
        setPasswordState({ status: "error", message: readableError(error) });
      }
    },
    [reauthenticate]
  );

  /**
   * Email changes go through a verification link rather than switching
   * immediately -- Firebase requires it, and it stops a typo locking you out.
   */
  const changeEmail = useCallback(
    async (currentPassword: string, newEmail: string) => {
      const user = auth.currentUser;
      if (!user) return;

      setEmailState({ status: "working" });
      try {
        await reauthenticate(currentPassword);
        await verifyBeforeUpdateEmail(user, newEmail.trim());
        setEmailState({
          status: "done",
          message: `Check ${newEmail.trim()} for a confirmation link. The address changes once you follow it.`,
        });
      } catch (error) {
        setEmailState({ status: "error", message: readableError(error) });
      }
    },
    [reauthenticate]
  );

  /** Removes the notes, the public profile and finally the account itself. */
  const deleteAccount = useCallback(
    async (currentPassword: string) => {
      const user = auth.currentUser;
      if (!user) return false;

      setDeleteState({ status: "working" });
      try {
        await reauthenticate(currentPassword);
        await httpsCallable(functions, "deleteAccount")();
        const recovery = getRecoveryStorage();
        clearAccountDrafts(recovery, user.uid);
        await recovery.flush?.();
        await signOut(auth);
        await clearNativeGoogleSession();
        setCurrentUser(null);
        return true;
      } catch (error) {
        setDeleteState({ status: "error", message: readableError(error) });
        return false;
      }
    },
    [reauthenticate, setCurrentUser]
  );

  return {
    nameState,
    emailState,
    passwordState,
    deleteState,
    changeDisplayName,
    changeEmail,
    changePassword,
    deleteAccount,
  };
};

export default useAccountLogic;
