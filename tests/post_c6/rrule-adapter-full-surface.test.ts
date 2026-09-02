import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { exportRRule, importCronExpression, importRRule } from "../../src/index.js";
import type { IntentLifecycle, TemporalExpression } from "../../src/model/types.js";

const weekdayCode = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
const weekdayName = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const roundTrip = (dtstart: string, rrule: string, exdates?: ReadonlyArray<string>) => {
  const first = importRRule({ dtstart, rrule, ...(exdates ? { exdates } : {}) });
  expect(first.ok).toBe(true);
  if (!first.ok) throw new Error("unreachable");
  const exported = exportRRule({ expression: first.value.expression, lifecycle: first.value.lifecycle, ...(first.value.horizon ? { horizon: first.value.horizon } : {}) });
  expect(exported.ok).toBe(true);
  if (!exported.ok) throw new Error("unreachable");
  const [dtLine, ruleLine, ...rest] = exported.value.contentLines;
  const reimportedRrule = ruleLine!.slice("RRULE:".length);
  const reimportedDtstart = dtLine!.slice("DTSTART:".length);
  const reimportedExdates = rest.find((line) => line.startsWith("EXDATE:"))?.slice("EXDATE:".length).split(",");
  const second = importRRule({ dtstart: reimportedDtstart, rrule: reimportedRrule, ...(reimportedExdates ? { exdates: reimportedExdates } : {}) });
  expect(second.ok).toBe(true);
  if (!second.ok) throw new Error("unreachable");
  expect(second.value.expression).toEqual(first.value.expression);
  expect(second.value.horizon).toEqual(first.value.horizon);
  return { first: first.value, exported: exported.value, second: second.value };
};

describe("full-surface RRULE adapter: interval-based cadences", () => {
  it("round-trips DAILY, WEEKLY, MONTHLY, and YEARLY with arbitrary INTERVAL", () => {
    const { first } = roundTrip("20260831T090000", "FREQ=DAILY;INTERVAL=3");
    expect(first.expression).toEqual({ kind: "compound", expressions: [{ kind: "point", value: { kind: "clock", hour: 9, minute: 0 } }, { kind: "repeat", every: 3, unit: "day", mode: "civil" }] });
    expect(first.lossReport.fidelity).toBe("exact");

    roundTrip("20260831T090000", "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO");
    roundTrip("20260901T090000", "FREQ=MONTHLY;INTERVAL=1");
    roundTrip("20260901T090000", "FREQ=YEARLY;INTERVAL=1");
  });

  it("property: import -> export -> import is stable and exact for every supported interval cadence", () => {
    fc.assert(fc.property(
      fc.constantFrom("DAILY", "WEEKLY", "MONTHLY", "YEARLY"),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 0, max: 6 }),
      (freq, interval, weekdayIndex) => {
        const dtstart = "20260831T090000"; // 2026-08-31 is a Monday
        const rrule = freq === "WEEKLY" ? `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=MO` : `FREQ=${freq};INTERVAL=${interval}`;
        void weekdayIndex;
        const { first, second } = roundTrip(dtstart, rrule);
        expect(first.lossReport.fidelity).toBe("exact");
        expect(second.expression).toEqual(first.expression);
      }
    ));
  });
});

