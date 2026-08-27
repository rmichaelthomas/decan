import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SQLiteOccurrenceStore, materialize } from "../../src/index.js";
import type { TemporalResolution } from "../../src/model/types.js";

const resolution: TemporalResolution = {
  id: "sha256:resolution", status: "resolved",
  candidates: [{ id: "sha256:candidate", value: { kind: "point_candidate", value: "slot" }, derivation: [] }],
  needs: [], assumptions: [], contextUsed: [], horizon: { kind: "count", value: 1 }, derivation: []
};

describe("C6 SQLite occurrence store", () => {
  it("enforces the durable intent/key uniqueness constraint and projects append-only history", () => {
    const directory = mkdtempSync(join(tmpdir(), "decan-c6-"));
    const store = new SQLiteOccurrenceStore(join(directory, "occurrences.sqlite"));
    const request = { intentId: "payroll", intentVersion: 1, resolution, candidateId: "sha256:candidate", recordedAt: "2026-08-27T16:00:00Z" };

    expect(materialize(request, store)).toMatchObject({ ok: true, value: { disposition: "created" } });
    expect(materialize(request, store)).toMatchObject({ ok: true, value: { disposition: "existing" } });
    expect(store.query({ intentId: "payroll", asOf: "2026-08-27T15:59:59Z" }).items).toEqual([]);
    const occurrence = store.query({ intentId: "payroll" }).items[0]!.occurrence;
    store.appendEvent(occurrence.id, { id: "cancel-1", kind: "cancelled", recordedAt: "2026-08-28T00:00:00Z" });
    expect(store.query({ intentId: "payroll", asOf: "2026-08-27T23:00:00Z" }).items[0]!.occurrence.phase).toBe("materialized");
    expect(store.query({ intentId: "payroll" }).items[0]!.occurrence.phase).toBe("cancelled");
    store.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
