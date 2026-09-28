import { describe, expect, it } from "vitest";
import { importRRule, resolveExpression, resolveSeries, timezoneSnapshot, validateDocument } from "../../src/index.js";
import type { CompoundExpression, IntentLifecycle, TemporalExpression } from "../../src/model/types.js";
import type { SeriesRequest } from "../../src/resolution/series.js";

// Hand-built America/Los_Angeles rules for 2026-2027. No host timezone data is consulted.
const LA = timezoneSnapshot({
  id: "America/Los_Angeles",
  version: "test-2026-2027",
  initialOffsetMinutes: -480,
  transitions: [
    { at: "2026-03-08T10:00:00Z", offsetMinutes: -420 },
    { at: "2026-11-01T09:00:00Z", offsetMinutes: -480 },
    { at: "2027-03-14T10:00:00Z", offsetMinutes: -420 },
    { at: "2027-11-07T09:00:00Z", offsetMinutes: -480 }
  ]
});
const WIDE = { start: "2026-01-01", end: "2027-12-31" } as const;
const tz = (instant: string) => `${instant}[America/Los_Angeles]`;

const imported = (dtstart: string, rrule: string, exdates?: ReadonlyArray<string>) => {
  const result = importRRule({ dtstart, rrule, ...(exdates ? { exdates } : {}) });
  if (!result.ok) throw new Error(`import failed: ${result.errors[0]?.message}`);
  return result.value;
};
const series = (dtstart: string, rrule: string, options: Partial<SeriesRequest> & { exdates?: ReadonlyArray<string> } = {}) => {
  const { exdates, ...overrides } = options;
  const source = imported(dtstart, rrule, exdates);
  const result = resolveSeries({ expression: source.expression, lifecycle: source.lifecycle, ...(source.horizon ? { horizon: source.horizon } : {}), window: WIDE, context: [LA], ...overrides });
  if (!result.ok) throw new Error(`series failed: ${result.errors[0]?.message}`);
  return result.value;
};
const dates = (value: ReturnType<typeof series>) => value.occurrences.map((occurrence) => occurrence.date);
const lifecycleFrom = (year: number, month: number, day: number): IntentLifecycle => ({ status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year, month, day } });
const compound = (...expressions: TemporalExpression[]): CompoundExpression => ({ kind: "compound", expressions });
const clock = (hour: number, minute = 0): TemporalExpression => ({ kind: "point", value: { kind: "clock", hour, minute } });

