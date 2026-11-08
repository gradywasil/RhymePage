import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
const mocks = vi.hoisted(() => ({ ios: true, apple: vi.fn(), signIn: vi.fn(), reauth: vi.fn(), updateProfile: vi.fn(), credential: vi.fn() }));
vi.mock("../firebase", () => ({ auth: "existing-auth" }));
vi.mock("./nativeApp", () => ({ isIOS: () => mocks.ios, nativeApp: { getAppleCredential: mocks.apple } }));
vi.mock("firebase/auth", () => ({
  OAuthProvider: class { constructor(public id: string) {} credential(init: unknown) { mocks.credential(this.id, init); return { provider: this.id, init }; } },
  signInWithCredential: mocks.signIn, reauthenticateWithCredential: mocks.reauth, updateProfile: mocks.updateProfile,
}));
import { appleSignInAvailable, reauthenticateWithApple, signInWithApple } from "./appleAuth";

describe("Sign in with Apple handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ios = true;
    mocks.apple.mockResolvedValue({ idToken: "apple-id-token", nonce: "raw-nonce", authorizationCode: "auth-code" });
    mocks.signIn.mockResolvedValue({ user: { displayName: null } });
  });
  it("is offered only inside the iOS app", () => {
    expect(appleSignInAvailable()).toBe(true);
    mocks.ios = false;
    expect(appleSignInAvailable()).toBe(false);
  });
  it("passes the raw nonce with the identity token to Firebase", async () => {
    await signInWithApple();
    expect(mocks.credential).toHaveBeenCalledWith("apple.com", { idToken: "apple-id-token", rawNonce: "raw-nonce" });
    expect(mocks.signIn).toHaveBeenCalledWith("existing-auth", { provider: "apple.com", init: { idToken: "apple-id-token", rawNonce: "raw-nonce" } });
  });
  it("keeps the name Apple shares on first sign-in", async () => {
    mocks.apple.mockResolvedValue({ idToken: "t", nonce: "n", givenName: "Ada", familyName: "Lovelace" });
    const user = { displayName: null };
    mocks.signIn.mockResolvedValue({ user });
    await signInWithApple();
    expect(mocks.updateProfile).toHaveBeenCalledWith(user, { displayName: "Ada Lovelace" });
  });
  it("never overwrites an existing display name", async () => {
    mocks.apple.mockResolvedValue({ idToken: "t", nonce: "n", givenName: "Ada" });
    mocks.signIn.mockResolvedValue({ user: { displayName: "Already Set" } });
    await signInWithApple();
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });
  it("reauthenticates the signed-in user and returns the code needed to revoke the grant", async () => {
    const user = { uid: "u" } as User;
    await expect(reauthenticateWithApple(user)).resolves.toBe("auth-code");
    expect(mocks.reauth).toHaveBeenCalledWith(user, expect.objectContaining({ provider: "apple.com" }));
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("does nothing with Firebase when the native sheet is cancelled", async () => {
    mocks.apple.mockRejectedValue(Object.assign(new Error("cancelled"), { code: "auth/native-cancelled" }));
    await expect(signInWithApple()).rejects.toMatchObject({ code: "auth/native-cancelled" });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("refuses outside iOS", async () => {
    mocks.ios = false;
    await expect(signInWithApple()).rejects.toMatchObject({ code: "auth/ios-not-configured" });
    expect(mocks.apple).not.toHaveBeenCalled();
  });
});
