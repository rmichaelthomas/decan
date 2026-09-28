import { Temporal } from "@js-temporal/polyfill";
import { sha256 } from "../canonical/identity.js";
import type { ClockValue, CompoundExpression, ContextSnapshot, HashIdentity, IntentLifecycle, OperationResult, ResolutionHorizon, ResolutionNeed, SelectionExpression, TemporalError, Weekday } from "../model/types.js";
import { resolveCivilTime } from "./civil-time.js";

export type SeriesWindow = Readonly<{ start: string; end: string }>;
export type SeriesRequest = Readonly<{
  expression: CompoundExpression;
  lifecycle: IntentLifecycle;
  horizon?: ResolutionHorizon;
  window: SeriesWindow;
  context?: ReadonlyArray<ContextSnapshot>;
  maxOccurrences?: number;
}>;
export type SeriesOccurrence = Readonly<{
  date: string;
  instants: ReadonlyArray<string>;
  civil: "exact" | "gap" | "fold" | "date_only";
}>;
export type SeriesResult = Readonly<{
  id: HashIdentity;
  occurrences: ReadonlyArray<SeriesOccurrence>;
  excluded: ReadonlyArray<string>;
  needs: ReadonlyArray<ResolutionNeed>;
  truncated: boolean;
}>;

const DEFAULT_MAX_OCCURRENCES = 1000;
const EXDATE_PREFIX = "@exdate:";
const weekdayNumbers: Record<Weekday, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };

const unsupported = (code: string, message: string, discarded: ReadonlyArray<string>): OperationResult<never> => ({ ok: false, errors: [{ category: "capability", code, message, details: { lossReport: { target: "series", operation: "resolve", fidelity: "unsupported", preserved: [], discarded, assumptions: [], consequences: [message], remediation: "Resolve this expression with resolveExpression, or reduce it to a repeat stride, weekday selections, one clock point, and @exdate exceptions." } }, remediation: "correct_source" } satisfies TemporalError] });
const invalid = (message: string): OperationResult<never> => ({ ok: false, errors: [{ category: "resolution", code: "DECAN-SERIES-REQUEST-INVALID", message, remediation: "correct_source" } satisfies TemporalError] });
const plainDate = (value: string): Temporal.PlainDate | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  try { return Temporal.PlainDate.from(value, { overflow: "reject" }); } catch { return undefined; }
};
/** Basic-form EXDATE token (`YYYYMMDD` or `YYYYMMDDTHHMMSS`) to its civil date; the time part only has to be well-formed. */
const exdateDate = (token: string): string | undefined => {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?$/.exec(token);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second] = match;
  if (hour !== undefined && (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59)) return undefined;
  return plainDate(`${year}-${month}-${day}`)?.toString();
};
const validClock = (clock: ClockValue): boolean => [clock.hour, clock.minute, clock.second ?? 0].every(Number.isInteger) && clock.hour >= 0 && clock.hour <= 23 && clock.minute >= 0 && clock.minute <= 59 && (clock.second ?? 0) >= 0 && (clock.second ?? 0) <= 59;
const ordered = (items: ReadonlyArray<ContextSnapshot>): ReadonlyArray<ContextSnapshot> => [...items].sort((left, right) => {
  const leftKey = sha256(left);
  const rightKey = sha256(right);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
});

/** Dates in one period (ISO week or calendar month) matched by any selection, ascending. */
const selectedDates = (periodStart: Temporal.PlainDate, unit: "week" | "month", selections: ReadonlyArray<SelectionExpression>): ReadonlyArray<Temporal.PlainDate> => {
  const days = unit === "week" ? Array.from({ length: 7 }, (_, index) => periodStart.add({ days: index })) : Array.from({ length: periodStart.daysInMonth }, (_, index) => periodStart.add({ days: index }));
  const picked = new Set<string>();
  for (const selection of selections) {
    if (selection.filter?.kind !== "weekday") continue;
    const target = weekdayNumbers[selection.filter.value];
    const matching = days.filter((day) => day.dayOfWeek === target);
    if (selection.selector.kind === "all") matching.forEach((day) => picked.add(day.toString()));
    else if (selection.selector.kind === "ordinal") {
      const day = selection.selector.value === -1 ? matching.at(-1) : matching[selection.selector.value - 1];
      if (day) picked.add(day.toString());
    }
  }
  return [...picked].sort().map((value) => Temporal.PlainDate.from(value));
};

/**
 * Composes a civil repeat stride, week- or month-scoped weekday selections, one optional clock
 * point, per-date `@exdate:` suppression, and a COUNT/UNTIL horizon into a finite occurrence list
 * over a caller-supplied window. Instants come only from the supplied timezone snapshot; gaps and
 * folds are reported, never resolved by policy. `resolveExpression` is not involved and unchanged.
 */