describe("full-surface RRULE adapter: monthly positional and weekday-set BYDAY", () => {
  it("round-trips a single positional weekday (third Tuesday of every month)", () => {
    const { first } = roundTrip("20260901T083000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3TU");
    expect(first.expression).toEqual({
      kind: "compound",
      expressions: [
        { kind: "point", value: { kind: "clock", hour: 8, minute: 30 } },
        { kind: "repeat", every: 1, unit: "month", mode: "civil" },
        { kind: "selection", filter: { kind: "weekday", value: "tuesday" }, selector: { kind: "ordinal", value: 3 } }
      ]
    });
    expect(first.lossReport.fidelity).toBe("exact");
  });

  it("round-trips 'last Friday of the month' via ordinal -1", () => {
    const { first } = roundTrip("20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1FR");
    expect(first.expression.expressions[2]).toEqual({ kind: "selection", filter: { kind: "weekday", value: "friday" }, selector: { kind: "ordinal", value: -1 } });
  });

  it("round-trips a plain weekday (no ordinal) as an 'all occurrences in month' selector", () => {
    const { first } = roundTrip("20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=WE");
    expect(first.expression.expressions[2]).toEqual({ kind: "selection", filter: { kind: "weekday", value: "wednesday" }, selector: { kind: "all" } });
  });

  it("round-trips a weekday set (multiple BYDAY tokens) as multiple selection expressions", () => {
    const { first } = roundTrip("20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=TU,TH");
    expect(first.expression.expressions.slice(2)).toEqual([
      { kind: "selection", filter: { kind: "weekday", value: "tuesday" }, selector: { kind: "all" } },
      { kind: "selection", filter: { kind: "weekday", value: "thursday" }, selector: { kind: "all" } }
    ]);
  });

  it("round-trips positional BYDAY with INTERVAL > 1 (every 2 months)", () => {
    const { first } = roundTrip("20260901T090000", "FREQ=MONTHLY;INTERVAL=2;BYDAY=+1MO");
    expect(first.expression.expressions[1]).toEqual({ kind: "repeat", every: 2, unit: "month", mode: "civil" });
  });

  it("property: every supported ordinal and weekday round-trips exactly", () => {
    fc.assert(fc.property(
      fc.constantFrom(1, 2, 3, 4, 5, -1),
      fc.integer({ min: 0, max: 6 }),
      (ordinal, weekdayIndex) => {
        const code = weekdayCode[weekdayIndex]!;
        const token = `${ordinal > 0 ? "+" : ""}${ordinal}${code}`;
        const { first, second } = roundTrip("20260901T090000", `FREQ=MONTHLY;INTERVAL=1;BYDAY=${token}`);
        expect(first.lossReport.fidelity).toBe("exact");
        expect(second.expression).toEqual(first.expression);
        expect(first.expression.expressions[2]).toEqual({ kind: "selection", filter: { kind: "weekday", value: weekdayName[weekdayIndex] }, selector: { kind: "ordinal", value: ordinal } });
      }
    ));
  });
});

