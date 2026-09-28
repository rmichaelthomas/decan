import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { importRRule, resolveSeries, timezoneSnapshot } from "../../src/index.js";

/**
 * Independent brute-force reference. It shares no code with the resolver: it walks every civil day
 * from the origin as a UTC day number and tests membership straight from the RRULE parts.
 */
const DAY = 86_400_000;
const CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
type Code = typeof CODES[number];
type Token = Readonly<{ code: Code; ordinal?: 1 | 2 | 3 | 4 | 5 | -1 }>;
type Rule = Readonly<{ freq: "WEEKLY" | "MONTHLY" | "DAILY"; interval: number; byday: ReadonlyArray<Token>; count?: number; untilOffset?: number }>;

const dayNumber = (iso: string): number => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / DAY;
const isoOf = (day: number): string => new Date(day * DAY).toISOString().slice(0, 10);
const isoWeekday = (day: number): number => ((((day + 3) % 7) + 7) % 7) + 1; // 1970-01-01 was a Thursday (4)
const parts = (day: number) => { const date = new Date(day * DAY); return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, dom: date.getUTCDate(), length: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate() }; };
const basic = (iso: string): string => iso.replace(/-/g, "");

function referenceDates(rule: Rule, origin: string): string[] {
  const start = dayNumber(origin);
  const until = rule.untilOffset === undefined ? undefined : start + rule.untilOffset;
  const set = rule.byday.length > 0 ? rule.byday : [{ code: CODES[isoWeekday(start) - 1]! }];
  const originWeekMonday = start - (isoWeekday(start) - 1);
  const originMonth = parts(start).year * 12 + parts(start).month;
  const matches = (day: number): boolean => {
    const weekday = isoWeekday(day);
    if (rule.freq === "DAILY") return set.some((token) => CODES.indexOf(token.code) + 1 === weekday);
    if (rule.freq === "WEEKLY") {
      const weeks = (day - (weekday - 1) - originWeekMonday) / 7;
      return weeks % rule.interval === 0 && set.some((token) => CODES.indexOf(token.code) + 1 === weekday);
    }
    const { year, month, dom, length } = parts(day);
    if ((year * 12 + month - originMonth) % rule.interval !== 0) return false;
    return set.some((token) => {
      if (CODES.indexOf(token.code) + 1 !== weekday) return false;
      if (token.ordinal === undefined) return true;
      if (token.ordinal === -1) return dom + 7 > length;
      return Math.ceil(dom / 7) === token.ordinal;
    });
  };
  const out: string[] = [];
  for (let day = start; day <= start + 366 * 25; day++) {
    if (until !== undefined && day > until) break;
    if (rule.count !== undefined && out.length >= rule.count) break;
    if (matches(day)) out.push(isoOf(day));
  }
  return out;
}

const LA = timezoneSnapshot({ id: "America/Los_Angeles", version: "test-2026-2027", initialOffsetMinutes: -480, transitions: [
  { at: "2026-03-08T10:00:00Z", offsetMinutes: -420 }, { at: "2026-11-01T09:00:00Z", offsetMinutes: -480 },
  { at: "2027-03-14T10:00:00Z", offsetMinutes: -420 }, { at: "2027-11-07T09:00:00Z", offsetMinutes: -480 }] });

const token = (monthly: boolean): fc.Arbitrary<Token> => fc.record({ code: fc.constantFrom(...CODES), ordinal: monthly ? fc.option(fc.constantFrom(1, 2, 3, 4, 5, -1) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | -1>, { nil: undefined }) : fc.constant(undefined) }).map(({ code, ordinal }) => ordinal === undefined ? { code } : { code, ordinal });
const uniqueTokens = (tokens: ReadonlyArray<Token>): Token[] => [...new Map(tokens.map((item) => [`${item.ordinal ?? ""}${item.code}`, item])).values()];
const horizon = fc.oneof(fc.record({ count: fc.integer({ min: 1, max: 40 }) }), fc.record({ untilOffset: fc.integer({ min: 0, max: 420 }) }));
const rule: fc.Arbitrary<Rule> = fc.oneof(
  fc.record({ freq: fc.constant("WEEKLY" as const), interval: fc.integer({ min: 1, max: 4 }), byday: fc.array(token(false), { maxLength: 7 }), horizon }),
  fc.record({ freq: fc.constant("MONTHLY" as const), interval: fc.integer({ min: 1, max: 4 }), byday: fc.array(token(true), { minLength: 1, maxLength: 4 }), horizon }),
  fc.record({ freq: fc.constant("DAILY" as const), interval: fc.constant(1), byday: fc.array(token(false), { minLength: 1, maxLength: 7 }), horizon })
).map(({ horizon: bound, byday, ...rest }) => ({ ...rest, byday: uniqueTokens(byday), ...bound }));

