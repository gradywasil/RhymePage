import { describe, expect, it } from "vitest";
import {
  applyTimingProposal,
  computeSyncStatus,
  discardTimingProposal,
  emptyTimingProposalState,
  retryTimingProposal,
  reviewTimingProposal,
  toLineTimingPatches,
} from "./sync";
import type { LineTiming, SyncDoc, TimingProposal } from "./sync";

function line(overrides: Partial<LineTiming> & Pick<LineTiming, "lineId">): LineTiming {
  return {
    snapshotIndex: 0,
    text: "some line",
    start: 0,
    end: 1,
    source: "fast-sync",
    ...overrides,
  };
}

function doc(overrides: Partial<SyncDoc> = {}): SyncDoc {
  return {
    id: "main",
    lyricsSnapshot: "",
    snapshotLines: [],
    lines: {},
    lineOrder: [],
    needsReview: false,
    warnings: [],
    createdBy: "uid",
    ...overrides,
  };
}

describe("computeSyncStatus", () => {
  it("is complete when every line has start and end", () => {
    const a = line({ lineId: "a", start: 0, end: 1 });
    const b = line({ lineId: "b", start: 1, end: 2 });
    const result = computeSyncStatus(
      doc({ lines: { a, b }, lineOrder: ["a", "b"] })
    );
    expect(result).toBe("complete");
  });

  it("is draft when any line is still untimed", () => {
    const a = line({ lineId: "a", start: 0, end: 1 });
    const b = line({ lineId: "b", start: null, end: null });
    const result = computeSyncStatus(
      doc({ lines: { a, b }, lineOrder: ["a", "b"] })
    );
    expect(result).toBe("draft");
  });

  it("is draft when the doc is flagged needsReview even if every line is timed", () => {
    const a = line({ lineId: "a", start: 0, end: 1 });
    const result = computeSyncStatus(
      doc({ lines: { a }, lineOrder: ["a"], needsReview: true })
    );
    expect(result).toBe("draft");
  });

  it("is draft when a line-needs-review warning is present", () => {
    const a = line({ lineId: "a", start: 0, end: 1 });
    const result = computeSyncStatus(
      doc({
        lines: { a },
        lineOrder: ["a"],
        warnings: [{ code: "line-needs-review", message: "check this" }],
      })
    );
    expect(result).toBe("draft");
  });

  it("is not blocked by a non-blocking warning like audio-changed", () => {
    const a = line({ lineId: "a", start: 0, end: 1 });
    const result = computeSyncStatus(
      doc({
        lines: { a },
        lineOrder: ["a"],
        warnings: [{ code: "audio-changed", message: "verify the sync" }],
      })
    );
    expect(result).toBe("complete");
  });

  it("is draft when an individual line is flagged needsReview", () => {
    const a = line({ lineId: "a", start: 0, end: 1, needsReview: true });
    const result = computeSyncStatus(
      doc({ lines: { a }, lineOrder: ["a"] })
    );
    expect(result).toBe("draft");
  });

  it("never lets missing or partial word timing affect completeness", () => {
    const a = line({
      lineId: "a",
      start: 0,
      end: 1,
      words: [
        { text: "hello", start: null, end: null },
        { text: "world", start: 0.5, end: null },
      ],
    });
    const result = computeSyncStatus(
      doc({ lines: { a }, lineOrder: ["a"] })
    );
    expect(result).toBe("complete");
  });
});

describe("timing proposal lifecycle", () => {
  const proposal: TimingProposal = {
    id: "take-1",
    lines: [
      {
        lineId: "a",
        start: 1.25,
        end: 2.5,
        words: [
          { text: "hello", start: 1.25, end: 1.7 },
          { text: "world", start: 1.7, end: 2.5 },
        ],
        uncertain: false,
      },
      { lineId: "b", start: 2.5, end: 3.25, uncertain: true },
    ],
  };

  it("keeps a newly generated proposal separate from SyncDoc until review", () => {
    const reviewed = reviewTimingProposal(proposal);

    expect(reviewed).toEqual({ phase: "review", proposal });
    expect("proposal" in doc()).toBe(false);
  });

  it("turns a reviewed proposal into deliberate existing timing patches", () => {
    expect(toLineTimingPatches(proposal)).toEqual([
      {
        lineId: "a",
        patch: {
          start: 1.25,
          end: 2.5,
          source: "local-alignment",
          words: proposal.lines[0].words,
        },
      },
      {
        lineId: "b",
        patch: {
          start: 2.5,
          end: 3.25,
          source: "local-alignment",
          needsReview: true,
        },
      },
    ]);
  });

  it("ends review only when apply returns patches for the caller to persist", () => {
    const result = applyTimingProposal(reviewTimingProposal(proposal));

    expect(result.state).toBe(emptyTimingProposalState);
    expect(result.patches).toEqual(toLineTimingPatches(proposal));
  });

  it("does not create patches when apply is called without a proposal", () => {
    expect(applyTimingProposal(emptyTimingProposalState)).toEqual({
      state: emptyTimingProposalState,
      patches: [],
    });
  });

  it("lets retry and discard clear in-memory review without producing patches", () => {
    expect(discardTimingProposal()).toBe(emptyTimingProposalState);
    expect(retryTimingProposal()).toBe(emptyTimingProposalState);
  });
});
