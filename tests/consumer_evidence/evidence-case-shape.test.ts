import { describe, expect, it } from "vitest";
import { parseEvidenceCase } from "./evidence-case.js";

const validCase = {
  consumer: "seshat",
  intent: "Run a scan every Friday at 09:00.",
  source: { surface: "authoring", text: "time\n  point 09:00\n" },
  resolution: { referenceTime: "2026-08-01T00:00:00Z", horizon: { kind: "count", value: 1 } },
  expected: {
    validationStatus: "valid",
    resolutionStatus: "resolved",
    candidateValues: [{ kind: "point_candidate", value: { date: "2026-08-07" } }],
    resolutionDerivationKinds: ["resolution_frame"],
    candidateDerivationKinds: ["explicit_snapshot_evaluation"],
    needs: [],
    materialization: {
      candidateIndex: 0,
      intentId: "seshat-scan",
      intentVersion: 1,
      recordedAt: "2026-08-01T00:00:01Z"
    }
  },
  observedGaps: []
};

describe("consumer evidence case shape", () => {
  it("accepts a case with deterministic resolution and replay expectations", () => {
    expect(parseEvidenceCase(validCase)).toEqual(validCase);
  });

  it("rejects a resolved case without explicit candidate evidence", () => {
    expect(() => parseEvidenceCase({
      ...validCase,
      expected: { ...validCase.expected, candidateValues: undefined }
    })).toThrow("resolved consumer evidence requires candidateValues");
  });

  it("rejects a consumer happy path that still expects partial resolution", () => {
    expect(() => parseEvidenceCase({
      ...validCase,
      expected: { ...validCase.expected, resolutionStatus: "partially_resolved" }
    })).toThrow("consumer evidence cannot accept partially_resolved as an endpoint");
  });

  it("rejects a resolved case without derivation expectations", () => {
    expect(() => parseEvidenceCase({
      ...validCase,
      expected: { ...validCase.expected, candidateDerivationKinds: undefined }
    })).toThrow("resolved consumer evidence requires candidate derivation expectations");
  });

  it("rejects an unclassified or content-free observed gap", () => {
    expect(() => parseEvidenceCase({
      ...validCase,
      observedGaps: [{ id: "gap-1", status: "deferred", reason: "" }]
    })).toThrow("observed gaps require id, status, and reason");
  });
});