const rruleText = (value: Rule, origin: string): string => [
  `FREQ=${value.freq}`, `INTERVAL=${value.interval}`,
  ...(value.byday.length > 0 ? [`BYDAY=${value.byday.map((item) => `${item.ordinal ?? ""}${item.code}`).join(",")}`] : []),
  ...(value.count !== undefined ? [`COUNT=${value.count}`] : []),
  ...(value.untilOffset !== undefined ? [`UNTIL=${basic(isoOf(dayNumber(origin) + value.untilOffset))}`] : [])
].join(";");

// Origins fall between 2026-11-01 and 2027-01-31 so windows routinely cross the ISO week 53/1 boundary.
const ORIGIN_START = dayNumber("2026-11-01");
const SEED = 20260928;

describe("resolveSeries property: importRRule -> resolveSeries equals a brute-force reference", () => {
  it("agrees on dates, exclusions, and window clipping for random supported rules", () => {
    fc.assert(fc.property(
      rule,
      fc.integer({ min: 0, max: 91 }),
      fc.integer({ min: -30, max: 120 }),
      fc.integer({ min: 0, max: 500 }),
      fc.array(fc.nat(), { maxLength: 3 }),
      (value, originOffset, windowLead, windowLength, exdatePicks) => {
        const origin = isoOf(ORIGIN_START + originOffset);
        const generated = referenceDates(value, origin);
        const exdates = [...new Set(generated.length === 0 ? [] : exdatePicks.map((pick) => generated[pick % generated.length]!))];
        const window = { start: isoOf(dayNumber(origin) + windowLead), end: isoOf(dayNumber(origin) + windowLead + windowLength) };
        const inWindow = generated.filter((date) => date >= window.start && date <= window.end);
        const expected = inWindow.filter((date) => !exdates.includes(date));

        const source = importRRule({ dtstart: `${basic(origin)}T180000`, rrule: rruleText(value, origin), ...(exdates.length > 0 ? { exdates: exdates.map((date) => `${basic(date)}T180000`) } : {}) });
        if (!source.ok) throw new Error(`import rejected ${rruleText(value, origin)}: ${source.errors[0]?.message}`);
        const result = resolveSeries({ expression: source.value.expression, lifecycle: source.value.lifecycle, ...(source.value.horizon ? { horizon: source.value.horizon } : {}), window, context: [LA] });
        if (!result.ok) throw new Error(`series rejected ${rruleText(value, origin)}: ${result.errors[0]?.message}`);

        expect(result.value.occurrences.map((occurrence) => occurrence.date)).toEqual(expected);
        expect(result.value.excluded).toEqual(inWindow.filter((date) => exdates.includes(date)));
        expect(result.value.truncated).toBe(false);
        expect(result.value.needs).toEqual([]);
      }
    ), { numRuns: 500, seed: SEED });
  });

  it("covers the fixed 2026-12 to 2027-01 window for every weekday set at INTERVAL 1-4", () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 4 }),
      fc.subarray([...CODES], { minLength: 1 }),
      fc.integer({ min: 0, max: 45 }),
      (interval, codes, originOffset) => {
        const origin = isoOf(ORIGIN_START + originOffset);
        const value: Rule = { freq: "WEEKLY", interval, byday: codes.map((code) => ({ code })), count: 200 };
        const window = { start: "2026-12-01", end: "2027-01-31" };
        const expected = referenceDates(value, origin).filter((date) => date >= window.start && date <= window.end);
        const source = importRRule({ dtstart: `${basic(origin)}T180000`, rrule: rruleText(value, origin) });
        if (!source.ok) throw new Error("import rejected");
        const result = resolveSeries({ expression: source.value.expression, lifecycle: source.value.lifecycle, ...(source.value.horizon ? { horizon: source.value.horizon } : {}), window, context: [LA] });
        if (!result.ok) throw new Error("series rejected");
        expect(result.value.occurrences.map((occurrence) => occurrence.date)).toEqual(expected);
      }
    ), { numRuns: 200, seed: SEED });
  });
});