export function resolveSeries(request: SeriesRequest): OperationResult<SeriesResult> {
  const expression = request.expression;
  if (expression?.kind !== "compound") return unsupported("DECAN-SERIES-UNSUPPORTED", "resolveSeries requires a compound expression.", ["expression"]);

  // -- shape ----------------------------------------------------------------------------------
  const nodes = expression.expressions;
  const outside = nodes.map((node, index) => ({ node, index })).filter(({ node }) => !["repeat", "point", "selection", "exception"].includes(node.kind));
  if (outside.length > 0) return unsupported("DECAN-SERIES-UNSUPPORTED", `resolveSeries does not model ${[...new Set(outside.map(({ node }) => node.kind))].join(", ")} expressions; they have their own semantics in resolveExpression and are not reinterpreted here.`, outside.map(({ node, index }) => `expression.expressions[${index}] (${node.kind})`));
  const repeats = nodes.flatMap((node) => node.kind === "repeat" ? [node] : []);
  if (repeats.length !== 1) return unsupported("DECAN-SERIES-UNSUPPORTED", "resolveSeries requires exactly one repeat expression.", ["repeat"]);
  const repeat = repeats[0]!;
  if (repeat.mode !== "civil" || !["day", "week", "month", "year"].includes(repeat.unit) || !Number.isInteger(repeat.every) || repeat.every < 1) return unsupported("DECAN-SERIES-UNSUPPORTED", "resolveSeries requires a civil repeat with a positive integer stride and unit day, week, month, or year.", [`repeat(${repeat.unit}, ${repeat.mode ?? "unspecified"})`]);
  const points = nodes.flatMap((node) => node.kind === "point" ? [node] : []);
  if (points.length > 1) return unsupported("DECAN-SERIES-UNSUPPORTED", "resolveSeries accepts at most one clock point.", ["point"]);
  const clock = points[0]?.value;
  if (clock !== undefined && (clock.kind !== "clock" || !validClock(clock))) return unsupported("DECAN-SERIES-UNSUPPORTED", "resolveSeries accepts only a valid local clock point.", [`point(${clock.kind})`]);
  const selections = nodes.flatMap((node) => node.kind === "selection" ? [node] : []);
  if (selections.length > 0) {
    if (repeat.unit !== "week" && repeat.unit !== "month") return unsupported("DECAN-SERIES-UNSUPPORTED", `resolveSeries scopes selections to a week or month period; selections under repeat(${repeat.unit}) are not modeled.`, ["selection"]);
    const allowed = (selection: SelectionExpression): boolean => selection.filter?.kind === "weekday" && (selection.selector.kind === "all" || (repeat.unit === "month" && selection.selector.kind === "ordinal" && [1, 2, 3, 4, 5, -1].includes(selection.selector.value)));
    if (!selections.every(allowed)) return unsupported("DECAN-SERIES-UNSUPPORTED", repeat.unit === "week" ? "Under repeat(week), resolveSeries accepts only weekday selections with the all selector." : "Under repeat(month), resolveSeries accepts only weekday selections with the all selector or an ordinal of 1-5 or -1.", ["selection"]);
  }
  const exceptions = nodes.flatMap((node) => node.kind === "exception" ? [node] : []);
  const exdates = new Set<string>();
  for (const exception of exceptions) {
    const reference = exception.predicate.reference;
    const date = reference.startsWith(EXDATE_PREFIX) ? exdateDate(reference.slice(EXDATE_PREFIX.length)) : undefined;
    if (!date) return unsupported("DECAN-SERIES-UNSUPPORTED", "resolveSeries models only @exdate: exceptions with a basic YYYYMMDD or YYYYMMDDTHHMMSS token; other exceptions are predicate gates in resolveExpression.", [`exception(${reference})`]);
    exdates.add(date);
  }

  // -- request --------------------------------------------------------------------------------
  const horizon = request.horizon;
  if (horizon?.kind === "duration") return unsupported("DECAN-SERIES-HORIZON-UNSUPPORTED", "resolveSeries supports count and until horizons only; a duration horizon is not modeled.", ["horizon.duration"]);
  if (horizon?.kind === "count" && (!Number.isInteger(horizon.value) || horizon.value < 1)) return invalid("A count horizon must be a positive integer.");
  const until = horizon?.kind === "until" ? plainDate(String(horizon.value).slice(0, 10)) : undefined;
  if (horizon?.kind === "until" && !until) return invalid("An until horizon must start with a valid YYYY-MM-DD date.");
  const windowStart = plainDate(request.window?.start ?? "");
  const windowEnd = plainDate(request.window?.end ?? "");
  if (!windowStart || !windowEnd || Temporal.PlainDate.compare(windowStart, windowEnd) > 0) return invalid("The window must be two valid YYYY-MM-DD dates with start on or before end.");
  const maxOccurrences = request.maxOccurrences ?? DEFAULT_MAX_OCCURRENCES;
  if (!Number.isInteger(maxOccurrences) || maxOccurrences < 1) return invalid("maxOccurrences must be a positive integer.");

  const context = request.context ?? [];
  const id = sha256({ expression, lifecycle: request.lifecycle, ...(horizon ? { horizon } : {}), window: { start: request.window.start, end: request.window.end }, context: ordered(context), maxOccurrences });
  const needs: ResolutionNeed[] = [];
  const origin = request.lifecycle?.effectiveFrom;
  if (!origin) needs.push({ kind: "feature", requiredBy: "lifecycle.effectiveFrom", reason: "Recurrence requires an explicit lifecycle origin." });
  const zone = context.find((item) => item.kind === "timezone");
  const zoneValue = zone && typeof zone.value === "object" && zone.value !== null && "initialOffsetMinutes" in zone.value && "transitions" in zone.value ? zone.value as Readonly<{ initialOffsetMinutes: number; transitions: ReadonlyArray<{ at: string; offsetMinutes: number }> }> : undefined;
  if (clock && !zoneValue) needs.push({ kind: "timezone", requiredBy: "expression.point", reason: "Missing timezone snapshot" });
  if (!origin) return { ok: true, value: { id, occurrences: [], excluded: [], needs, truncated: false } };

  // -- generation: always from the origin, never from the window start -------------------------
  const start = Temporal.PlainDate.from({ year: origin.year, month: origin.month, day: origin.day });
  // Generation ends at the earliest of UNTIL, the intent's lifecycle end, and the window end.
  const lifecycleEnd = request.lifecycle.effectiveUntil ? Temporal.PlainDate.from({ year: request.lifecycle.effectiveUntil.year, month: request.lifecycle.effectiveUntil.month, day: request.lifecycle.effectiveUntil.day }) : undefined;
  const stop = [until, lifecycleEnd].reduce<Temporal.PlainDate>((earliest, bound) => bound && Temporal.PlainDate.compare(bound, earliest) < 0 ? bound : earliest, windowEnd);
  const periodStart = (index: number): Temporal.PlainDate => {
    const every = repeat.every * index;
    if (selections.length === 0) return repeat.unit === "day" ? start.add({ days: every }) : repeat.unit === "week" ? start.add({ weeks: every }) : repeat.unit === "month" ? start.add({ months: every }) : start.add({ years: every });
    return repeat.unit === "week" ? start.subtract({ days: start.dayOfWeek - 1 }).add({ weeks: every }) : start.with({ day: 1 }).add({ months: every });
  };
  const generated: string[] = [];
  let truncated = false;
  generation: for (let index = 0; ; index++) {
    const period = periodStart(index);
    if (Temporal.PlainDate.compare(period, stop) > 0) break;
    const dates = selections.length === 0 ? [period] : selectedDates(period, repeat.unit as "week" | "month", selections);
    for (const date of dates) {
      if (Temporal.PlainDate.compare(date, start) < 0) continue;
      if (Temporal.PlainDate.compare(date, stop) > 0) break generation;
      if (horizon?.kind === "count" && generated.length >= horizon.value) break generation;
      if (generated.length >= maxOccurrences) { truncated = true; break generation; }
      generated.push(date.toString());
    }
  }

  const inWindow = generated.filter((date) => date >= windowStart.toString());
  const excluded = inWindow.filter((date) => exdates.has(date));
  if (needs.length > 0) return { ok: true, value: { id, occurrences: [], excluded: [], needs, truncated } };
  const occurrences = inWindow.filter((date) => !exdates.has(date)).map((date): SeriesOccurrence => {
    if (!clock || clock.kind !== "clock" || !zone || !zoneValue) return { date, instants: [], civil: "date_only" };
    const plain = Temporal.PlainDate.from(date);
    const instants = resolveCivilTime({ id: zone.id, version: zone.version, initialOffsetMinutes: zoneValue.initialOffsetMinutes, transitions: zoneValue.transitions, year: plain.year, month: plain.month, day: plain.day, hour: clock.hour, minute: clock.minute, ...(clock.second === undefined ? {} : { second: clock.second }) }).candidates;
    return { date, instants, civil: instants.length === 0 ? "gap" : instants.length > 1 ? "fold" : "exact" };
  });
  return { ok: true, value: { id, occurrences, excluded, needs, truncated } };
}
