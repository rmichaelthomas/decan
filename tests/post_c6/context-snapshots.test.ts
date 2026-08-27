import { describe, expect, it } from "vitest";
import {
  availabilitySnapshot,
  businessCalendarSnapshot,
  customContextSnapshot,
  explicitReference,
  locationSnapshot,
  participantSnapshot,
  resolveExpression,
  timezoneSnapshot
} from "../../src/index.js";

describe("post-C6 explicit context snapshot adapters", () => {
  it("resolves clock points from a caller-supplied timezone snapshot", () => {
    const zone = timezoneSnapshot({
      id: "America/New_York",
      version: "tzdb-2026a",
      initialOffsetMinutes: -300,
      transitions: []
    });

    expect(resolveExpression({
      referenceTime: "2026-01-05T00:00:00Z",
      horizon: { kind: "count", value: 1 },
      context: [zone],
      expression: { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } }
    })).toMatchObject({
      ok: true,
      value: {
        status: "resolved",
        candidates: [{ value: { value: { instants: ["2026-01-05T14:00:00Z[America/New_York]"] } } }],
        contextUsed: [zone],
        needs: []
      }
    });
  });

  it("applies business-day offsets from a caller-supplied calendar snapshot", () => {
    const calendar = businessCalendarSnapshot({
      id: "us-federal",
      version: "2026.1",
      closedDates: ["2026-09-07"]
    });

    expect(resolveExpression({
      referenceTime: "2026-09-04T12:00:00Z",
      horizon: { kind: "count", value: 1 },
      context: [calendar],
      expression: {
        kind: "compound",
        expressions: [
          { kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 9, day: 4 } },
          { kind: "offset", amount: { value: 1, unit: "business_day", mode: "business" } }
        ]
      }
    })).toMatchObject({
      ok: true,
      value: {
        status: "resolved",
        candidates: [{ value: { value: { date: "2026-09-08", calendarVersion: "2026.1" } } }],
        needs: []
      }
    });
  });

  it("constructs inert explicit context and reference snapshots without ambient capture", () => {
    const location = locationSnapshot({
      id: "banneker-office",
      version: "manual-1",
      latitude: 38.9072,
      longitude: -77.0369,
      observedAt: "2026-08-27T16:00:00Z"
    });
    const participant = participantSnapshot({
      id: "rob",
      version: "profile-4",
      value: { workdayEnd: "17:00", timezone: "America/New_York" }
    });
    const availability = availabilitySnapshot({
      id: "rob-availability",
      version: "calendar-export-9",
      value: { busy: [{ start: "2026-08-27T19:00:00Z", end: "2026-08-27T20:00:00Z" }] }
    });
    const custom = customContextSnapshot({
      id: "portfolio-policy",
      version: "policy-2",
      value: { preferredWindow: "morning" }
    });
    const reference = explicitReference({
      id: "@approval",
      version: "event-1",
      value: { value: true, observedAt: "2026-08-27T16:05:00Z" }
    });

    expect(location).toEqual({
      kind: "location",
      id: "banneker-office",
      version: "manual-1",
      value: { latitude: 38.9072, longitude: -77.0369, observedAt: "2026-08-27T16:00:00Z" }
    });
    expect(participant).toEqual({ kind: "participant", id: "rob", version: "profile-4", value: { workdayEnd: "17:00", timezone: "America/New_York" } });
    expect(availability).toEqual({ kind: "availability", id: "rob-availability", version: "calendar-export-9", value: { busy: [{ start: "2026-08-27T19:00:00Z", end: "2026-08-27T20:00:00Z" }] } });
    expect(custom).toEqual({ kind: "custom", id: "portfolio-policy", version: "policy-2", value: { preferredWindow: "morning" } });
    expect(reference).toEqual({ id: "@approval", version: "event-1", value: { value: true, observedAt: "2026-08-27T16:05:00Z" } });
  });
});