describe("resolveSeries: named cases", () => {
  it("weekly single day with COUNT", () => {
    const result = series("20260915T180000", "FREQ=WEEKLY;COUNT=4");
    expect(result.occurrences).toEqual([
      { date: "2026-09-15", instants: [tz("2026-09-16T01:00:00Z")], civil: "exact" },
      { date: "2026-09-22", instants: [tz("2026-09-23T01:00:00Z")], civil: "exact" },
      { date: "2026-09-29", instants: [tz("2026-09-30T01:00:00Z")], civil: "exact" },
      { date: "2026-10-06", instants: [tz("2026-10-07T01:00:00Z")], civil: "exact" }
    ]);
    expect(result).toMatchObject({ excluded: [], needs: [], truncated: false });
  });

  it("weekly MO,WE COUNT=6: six dates in order", () => {
    const result = series("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6");
    expect(dates(result)).toEqual(["2026-09-14", "2026-09-16", "2026-09-21", "2026-09-23", "2026-09-28", "2026-09-30"]);
    expect(result.occurrences.map((occurrence) => occurrence.instants)).toEqual([
      [tz("2026-09-15T01:00:00Z")], [tz("2026-09-17T01:00:00Z")], [tz("2026-09-22T01:00:00Z")], [tz("2026-09-24T01:00:00Z")], [tz("2026-09-29T01:00:00Z")], [tz("2026-10-01T01:00:00Z")]
    ]);
  });

  it("weekly TU,TH INTERVAL=2 skips alternate ISO weeks", () => {
    const result = series("20260915T090000", "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=6");
    expect(dates(result)).toEqual(["2026-09-15", "2026-09-17", "2026-09-29", "2026-10-01", "2026-10-13", "2026-10-15"]);
    expect(result.occurrences[0]!.instants).toEqual([tz("2026-09-15T16:00:00Z")]);
  });

  it("an origin that is not a selected weekday is not an occurrence", () => {
    // 2026-09-15 is a Tuesday; the series is Thursdays.
    expect(dates(series("20260915T180000", "FREQ=WEEKLY;BYDAY=TH;COUNT=3"))).toEqual(["2026-09-17", "2026-09-24", "2026-10-01"]);
  });

  it("monthly 2TU COUNT=4: the four 2nd Tuesdays, across the November offset change", () => {
    expect(series("20260908T180000", "FREQ=MONTHLY;BYDAY=2TU;COUNT=4").occurrences).toEqual([
      { date: "2026-09-08", instants: [tz("2026-09-09T01:00:00Z")], civil: "exact" },
      { date: "2026-10-13", instants: [tz("2026-10-14T01:00:00Z")], civil: "exact" },
      { date: "2026-11-10", instants: [tz("2026-11-11T02:00:00Z")], civil: "exact" },
      { date: "2026-12-08", instants: [tz("2026-12-09T02:00:00Z")], civil: "exact" }
    ]);
  });

  it("monthly -1FR: last Fridays", () => {
    expect(dates(series("20260901T090000", "FREQ=MONTHLY;BYDAY=-1FR;COUNT=4"))).toEqual(["2026-09-25", "2026-10-30", "2026-11-27", "2026-12-25"]);
  });

  it("monthly bare TU,TH: every Tuesday and Thursday of each month", () => {
    expect(dates(series("20260901T090000", "FREQ=MONTHLY;BYDAY=TU,TH;COUNT=10"))).toEqual(["2026-09-01", "2026-09-03", "2026-09-08", "2026-09-10", "2026-09-15", "2026-09-17", "2026-09-22", "2026-09-24", "2026-09-29", "2026-10-01"]);
  });

  it("EXDATE inside COUNT: the excluded date consumes the count and is listed", () => {
    const result = series("20260915T180000", "FREQ=WEEKLY;COUNT=5", { exdates: ["20260922T180000"] });
    expect(dates(result)).toEqual(["2026-09-15", "2026-09-29", "2026-10-06", "2026-10-13"]);
    expect(result.excluded).toEqual(["2026-09-22"]);
  });

  it("EXDATE is date-granular: a different time, or a date-only token, still suppresses that date", () => {
    expect(series("20260915T180000", "FREQ=WEEKLY;COUNT=3", { exdates: ["20260922T070000"] }).excluded).toEqual(["2026-09-22"]);
    expect(series("20260915T180000", "FREQ=WEEKLY;COUNT=3", { exdates: ["20260929"] }).excluded).toEqual(["2026-09-29"]);
    // An EXDATE that matches no generated date suppresses nothing and is not listed.
    expect(series("20260915T180000", "FREQ=WEEKLY;COUNT=3", { exdates: ["20260923"] })).toMatchObject({ excluded: [], occurrences: [{ date: "2026-09-15" }, { date: "2026-09-22" }, { date: "2026-09-29" }] });
  });

  it("UNTIL across the November DST change: 6 PM stays 6 PM local and the UTC offset shifts", () => {
    expect(series("20261020T180000", "FREQ=WEEKLY;UNTIL=20261115").occurrences).toEqual([
      { date: "2026-10-20", instants: [tz("2026-10-21T01:00:00Z")], civil: "exact" },
      { date: "2026-10-27", instants: [tz("2026-10-28T01:00:00Z")], civil: "exact" },
      { date: "2026-11-03", instants: [tz("2026-11-04T02:00:00Z")], civil: "exact" },
      { date: "2026-11-10", instants: [tz("2026-11-11T02:00:00Z")], civil: "exact" }
    ]);
  });

  it("UNTIL drives generation directly, with no count estimate", () => {
    const result = series("20260915T180000", "FREQ=WEEKLY;UNTIL=20261231");
    expect(result.occurrences).toHaveLength(16);
    expect(result.occurrences.at(-1)!.date).toBe("2026-12-29");
  });

  it("a window starting mid-series still honors COUNT from the origin", () => {
    const result = series("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6", { window: { start: "2026-09-22", end: "2026-12-31" } });
    expect(dates(result)).toEqual(["2026-09-23", "2026-09-28", "2026-09-30"]);
  });

  it("excluded lists only suppressed dates inside the window", () => {
    const result = series("20260915T180000", "FREQ=WEEKLY;COUNT=5", { exdates: ["20260922T180000", "20261006T180000"], window: { start: "2026-09-30", end: "2026-12-31" } });
    expect(dates(result)).toEqual(["2026-10-13"]);
    expect(result.excluded).toEqual(["2026-10-06"]);
  });

  it("02:30 on the spring-forward date is a gap with no instant and no chosen policy", () => {
    expect(series("20260307T023000", "FREQ=DAILY;COUNT=3").occurrences).toEqual([
      { date: "2026-03-07", instants: [tz("2026-03-07T10:30:00Z")], civil: "exact" },
      { date: "2026-03-08", instants: [], civil: "gap" },
      { date: "2026-03-09", instants: [tz("2026-03-09T09:30:00Z")], civil: "exact" }
    ]);
  });

  it("01:30 on the fall-back date is a fold with both instants, earliest first", () => {
    expect(series("20261031T013000", "FREQ=DAILY;COUNT=3").occurrences).toEqual([
      { date: "2026-10-31", instants: [tz("2026-10-31T08:30:00Z")], civil: "exact" },
      { date: "2026-11-01", instants: [tz("2026-11-01T08:30:00Z"), tz("2026-11-01T09:30:00Z")], civil: "fold" },
      { date: "2026-11-02", instants: [tz("2026-11-02T09:30:00Z")], civil: "exact" }
    ]);
  });

  it("a missing timezone snapshot is a need, not a guess, and yields no occurrences", () => {
    const result = series("20260915T180000", "FREQ=WEEKLY;COUNT=4", { context: [] });
    expect(result).toMatchObject({ occurrences: [], excluded: [], needs: [{ kind: "timezone", requiredBy: "expression.point" }] });
  });

  it("without a clock point, occurrences are date-only and need no timezone", () => {
    const result = resolveSeries({ expression: compound({ kind: "repeat", every: 1, unit: "week", mode: "civil" }, { kind: "selection", filter: { kind: "weekday", value: "friday" }, selector: { kind: "all" } }), lifecycle: lifecycleFrom(2026, 9, 14), horizon: { kind: "count", value: 2 }, window: WIDE });
    expect(result).toMatchObject({ ok: true, value: { occurrences: [{ date: "2026-09-18", instants: [], civil: "date_only" }, { date: "2026-09-25", instants: [], civil: "date_only" }], needs: [] } });
  });

  it("a missing lifecycle origin is a need", () => {
    const result = resolveSeries({ expression: compound({ kind: "repeat", every: 1, unit: "week", mode: "civil" }), lifecycle: { status: "active", version: 1 }, window: WIDE });
    expect(result).toMatchObject({ ok: true, value: { occurrences: [], needs: [{ kind: "feature", requiredBy: "lifecycle.effectiveFrom" }] } });
  });

  it("maxOccurrences caps generation and reports truncation", () => {
    const capped = series("20260915T180000", "FREQ=WEEKLY", { maxOccurrences: 3 });
    expect(dates(capped)).toEqual(["2026-09-15", "2026-09-22", "2026-09-29"]);
    expect(capped.truncated).toBe(true);
    expect(series("20260915T180000", "FREQ=WEEKLY;COUNT=3", { maxOccurrences: 3 }).truncated).toBe(false);
    expect(series("20260915T180000", "FREQ=WEEKLY", { window: { start: "2026-09-01", end: "2026-09-29" }, maxOccurrences: 3 }).truncated).toBe(false);
    expect(series("20260915T180000", "FREQ=WEEKLY").occurrences).toHaveLength(68); // no horizon: runs to window end
  });

  it("stops at lifecycle.effectiveUntil: an intent produces no occurrences after it ends", () => {
    const source = imported("20260915T180000", "FREQ=WEEKLY;COUNT=10");
    const result = resolveSeries({ expression: source.expression, lifecycle: { ...source.lifecycle, effectiveUntil: { kind: "date", calendar: "iso8601", year: 2026, month: 10, day: 6 } }, horizon: source.horizon!, window: WIDE, context: [LA] });
    expect(result).toMatchObject({ ok: true, value: { occurrences: [{ date: "2026-09-15" }, { date: "2026-09-22" }, { date: "2026-09-29" }, { date: "2026-10-06" }], truncated: false } });
    if (result.ok) expect(result.value.occurrences).toHaveLength(4);
  });

  it("identity is stable over the canonical request and moves with any of its inputs", () => {
    const base = series("20260915T180000", "FREQ=WEEKLY;COUNT=4");
    expect(series("20260915T180000", "FREQ=WEEKLY;COUNT=4").id).toBe(base.id);
    expect(base.id).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(series("20260915T180000", "FREQ=WEEKLY;COUNT=4", { window: { start: "2026-01-01", end: "2027-12-30" } }).id).not.toBe(base.id);
    expect(series("20260915T180000", "FREQ=WEEKLY;COUNT=5").id).not.toBe(base.id);
    expect(series("20260915T180000", "FREQ=WEEKLY;COUNT=4", { maxOccurrences: 2 }).id).not.toBe(base.id); // a capped result is a different result
  });
});

