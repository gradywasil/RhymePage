import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
const mocks = vi.hoisted(() => ({ android: false, ios: false, token: vi.fn(), popup: vi.fn(), credential: vi.fn(), reauthPopup: vi.fn(), reauthCredential: vi.fn() }));
vi.mock("../firebase", () => ({ auth: "existing-auth", provider: "existing-provider" }));
vi.mock("./nativeApp", () => ({ isAndroid: () => mocks.android, isIOS: () => mocks.ios, nativeApp: { getGoogleCredential: mocks.token } }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: { credential: (token: string) => ({ token }) },
  signInWithPopup: mocks.popup, signInWithCredential: mocks.credential,
  reauthenticateWithPopup: mocks.reauthPopup, reauthenticateWithCredential: mocks.reauthCredential,
}));
import { nativeAuthError, reauthenticateWithGoogle, signInWithGoogle } from "./googleAuth";

describe("Google identity handoff", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.android = false; mocks.ios = false; mocks.token.mockResolvedValue({ idToken: "test-id-token" }); });
  it("preserves the web popup flow", async () => {
    await signInWithGoogle();
    expect(mocks.popup).toHaveBeenCalledWith("existing-auth", "existing-provider");
    expect(mocks.token).not.toHaveBeenCalled();
  });
  it("exchanges the native credential in the existing Firebase session", async () => {
    mocks.android = true;
    await signInWithGoogle();
    expect(mocks.credential).toHaveBeenCalledWith("existing-auth", { token: "test-id-token" });
    expect(mocks.popup).not.toHaveBeenCalled();
  });
  it("reauthenticates the existing user instead of signing another user in", async () => {
    mocks.android = true;
    const user = { uid: "existing-uid" } as User;
    await reauthenticateWithGoogle(user);
    expect(mocks.reauthCredential).toHaveBeenCalledWith(user, { token: "test-id-token" });
    expect(mocks.credential).not.toHaveBeenCalled();
  });
  it("does not exchange credentials after native cancellation", async () => {
    mocks.android = true;
    mocks.token.mockRejectedValue(new Error("cancelled"));
    await expect(signInWithGoogle()).rejects.toThrow("cancelled");
    expect(mocks.credential).not.toHaveBeenCalled();
  });
  it("uses the native credential on iOS too, never a popup Google blocks in webviews", async () => {
    mocks.ios = true;
    await signInWithGoogle();
    expect(mocks.credential).toHaveBeenCalledWith("existing-auth", { token: "test-id-token" });
    const user = { uid: "existing-uid" } as User;
    await reauthenticateWithGoogle(user);
    expect(mocks.reauthCredential).toHaveBeenCalledWith(user, { token: "test-id-token" });
    expect(mocks.popup).not.toHaveBeenCalled();
    expect(mocks.reauthPopup).not.toHaveBeenCalled();
  });
  it("explains the iOS and account-linking failures", () => {
    expect(nativeAuthError({ code: "auth/native-cancelled" })).toMatch(/cancelled/);
    expect(nativeAuthError({ code: "auth/ios-sign-in-failed" })).toMatch(/could not finish/);
    expect(nativeAuthError({ code: "auth/account-exists-with-different-credential" })).toMatch(/already exists/);
    expect(nativeAuthError({ code: "auth/unknown" })).toBeNull();
  });
});
