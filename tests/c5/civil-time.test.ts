import { describe, expect, it } from "vitest";
import { resolveCivilTime } from "../../src/index.js";

describe("C5 civil-time conformance", () => {
  const zone = { id: "America/Los_Angeles", version: "tzdb-2026a" };

  it("surfaces a DST gap as a conflict instead of coercing it", () => {
    expect(resolveCivilTime({ ...zone, year: 2026, month: 3, day: 8, hour: 2, minute: 30 })).toMatchObject({ status: "conflicted", candidates: [] });
  });

  it("preserves both exact instants for a DST fold", () => {
    expect(resolveCivilTime({ ...zone, year: 2026, month: 11, day: 1, hour: 1, minute: 30 })).toMatchObject({ status: "resolved", candidates: expect.any(Array) });
    expect(resolveCivilTime({ ...zone, year: 2026, month: 11, day: 1, hour: 1, minute: 30 }).candidates).toHaveLength(2);
  });
});