describe("resolveSeries: agreement with resolveExpression's repeatDates", () => {
  const cases: ReadonlyArray<readonly ["day" | "week" | "month" | "year", number, IntentLifecycle]> = [
    ["month", 1, lifecycleFrom(2026, 1, 31)],
    ["month", 1, lifecycleFrom(2026, 8, 31)],
    ["month", 5, lifecycleFrom(2027, 3, 31)],
    ["year", 1, lifecycleFrom(2028, 2, 29)],
    ["week", 3, lifecycleFrom(2026, 12, 28)],
    ["day", 10, lifecycleFrom(2026, 12, 25)]
  ];
  it("produces the same dates, including month-end clamping (Jan 31 + 1 month)", () => {
    for (const [unit, every, lifecycle] of cases) {
      const expression = compound(clock(9), { kind: "repeat", every, unit, mode: "civil" });
      const reference = resolveExpression({ expression, lifecycle, referenceTime: "2026-01-01T00:00:00Z", horizon: { kind: "count", value: 14 }, context: [LA] });
      if (!reference.ok) throw new Error("expected resolution");
      const expected = reference.value.candidates.map((candidate) => (candidate.value.value as { date: string; instants: ReadonlyArray<string> }));
      const result = resolveSeries({ expression, lifecycle, horizon: { kind: "count", value: 14 }, window: { start: "2026-01-01", end: "2045-12-31" }, context: [LA] });
      if (!result.ok) throw new Error("expected series");
      expect(result.value.occurrences.map(({ date, instants }) => ({ date, instants }))).toEqual(expected);
    }
    const clamped = resolveSeries({ expression: compound({ kind: "repeat", every: 1, unit: "month", mode: "civil" }), lifecycle: lifecycleFrom(2026, 1, 31), horizon: { kind: "count", value: 4 }, window: WIDE });
    expect(clamped).toMatchObject({ ok: true, value: { occurrences: [{ date: "2026-01-31" }, { date: "2026-02-28" }, { date: "2026-03-31" }, { date: "2026-04-30" }] } });
  });
});

