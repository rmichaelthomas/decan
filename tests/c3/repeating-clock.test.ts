import { describe, expect, it } from "vitest";
import { resolveExpression } from "../../src/index.js";

const timezone = {
  kind: "timezone" as const,
  id: "America/New_York",
  version: "tzdb-2026a-pinned",
  value: { initialOffsetMinutes: -240, transitions: [] }
};

const request = {
  expression: {
    kind: "compound" as const,
    expressions: [
      { kind: "point" as const, value: { kind: "clock" as const, hour: 9, minute: 0 } },
      { kind: "repeat" as const, every: 1, unit: "week" as const, mode: "civil" as const }
    ]
  },
  referenceTime: "2026-08-27T12:00:00Z",
  horizon: { kind: "count" as const, value: 3 },
  lifecycle: {
    status: "active" as const,
    version: 1,
    effectiveFrom: { kind: "date" as const, calendar: "iso8601" as const, year: 2026, month: 8, day: 31 }
  },
  context: [timezone]
};

describe("C3 recurring civil clock resolution", () => {
  it("combines a civil recurrence date with a pinned clock point", () => {
    expect(resolveExpression(request)).toMatchObject({
      ok: true,
      value: {
        status: "resolved",
        candidates: [
          { value: { kind: "point_candidate", value: { date: "2026-08-31", instants: ["2026-08-31T13:00:00Z[America/New_York]"] } } },
          { value: { kind: "point_candidate", value: { date: "2026-09-07", instants: ["2026-09-07T13:00:00Z[America/New_York]"] } } },
          { value: { kind: "point_candidate", value: { date: "2026-09-14", instants: ["2026-09-14T13:00:00Z[America/New_York]"] } } }
        ],
        needs: []
      }
    });
  });

  it("keeps the recurrence unresolved without the pinned timezone snapshot", () => {
    const { context: _context, ...withoutContext } = request;

    expect(resolveExpression(withoutContext)).toMatchObject({
      ok: true,
      value: {
        status: "unresolved",
        candidates: [],
        needs: [{ kind: "timezone", requiredBy: "expression.point" }]
      }
    });
  });
});
