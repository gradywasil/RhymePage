import { describe, expect, it } from "vitest";
import { describeAlignmentError } from "./alignmentError";

describe("describeAlignmentError", () => {
  it("preserves an audio decoder DOM-style error", () => {
    expect(describeAlignmentError({ name: "EncodingError", message: "Unable to decode audio data" }))
      .toBe("Unable to decode audio data");
  });

  it("uses a safe fallback for an opaque browser failure", () => {
    expect(describeAlignmentError(null)).toBe("The vocal guide could not be processed.");
  });
});
