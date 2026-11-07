import { describe, expect, it } from "vitest";
import { requireAuthenticatedUid } from "./authSession";

describe("requireAuthenticatedUid", () => {
  it("blocks a protected upload when only the app's cached user is available", () => {
    expect(() => requireAuthenticatedUid(null)).toThrow(
      "Your sign-in session expired. Please sign in again, then attach your audio."
    );
  });

  it("returns the live Firebase uid for a protected upload path", () => {
    expect(requireAuthenticatedUid("live-user-id")).toBe("live-user-id");
  });
});
