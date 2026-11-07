/**
 * The visible app user can be a short-lived boot cache. Actions that reach a
 * Firebase-protected service must instead require the SDK's live session.
 */
export function requireAuthenticatedUid(uid: string | null | undefined): string {
  if (!uid) {
    throw new Error("Your sign-in session expired. Please sign in again, then attach your audio.");
  }
  return uid;
}
