import { describe, expect, it } from "vitest";
import { resolveCivilTime } from "../../src/index.js";

describe("C5 civil-time conformance", () => {
  const zone = {
    id: "America/Los_Angeles", version: "tzdb-2026a", initialOffsetMinutes: -480,
    transitions: [
      { at: "2026-03-08T10:00:00Z", offsetMinutes: -420 },
      { at: "2026-11-01T09:00:00Z", offsetMinutes: -480 }
    ]
  };

  it("surfaces a DST gap as a conflict instead of coercing it", () => {
    expect(resolveCivilTime({ ...zone, year: 2026, month: 3, day: 8, hour: 2, minute: 30 })).toMatchObject({ status: "conflicted", candidates: [] });
  });

  it("preserves both exact instants for a DST fold", () => {
    expect(resolveCivilTime({ ...zone, year: 2026, month: 11, day: 1, hour: 1, minute: 30 })).toMatchObject({ status: "resolved", candidates: expect.any(Array) });
    expect(resolveCivilTime({ ...zone, year: 2026, month: 11, day: 1, hour: 1, minute: 30 }).candidates).toHaveLength(2);
  });

  it("uses the supplied rule snapshot instead of the runtime time-zone database", () => {
    expect(resolveCivilTime({ id: "example/fixed", version: "rules-1", initialOffsetMinutes: 90, transitions: [], year: 2026, month: 8, day: 1, hour: 9, minute: 0 })).toEqual({
      status: "resolved", candidates: ["2026-08-01T07:30:00Z[example/fixed]"], zoneVersion: "rules-1"
    });
  });
});
