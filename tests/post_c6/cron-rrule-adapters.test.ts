import { describe, expect, it } from "vitest";
import { exportRRule, importCronExpression, importRRule } from "../../src/index.js";

describe("post-C6 cron and RRULE adapters", () => {
  it("imports an exact weekly cron trigger into Decan recurrence plus clock", () => {
    expect(importCronExpression({
      cron: "0 9 * * 1",
      effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 }
    })).toMatchObject({
      ok: true,
      value: {
        source: { kind: "imported_cron", value: "0 9 * * 1" },
        expression: {
          kind: "compound",
          expressions: [
            { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } },
            { kind: "repeat", every: 1, unit: "week", mode: "civil" }
          ]
        },
        lifecycle: { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 31 } },
        diagnostics: [{ code: "DECAN-ADAPTER-CRON-EXACT-SUBSET", message: "Imported exact weekly cron subset." }]
      }
    });
  });

  it("fails closed for cron shapes Decan cannot preserve exactly", () => {
    expect(importCronExpression({
      cron: "*/15 9 * * 1",
      effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 }
    })).toMatchObject({
      ok: false,
      errors: [{ category: "capability", code: "DECAN-ADAPTER-CRON-UNSUPPORTED" }]
    });
  });

  it("imports an exact weekly RFC 5545 RRULE with explicit DTSTART", () => {
    expect(importRRule({
      dtstart: "20260831T090000",
      rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO"
    })).toMatchObject({
      ok: true,
      value: {
        source: { kind: "imported_rrule", value: "DTSTART:20260831T090000\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO" },
        expression: {
          kind: "compound",
          expressions: [
            { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } },
            { kind: "repeat", every: 1, unit: "week", mode: "civil" }
          ]
        },
        lifecycle: { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 31 } },
        diagnostics: [{ code: "DECAN-ADAPTER-RRULE-EXACT-SUBSET", message: "Imported exact weekly RRULE subset." }]
      }
    });
  });

  it("fails closed for RRULE parts outside the exact subset", () => {
    expect(importRRule({
      dtstart: "20260831T090000",
      rrule: "FREQ=MONTHLY;BYSETPOS=1;BYDAY=MO"
    })).toMatchObject({
      ok: false,
      errors: [{ category: "capability", code: "DECAN-ADAPTER-RRULE-UNSUPPORTED" }]
    });
  });

  it("exports an exact Decan weekly recurrence to RFC 5545 DTSTART plus RRULE lines", () => {
    expect(exportRRule({
      expression: {
        kind: "compound",
        expressions: [
          { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } },
          { kind: "repeat", every: 1, unit: "week", mode: "civil" }
        ]
      },
      lifecycle: { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 31 } }
    })).toMatchObject({
      ok: true,
      value: {
        contentLines: ["DTSTART:20260831T090000", "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO"],
        diagnostics: [{ code: "DECAN-ADAPTER-RRULE-EXACT-SUBSET", message: "Exported exact weekly RRULE subset." }]
      }
    });
  });
});
