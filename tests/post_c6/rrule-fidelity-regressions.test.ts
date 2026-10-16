import { describe, expect, it } from "vitest";
import { exportRRule, importRRule } from "../../src/index.js";
import type { IntentLifecycle, TemporalExpression } from "../../src/model/types.js";

const unsupported = (dtstart: string, rrule: string) => importRRule({ dtstart, rrule });
const expectUnsupported = (dtstart: string, rrule: string, message: RegExp) =>
  expect(unsupported(dtstart, rrule)).toMatchObject({ ok: false, errors: [{ category: "capability", message: expect.stringMatching(message), details: { lossReport: { fidelity: "unsupported" } } }] });

describe("timed UNTIL is exact only when the date-granular horizon cannot change the occurrence set", () => {
  it("rejects a floating UNTIL earlier in the day than the occurrence time", () => {
    expectUnsupported("20260105T090000", "FREQ=DAILY;UNTIL=20260110T080000", /before the occurrence time/);
  });

  it("rejects a UTC (Z) UNTIL, which cannot be compared with a local DTSTART", () => {
    expectUnsupported("20260105T090000", "FREQ=DAILY;UNTIL=20260110T080000Z", /UTC/);
    expectUnsupported("20260105T090000", "FREQ=DAILY;UNTIL=20260110T235959Z", /UTC/);
  });

  it("rejects invalid UNTIL dates and times", () => {
    expectUnsupported("20260105T090000", "FREQ=DAILY;UNTIL=20260231", /valid calendar date/);
    expectUnsupported("20260105T090000", "FREQ=DAILY;UNTIL=20260110T250000", /invalid time/);
  });

  it("accepts a floating UNTIL at or after the occurrence time as the same date horizon", () => {
    for (const until of ["20260110T090000", "20260110T235959"]) {
      const result = importRRule({ dtstart: "20260105T090000", rrule: `FREQ=DAILY;UNTIL=${until}` });
      expect(result).toMatchObject({ ok: true, value: { horizon: { kind: "until", value: "2026-01-10" }, lossReport: { fidelity: "exact" } } });
    }
  });

  it("still accepts a date-only UNTIL", () => {
    expect(importRRule({ dtstart: "20260105T090000", rrule: "FREQ=DAILY;UNTIL=20260110" })).toMatchObject({ ok: true, value: { horizon: { kind: "until", value: "2026-01-10" } } });
  });
});

describe("duplicate RRULE parts fail closed", () => {
  it.each([
    "FREQ=DAILY;FREQ=WEEKLY",
    "FREQ=WEEKLY;FREQ=DAILY",
    "FREQ=DAILY;freq=WEEKLY",
    "FREQ=DAILY;INTERVAL=1;INTERVAL=2",
    "FREQ=WEEKLY;BYDAY=MO;BYDAY=TU",
    "FREQ=DAILY;COUNT=3;COUNT=5",
    "FREQ=DAILY;UNTIL=20260110;UNTIL=20270110"
  ])("rejects %s regardless of part order", (rrule) => {
    expectUnsupported("20260105T090000", rrule, /repeats rule part/);
  });
});

describe("export refuses expressions it would otherwise truncate", () => {
  const lifecycle: IntentLifecycle = { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 1, day: 5 } };
  const clock = (hour: number, minute: number): TemporalExpression => ({ kind: "point", value: { kind: "clock", hour, minute } });
  const daily: TemporalExpression = { kind: "repeat", every: 1, unit: "day", mode: "civil" };
  const compound = (...expressions: TemporalExpression[]): TemporalExpression => ({ kind: "compound", expressions });

  it("rejects two clock points instead of exporting only the first", () => {
    expect(exportRRule({ expression: compound(clock(9, 0), clock(17, 30), daily), lifecycle })).toMatchObject({ ok: false, errors: [{ category: "capability", message: expect.stringMatching(/exactly one local clock point; this expression has 2/), details: { lossReport: { fidelity: "unsupported" } } }] });
  });

  it("rejects a clock point alongside a non-clock point", () => {
    const date: TemporalExpression = { kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 1, day: 6 } };
    expect(exportRRule({ expression: compound(clock(9, 0), date, daily), lifecycle })).toMatchObject({ ok: false });
  });

  it("rejects two repeat cadences instead of exporting only the first", () => {
    const weekly: TemporalExpression = { kind: "repeat", every: 1, unit: "week", mode: "civil" };
    expect(exportRRule({ expression: compound(clock(9, 0), daily, weekly), lifecycle })).toMatchObject({ ok: false, errors: [{ message: expect.stringMatching(/at most one repeat/) }] });
  });

  it("still exports one clock point and one repeat", () => {
    expect(exportRRule({ expression: compound(clock(9, 0), daily), lifecycle })).toMatchObject({ ok: true, value: { contentLines: ["DTSTART:20260105T090000", "RRULE:FREQ=DAILY;INTERVAL=1"], lossReport: { fidelity: "exact" } } });
  });
});
