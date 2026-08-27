import { describe, expect, it } from "vitest";
import {
  canonicalizeText,
  classifyResolveSupport,
  exportRRule,
  importCronExpression,
  importRRule,
  materialize,
  MemoryOccurrenceStore,
  resolveExpression,
  timezoneSnapshot
} from "../../src/index.js";

describe("public documentation examples", () => {
  it("keeps the README/docs authoring example executable", () => {
    expect(canonicalizeText({
      surface: "authoring",
      text: [
        "time",
        "  point 9am",
        "  repeat every 1 week",
        ""
      ].join("\n")
    })).toMatchObject({
      ok: true,
      value: { canonicalText: "time\n  point 09:00\n  repeat every week\n" }
    });
  });

  it("keeps the pinned timezone resolution and materialization examples executable", () => {
    const zone = timezoneSnapshot({
      id: "America/New_York",
      version: "tzdb-2026a",
      initialOffsetMinutes: -240,
      transitions: []
    });

    const resolution = resolveExpression({
      referenceTime: "2026-08-27T12:00:00Z",
      horizon: { kind: "count", value: 1 },
      lifecycle: {
        status: "active",
        version: 1,
        effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 31 }
      },
      context: [zone],
      expression: {
        kind: "compound",
        expressions: [
          { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } },
          { kind: "repeat", every: 1, unit: "week", mode: "civil" }
        ]
      }
    });

    expect(resolution).toMatchObject({
      ok: true,
      value: {
        status: "resolved",
        candidates: [{ value: { value: { date: "2026-08-31", instants: ["2026-08-31T13:00:00Z[America/New_York]"] } } }]
      }
    });
    if (!resolution.ok) throw new Error("expected resolution");

    const created = materialize({
      intentId: "fivexfive.banneker1.automation.weekly-digest",
      intentVersion: 1,
      resolution: resolution.value,
      candidateId: resolution.value.candidates[0]!.id,
      recordedAt: "2026-08-27T12:00:01Z"
    }, new MemoryOccurrenceStore());

    expect(created).toMatchObject({ ok: true, value: { disposition: "created", occurrence: { phase: "materialized" } } });
  });

  it("keeps the support matrix and recurrence adapter examples executable", () => {
    expect(classifyResolveSupport({
      kind: "boundary",
      operator: "by",
      value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 }
    })).toMatchObject({ support: "unsupported", unsupported: ["boundary.as-candidate"] });

    expect(importCronExpression({
      cron: "0 9 * * 1",
      effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 }
    })).toMatchObject({ ok: true, value: { source: { kind: "imported_cron" } } });

    expect(importRRule({
      dtstart: "20260831T090000",
      rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO"
    })).toMatchObject({ ok: true, value: { source: { kind: "imported_rrule" } } });

    expect(exportRRule({
      expression: {
        kind: "compound",
        expressions: [
          { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } },
          { kind: "repeat", every: 1, unit: "week", mode: "civil" }
        ]
      },
      lifecycle: {
        status: "active",
        version: 1,
        effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 31 }
      }
    })).toMatchObject({
      ok: true,
      value: { contentLines: ["DTSTART:20260831T090000", "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO"] }
    });
  });
});
