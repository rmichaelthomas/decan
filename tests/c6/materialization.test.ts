import { describe, expect, it } from "vitest";
import { MemoryOccurrenceStore, materialize } from "../../src/index.js";
import type { TemporalResolution } from "../../src/model/types.js";

const resolution: TemporalResolution = {
  id: "sha256:resolution",
  status: "resolved",
  candidates: [{ id: "sha256:candidate", value: { kind: "point_candidate", value: "2026-08-28T09:00:00-07:00[America/Los_Angeles]" }, derivation: [] }],
  needs: [], assumptions: [], contextUsed: [], horizon: { kind: "count", value: 1 }, derivation: []
};

describe("C6 materialization", () => {
  it("creates once and converges repeated materialization on the same occurrence", () => {
    const store = new MemoryOccurrenceStore();
    const request = { intentId: "payroll", intentVersion: 1, resolution, candidateId: "sha256:candidate", recordedAt: "2026-08-27T16:00:00Z" };

    expect(materialize(request, store)).toMatchObject({ ok: true, value: { disposition: "created", occurrence: { intentId: "payroll", phase: "materialized" } } });
    expect(materialize(request, store)).toMatchObject({ ok: true, value: { disposition: "existing" } });
    expect(store.query({ intentId: "payroll" }).items).toHaveLength(1);
  });

  it("rejects an unresolved resolution before mutating the store", () => {
    const store = new MemoryOccurrenceStore();
    const unresolved = { ...resolution, status: "unresolved" as const, candidates: [], needs: [{ kind: "timezone" as const, requiredBy: "test", reason: "Missing timezone snapshot" }] };

    expect(materialize({ intentId: "payroll", intentVersion: 1, resolution: unresolved, candidateId: "sha256:candidate", recordedAt: "2026-08-27T16:00:00Z" }, store)).toMatchObject({
      ok: false, errors: [{ category: "materialization", code: "DECAN-MATERIALIZATION-RESOLUTION" }]
    });
    expect(store.query({}).items).toEqual([]);
  });
});
