import { describe, expect, test } from "vitest";
import { exportRRule, importCronExpression, importRRule } from "../../src/index.js";

const monday = { kind: "date" as const, calendar: "iso8601" as const, year: 2026, month: 8, day: 31 };

describe("Temporal Loss Report", () => {
  test("records exactly preserved semantics for supported cron and RRULE conversions", () => {
    expect(importCronExpression({ cron: "0 9 * * 1", effectiveFrom: monday })).toMatchObject({
      ok: true,
      value: { lossReport: { target: "cron", operation: "import", fidelity: "exact", discarded: [], assumptions: [], consequences: [] } }
    });
    expect(importRRule({ dtstart: "20260831T090000", rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO" })).toMatchObject({
      ok: true,
      value: { lossReport: { target: "rrule", operation: "import", fidelity: "exact", discarded: [] } }
    });
    expect(exportRRule({
      expression: { kind: "compound", expressions: [{ kind: "point", value: { kind: "clock", hour: 9, minute: 0 } }, { kind: "repeat", every: 1, unit: "week", mode: "civil" }] },
      lifecycle: { status: "active", version: 1, effectiveFrom: monday }
    })).toMatchObject({ ok: true, value: { lossReport: { target: "rrule", operation: "export", fidelity: "exact", discarded: [] } } });
  });

  test("returns structured loss evidence when cron or RRULE is unsupported", () => {
    expect(importCronExpression({ cron: "*/15 9 * * 1", effectiveFrom: monday })).toMatchObject({
      ok: false,
      errors: [{ details: { lossReport: { target: "cron", operation: "import", fidelity: "unsupported", discarded: expect.any(Array), remediation: expect.any(String) } } }]
    });
    expect(importRRule({ dtstart: "20260831T090000", rrule: "FREQ=MONTHLY;BYSETPOS=1;BYDAY=MO" })).toMatchObject({
      ok: false,
      errors: [{ details: { lossReport: { target: "rrule", operation: "import", fidelity: "unsupported" } } }]
    });
  });
});