describe("resolveSeries: unsupported shapes fail closed", () => {
  const repeatWeek: TemporalExpression = { kind: "repeat", every: 1, unit: "week", mode: "civil" };
  const expectCapability = (expression: CompoundExpression, horizon?: SeriesRequest["horizon"]) => {
    const result = resolveSeries({ expression, lifecycle: lifecycleFrom(2026, 9, 15), ...(horizon ? { horizon } : {}), window: WIDE, context: [LA] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatchObject({ category: "capability", details: { lossReport: { fidelity: "unsupported", preserved: [], discarded: expect.any(Array), consequences: [expect.any(String)] } } });
  };

  it("rejects a condition", () => expectCapability(compound(clock(9), repeatWeek, { kind: "condition", mode: "gate", predicate: { kind: "state", reference: "@open" } })));
  it("rejects an offset", () => expectCapability(compound(clock(9), repeatWeek, { kind: "offset", amount: { value: 1, unit: "day", mode: "calendar" } })));
  it("rejects a selection under a day repeat", () => expectCapability(compound(clock(9), { kind: "repeat", every: 1, unit: "day", mode: "civil" }, { kind: "selection", filter: { kind: "weekday", value: "monday" }, selector: { kind: "all" } })));
  it("rejects a selection under a year repeat", () => expectCapability(compound(clock(9), { kind: "repeat", every: 1, unit: "year", mode: "civil" }, { kind: "selection", filter: { kind: "weekday", value: "monday" }, selector: { kind: "ordinal", value: 1 } })));
  it("rejects an ordinal selection under a week repeat", () => expectCapability(compound(clock(9), repeatWeek, { kind: "selection", filter: { kind: "weekday", value: "monday" }, selector: { kind: "ordinal", value: 2 } })));
  it("rejects a non-weekday selection", () => expectCapability(compound(clock(9), { kind: "repeat", every: 1, unit: "month", mode: "civil" }, { kind: "selection", filter: { kind: "business_day" }, selector: { kind: "all" } })));
  it("rejects an exception that is not an @exdate marker", () => expectCapability(compound(clock(9), repeatWeek, { kind: "exception", predicate: { kind: "state", reference: "@holiday" }, effect: "suppress" })));
  it("rejects a malformed @exdate token", () => expectCapability(compound(clock(9), repeatWeek, { kind: "exception", predicate: { kind: "expression", reference: "@exdate:2026-09-22" }, effect: "suppress" })));
  it("rejects zero or two repeats, elapsed and quarter repeats", () => {
    expectCapability(compound(clock(9)));
    expectCapability(compound(clock(9), repeatWeek, repeatWeek));
    expectCapability(compound(clock(9), { kind: "repeat", every: 1, unit: "day", mode: "elapsed" }));
    expectCapability(compound(clock(9), { kind: "repeat", every: 1, unit: "quarter", mode: "civil" }));
  });
  it("rejects a date point and two clock points", () => {
    expectCapability(compound({ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 9, day: 15 } }, repeatWeek));
    expectCapability(compound(clock(9), clock(10), repeatWeek));
  });
  it("rejects relation, window, boundary, duration, and adjustment", () => {
    expectCapability(compound(clock(9), repeatWeek, { kind: "relation", relation: "after", anchor: { kind: "event", reference: "@x" } }));
    expectCapability(compound(clock(9), repeatWeek, { kind: "window", value: { kind: "semantic_window", name: "morning" } }));
    expectCapability(compound(clock(9), repeatWeek, { kind: "boundary", operator: "by", value: { kind: "date", calendar: "iso8601", year: 2026, month: 12, day: 1 } }));
    expectCapability(compound(clock(9), repeatWeek, { kind: "duration", amount: { value: 1, unit: "hour", mode: "elapsed" }, role: "window_span" }));
    expectCapability(compound(clock(9), repeatWeek, { kind: "adjustment", when: { kind: "state", reference: "@x" }, operation: { kind: "preserve", aspect: "local_civil_time" } }));
  });
  it("rejects a duration horizon as a capability error", () => expectCapability(compound(clock(9), repeatWeek), { kind: "duration", value: { value: 1, unit: "month", mode: "calendar" } }));

  it("rejects malformed windows, counts, and caps as request errors", () => {
    const expression = compound(clock(9), repeatWeek);
    const lifecycle = lifecycleFrom(2026, 9, 15);
    for (const request of [
      { expression, lifecycle, window: { start: "2026-12-31", end: "2026-01-01" } },
      { expression, lifecycle, window: { start: "2026-02-30", end: "2026-12-31" } },
      { expression, lifecycle, window: WIDE, horizon: { kind: "count", value: 0 } },
      { expression, lifecycle, window: WIDE, maxOccurrences: 0 }
    ] as SeriesRequest[]) expect(resolveSeries(request)).toMatchObject({ ok: false, errors: [{ category: "resolution", code: "DECAN-SERIES-REQUEST-INVALID" }] });
  });
});

describe("resolveSeries: validation interplay", () => {
  it("validateDocument accepts a week-scoped weekday selection imported from RRULE", () => {
    const source = imported("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6");
    expect(validateDocument({ expression: source.expression, references: [], context: [], lifecycle: source.lifecycle })).toMatchObject({ ok: true, value: { status: "valid", errors: [] } });
    // As on the monthly path, an @exdate marker is a reference and must be declared to validate.
    const withExdate = imported("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6", ["20260916T180000"]);
    expect(validateDocument({ expression: withExdate.expression, references: [{ id: "exdate:20260916T180000", kind: "custom", status: "resolved" }], context: [], lifecycle: withExdate.lifecycle })).toMatchObject({ ok: true, value: { status: "valid" } });
  });
});

describe("resolveSeries: docs/examples.md", () => {
  it("keeps the weekly MO,WE + EXDATE series example executable", () => {
    const zone = timezoneSnapshot({ id: "America/Los_Angeles", version: "tzdb-2026a", initialOffsetMinutes: -420, transitions: [{ at: "2026-11-01T09:00:00Z", offsetMinutes: -480 }] });
    const source = importRRule({ dtstart: "20260914T180000", rrule: "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6", exdates: ["20260921T180000"] });
    if (!source.ok) throw new Error("unsupported RRULE");
    const result = resolveSeries({ expression: source.value.expression, lifecycle: source.value.lifecycle, ...(source.value.horizon ? { horizon: source.value.horizon } : {}), window: { start: "2026-09-01", end: "2026-09-30" }, context: [zone] });
    if (!result.ok) throw new Error("expected series");
    expect(result.value.occurrences.map((occurrence) => occurrence.date)).toEqual(["2026-09-14", "2026-09-16", "2026-09-23", "2026-09-28", "2026-09-30"]);
    expect(result.value.occurrences[0]).toEqual({ date: "2026-09-14", instants: ["2026-09-15T01:00:00Z[America/Los_Angeles]"], civil: "exact" });
    expect(result.value.excluded).toEqual(["2026-09-21"]);
  });
});