describe("full-surface RRULE adapter: COUNT, UNTIL, and EXDATE", () => {
  it("round-trips COUNT as a count horizon", () => {
    const { first } = roundTrip("20260831T090000", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;COUNT=10");
    expect(first.horizon).toEqual({ kind: "count", value: 10 });
  });

  it("round-trips UNTIL as an until horizon", () => {
    const { first } = roundTrip("20260831T090000", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;UNTIL=20271231");
    expect(first.horizon).toEqual({ kind: "until", value: "2027-12-31" });
  });

  it("round-trips a single EXDATE as an adapter-carried exception marker", () => {
    const { first } = roundTrip("20260831T090000", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO", ["20260907T090000"]);
    expect(first.expression.expressions).toContainEqual({ kind: "exception", predicate: { kind: "expression", reference: "@exdate:20260907T090000" }, effect: "suppress" });
    expect(first.lossReport.fidelity).toBe("exact");
  });

  it("round-trips multiple EXDATEs together with a positional monthly rule and a count horizon", () => {
    const { first, exported } = roundTrip("20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3TU;COUNT=6", ["20261020T090000", "20270119T090000"]);
    expect(first.horizon).toEqual({ kind: "count", value: 6 });
    expect(exported.contentLines.some((line) => line.startsWith("EXDATE:"))).toBe(true);
    const exceptionCount = first.expression.expressions.filter((e: TemporalExpression) => e.kind === "exception").length;
    expect(exceptionCount).toBe(2);
  });
});

describe("full-surface RRULE adapter: fail-closed tail", () => {
  const dtstart = "20260831T090000";
  const expectUnsupported = (rrule: string, exdates?: ReadonlyArray<string>) => {
    const result = importRRule({ dtstart, rrule, ...(exdates ? { exdates } : {}) });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.category).toBe("capability");
    expect(result.errors[0]?.details?.lossReport).toMatchObject({ fidelity: "unsupported" });
  };

  it("fails closed on BYSETPOS, BYYEARDAY, and BYWEEKNO", () => {
    expectUnsupported("FREQ=MONTHLY;BYSETPOS=1;BYDAY=MO");
    expectUnsupported("FREQ=YEARLY;BYYEARDAY=100");
    expectUnsupported("FREQ=WEEKLY;BYWEEKNO=12;BYDAY=MO");
  });

  it("fails closed on ordinals outside Decan's exact selection range", () => {
    expectUnsupported("FREQ=MONTHLY;BYDAY=-2TU");
    expectUnsupported("FREQ=MONTHLY;BYDAY=+6TU");
  });

  it("fails closed on weekly weekday sets and mismatched single weekdays", () => {
    expectUnsupported("FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR");
    expectUnsupported("FREQ=WEEKLY;INTERVAL=1;BYDAY=TU"); // dtstart is a Monday
  });

  it("fails closed on YEARLY/DAILY combined with BYDAY", () => {
    expectUnsupported("FREQ=YEARLY;INTERVAL=1;BYDAY=+1MO");
    expectUnsupported("FREQ=DAILY;INTERVAL=1;BYDAY=MO");
  });

  it("fails closed when COUNT and UNTIL are both present", () => {
    expectUnsupported("FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;COUNT=5;UNTIL=20271231");
  });

  it("fails closed on a malformed EXDATE value", () => {
    expectUnsupported("FREQ=WEEKLY;INTERVAL=1;BYDAY=MO", ["not-a-date"]);
  });
});

describe("full-surface RRULE adapter: export-side fail-closed and quarter export", () => {
  const lifecycle: IntentLifecycle = { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 31 } };

  it("fails closed exporting an expression kind outside the exact subset", () => {
    const expression: TemporalExpression = { kind: "compound", expressions: [{ kind: "point", value: { kind: "clock", hour: 9, minute: 0 } }, { kind: "offset", amount: { value: 1, unit: "day", mode: "calendar" } }] };
    const result = exportRRule({ expression, lifecycle });
    expect(result.ok).toBe(false);
  });

  it("exports a Decan quarter repeat as FREQ=MONTHLY with a tripled INTERVAL", () => {
    const expression: TemporalExpression = { kind: "compound", expressions: [{ kind: "point", value: { kind: "clock", hour: 9, minute: 0 } }, { kind: "repeat", every: 2, unit: "quarter", mode: "civil" }] };
    const result = exportRRule({ expression, lifecycle });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.contentLines).toContain("RRULE:FREQ=MONTHLY;INTERVAL=6");
    expect(result.value.lossReport.fidelity).toBe("exact");
  });
});

describe("full-surface cron adapter: monthly-by-day and yearly extensions", () => {
  const effectiveFrom = { kind: "date" as const, calendar: "iso8601" as const, year: 2026, month: 8, day: 27 };

  it("imports a monthly-by-day cron trigger", () => {
    const result = importCronExpression({ cron: "0 9 15 * *", effectiveFrom });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.expression).toEqual({ kind: "compound", expressions: [{ kind: "point", value: { kind: "clock", hour: 9, minute: 0 } }, { kind: "repeat", every: 1, unit: "month", mode: "civil" }] });
    expect(result.value.lifecycle.effectiveFrom).toEqual({ kind: "date", calendar: "iso8601", year: 2026, month: 9, day: 15 });
    expect(result.value.lossReport.fidelity).toBe("exact");
  });

  it("imports a yearly cron trigger", () => {
    const result = importCronExpression({ cron: "0 9 25 12 *", effectiveFrom });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.expression).toEqual({ kind: "compound", expressions: [{ kind: "point", value: { kind: "clock", hour: 9, minute: 0 } }, { kind: "repeat", every: 1, unit: "year", mode: "civil" }] });
    expect(result.value.lifecycle.effectiveFrom).toEqual({ kind: "date", calendar: "iso8601", year: 2026, month: 12, day: 25 });
  });

  it("fails closed on a day-of-month plus day-of-week combination (cron OR semantics have no Decan equivalent)", () => {
    const result = importCronExpression({ cron: "0 9 15 * 1", effectiveFrom });
    expect(result.ok).toBe(false);
  });

  it("fails closed on an out-of-range day-of-month", () => {
    const result = importCronExpression({ cron: "0 9 32 * *", effectiveFrom });
    expect(result.ok).toBe(false);
  });
});
