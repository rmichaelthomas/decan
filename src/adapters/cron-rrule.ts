import { Temporal } from "@js-temporal/polyfill";
import type { CompoundExpression, DateValue, Diagnostic, ExceptionExpression, IntentLifecycle, OperationResult, PointExpression, RepeatExpression, ResolutionHorizon, SelectionExpression, TemporalError, TemporalExpression, TemporalSelector, Weekday } from "../model/types.js";
import { exactLossReport, unsupportedLossReport, type TemporalLossReport } from "./loss-report.js";

export type ImportedScheduleSource = Readonly<{ kind: "imported_cron" | "imported_rrule"; value: string }>;
export type ScheduleAdapterImport = Readonly<{
  source: ImportedScheduleSource;
  expression: CompoundExpression;
  lifecycle: IntentLifecycle;
  horizon?: ResolutionHorizon;
  diagnostics: ReadonlyArray<Pick<Diagnostic, "code" | "message">>;
  lossReport: TemporalLossReport;
}>;
export type CronImportRequest = Readonly<{ cron: string; effectiveFrom: DateValue }>;
export type RRuleImportRequest = Readonly<{ dtstart: string; rrule: string; exdates?: ReadonlyArray<string> }>;
export type RRuleExportRequest = Readonly<{ expression: TemporalExpression; lifecycle: IntentLifecycle; horizon?: ResolutionHorizon }>;
export type RRuleExport = Readonly<{ contentLines: ReadonlyArray<string>; diagnostics: ReadonlyArray<Pick<Diagnostic, "code" | "message">>; lossReport: TemporalLossReport }>;

// -- shared weekday vocabularies --------------------------------------------------------------
const weekdayNumbers: Record<string, number> = { SU: 7, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const weekdayCodes: Record<number, string> = { 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA", 7: "SU" };
const weekdayNames: Record<string, Weekday> = { MO: "monday", TU: "tuesday", WE: "wednesday", TH: "thursday", FR: "friday", SA: "saturday", SU: "sunday" };
const weekdayNameCodes: Record<Weekday, string> = { monday: "MO", tuesday: "TU", wednesday: "WE", thursday: "TH", friday: "FR", saturday: "SA", sunday: "SU" };

// -- FREQ <-> Decan repeat unit --------------------------------------------------------------
type RepeatUnit = RepeatExpression["unit"];
const freqToUnit: Readonly<Record<string, RepeatUnit | undefined>> = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" };
const unitToFreq: Readonly<Partial<Record<RepeatUnit, string>>> = { day: "DAILY", week: "WEEKLY", month: "MONTHLY", quarter: "MONTHLY", year: "YEARLY" };
const unitAdverb: Readonly<Partial<Record<RepeatUnit, string>>> = { day: "daily", week: "weekly", month: "monthly", quarter: "quarterly", year: "yearly" };

const unsupported = (target: "cron" | "rrule", operation: "import" | "export", code: string, message: string): OperationResult<never> => ({ ok: false, errors: [{ category: "capability", code, message, details: { lossReport: unsupportedLossReport(target, operation, message) }, remediation: "correct_source" } satisfies TemporalError] });
const dateFromPlain = (date: Temporal.PlainDate): DateValue => ({ kind: "date", calendar: "iso8601", year: date.year, month: date.month, day: date.day });
const plainFromDate = (date: DateValue): Temporal.PlainDate => Temporal.PlainDate.from({ year: date.year, month: date.month, day: date.day });
const daysInMonth = (year: number, month: number): number => Temporal.PlainDate.from({ year, month, day: 1 }).daysInMonth;
const nextWeekday = (from: DateValue, weekday: number): DateValue => {
  const start = plainFromDate(from);
  const delta = (weekday - start.dayOfWeek + 7) % 7;
  return dateFromPlain(start.add({ days: delta }));
};
const nextDayOfMonth = (from: DateValue, day: number): DateValue | undefined => {
  const start = plainFromDate(from);
  for (let offset = 0; offset < 12; offset++) {
    const probe = start.add({ months: offset });
    if (day > daysInMonth(probe.year, probe.month)) continue;
    const candidate = Temporal.PlainDate.from({ year: probe.year, month: probe.month, day });
    if (Temporal.PlainDate.compare(candidate, start) >= 0) return dateFromPlain(candidate);
  }
  return undefined;
};
const nextMonthDay = (from: DateValue, month: number, day: number): DateValue | undefined => {
  const start = plainFromDate(from);
  for (let offset = 0; offset < 8; offset++) {
    const year = start.year + offset;
    if (day > daysInMonth(year, month)) continue;
    const candidate = Temporal.PlainDate.from({ year, month, day });
    if (Temporal.PlainDate.compare(candidate, start) >= 0) return dateFromPlain(candidate);
  }
  return undefined;
};
// Decan's civil month/year stride moves a missing day to the period's last day (Jan 31 + 1 month = Feb 28);
// RRULE and cron skip that period instead. They agree only when the day exists in every stride period.
const strideClamps = (from: DateValue, unit: RepeatUnit, every: number): boolean => {
  if (from.day <= 28 || (unit !== "month" && unit !== "quarter" && unit !== "year")) return false;
  const start = plainFromDate(from);
  const months = unit === "month" ? every : unit === "quarter" ? every * 3 : every * 12;
  try {
    for (let index = 1; index <= 400; index++) if (start.add({ months: months * index }).day !== from.day) return true;
  } catch {
    return true;
  }
  return false;
};
const skippedDayMessage = (source: string, day: number): string => `${source} on day ${day} skips periods that have no day ${day}, but Decan's civil repeat would move to the period's last day instead; this has no exact Decan representation.`;
const lifecycle = (effectiveFrom: DateValue): IntentLifecycle => ({ status: "active", version: 1, effectiveFrom });
const clockPoint = (hour: number, minute: number, second?: number): PointExpression => ({ kind: "point", value: { kind: "clock", hour, minute, ...(second ? { second } : {}) } });
const repeatNode = (unit: RepeatUnit, every: number): RepeatExpression => ({ kind: "repeat", every, unit, mode: "civil" });
const compoundOf = (expressions: ReadonlyArray<TemporalExpression>): CompoundExpression => ({ kind: "compound", expressions });

const buildImport = (kind: ImportedScheduleSource["kind"], value: string, expression: CompoundExpression, effectiveFrom: DateValue, code: string, message: string, preserved: ReadonlyArray<string>, horizon?: ResolutionHorizon): OperationResult<ScheduleAdapterImport> => ({
  ok: true,
  value: { source: { kind, value }, expression, lifecycle: lifecycle(effectiveFrom), ...(horizon ? { horizon } : {}), diagnostics: [{ code, message }], lossReport: exactLossReport(kind === "imported_cron" ? "cron" : "rrule", "import", preserved) }
});

// =============================================================================================
// cron
// =============================================================================================
export function importCronExpression(request: CronImportRequest): OperationResult<ScheduleAdapterImport> {
  const parts = request.cron.trim().split(/\s+/);
  if (parts.length !== 5) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Only five-field cron expressions are supported.");
  const [minuteText, hourText, dayOfMonthText, monthText, dayOfWeekText] = parts as [string, string, string, string, string];
  if (!/^\d+$/.test(minuteText) || !/^\d+$/.test(hourText)) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron import requires single numeric minute and hour fields.");
  const minute = Number(minuteText);
  const hour = Number(hourText);
  if (minute < 0 || minute > 59 || hour < 0 || hour > 23) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron import minute/hour fields are outside the exact supported range.");
  const point = clockPoint(hour, minute);

  if (dayOfMonthText === "*" && monthText === "*") {
    if (!/^\d+$/.test(dayOfWeekText)) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Weekly cron import requires a single numeric weekday field.");
    const cronDay = Number(dayOfWeekText);
    const dayOfWeek = cronDay === 0 ? 7 : cronDay;
    if (dayOfWeek < 1 || dayOfWeek > 7) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron weekday field is outside the exact supported range.");
    const effectiveFrom = nextWeekday(request.effectiveFrom, dayOfWeek);
    return buildImport("imported_cron", request.cron, compoundOf([point, repeatNode("week", 1)]), effectiveFrom, "DECAN-ADAPTER-CRON-EXACT-SUBSET", "Imported exact weekly cron subset.", ["weekly civil recurrence", "local clock point", "lifecycle origin"]);
  }

  if (dayOfWeekText === "*" && /^\d+$/.test(dayOfMonthText)) {
    const day = Number(dayOfMonthText);
    if (day < 1 || day > 31) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron day-of-month field is outside the exact supported range.");
    if (monthText === "*") {
      const effectiveFrom = nextDayOfMonth(request.effectiveFrom, day);
      if (!effectiveFrom) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron day-of-month value never occurs.");
      if (strideClamps(effectiveFrom, "month", 1)) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", skippedDayMessage("A monthly cron trigger", day));
      return buildImport("imported_cron", request.cron, compoundOf([point, repeatNode("month", 1)]), effectiveFrom, "DECAN-ADAPTER-CRON-EXACT-SUBSET", "Imported exact monthly-by-day cron subset.", ["monthly civil recurrence", "local clock point", "lifecycle origin"]);
    }
    if (/^\d+$/.test(monthText)) {
      const month = Number(monthText);
      if (month < 1 || month > 12) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron month field is outside the exact supported range.");
      const effectiveFrom = nextMonthDay(request.effectiveFrom, month, day);
      if (!effectiveFrom) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron month/day combination never occurs.");
      if (strideClamps(effectiveFrom, "year", 1)) return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", skippedDayMessage("A yearly cron trigger", day));
      return buildImport("imported_cron", request.cron, compoundOf([point, repeatNode("year", 1)]), effectiveFrom, "DECAN-ADAPTER-CRON-EXACT-SUBSET", "Imported exact yearly cron subset.", ["yearly civil recurrence", "local clock point", "lifecycle origin"]);
    }
  }
  return unsupported("cron", "import", "DECAN-ADAPTER-CRON-UNSUPPORTED", "Only weekly, monthly-by-day, and yearly cron shapes with wildcard remaining fields are supported.");
}

// =============================================================================================
// RRULE parsing helpers
// =============================================================================================
const parseDateTime = (value: string): Readonly<{ date: DateValue; hour: number; minute: number; second: number }> | undefined => {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText); const month = Number(monthText); const day = Number(dayText); const hour = Number(hourText); const minute = Number(minuteText); const second = Number(secondText);
  try {
    const plain = Temporal.PlainDate.from({ year, month, day });
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return undefined;
    return { date: dateFromPlain(plain), hour, minute, second };
  } catch {
    return undefined;
  }
};
const parseRule = (rrule: string): ReadonlyMap<string, string> | undefined => {
  const entries = rrule.split(";").map((part) => part.split("="));
  if (entries.some((entry) => entry.length !== 2 || entry[0] === "" || entry[1] === "")) return undefined;
  return new Map(entries.map(([key, value]) => [key!.toUpperCase(), value!.toUpperCase()]));
};

type OrdinalValue = 1 | 2 | 3 | 4 | 5 | -1;
type ByDayToken = Readonly<{ weekday: Weekday; ordinal?: OrdinalValue }>;
const BYDAY_TOKEN = /^([+-]?\d{1,2})?(MO|TU|WE|TH|FR|SA|SU)$/;
const parseByDayToken = (token: string): ByDayToken | undefined => {
  const match = BYDAY_TOKEN.exec(token);
  if (!match) return undefined;
  const [, signed, code] = match as unknown as [string, string | undefined, string];
  const weekday = weekdayNames[code];
  if (!weekday) return undefined;
  if (signed === undefined) return { weekday };
  const n = Number(signed);
  if (n === -1) return { weekday, ordinal: -1 };
  if (n >= 1 && n <= 5) return { weekday, ordinal: n as OrdinalValue };
  return undefined;
};
const selectorFor = (ordinal: OrdinalValue | undefined): TemporalSelector => (ordinal === undefined ? { kind: "all" } : { kind: "ordinal", value: ordinal });
const selectionFor = (token: ByDayToken): SelectionExpression => ({ kind: "selection", filter: { kind: "weekday", value: token.weekday }, selector: selectorFor(token.ordinal) });
const byDayTokenFor = (selection: SelectionExpression): string | undefined => {
  if (!selection.filter || selection.filter.kind !== "weekday") return undefined;
  const code = weekdayNameCodes[selection.filter.value];
  if (selection.selector.kind === "all") return code;
  if (selection.selector.kind === "ordinal") return `${selection.selector.value > 0 ? "+" : ""}${selection.selector.value}${code}`;
  return undefined;
};

const parseUntil = (value: string): string | undefined => {
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (dateOnly) { const [, y, m, d] = dateOnly; return `${y}-${m}-${d}`; }
  const dateTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(value);
  if (dateTime) { const [, y, m, d] = dateTime; return `${y}-${m}-${d}`; }
  return undefined;
};
const formatUntil = (isoDate: string): string => isoDate.replace(/-/g, "");
const parseHorizon = (rule: ReadonlyMap<string, string>): Readonly<{ ok: true; value: ResolutionHorizon | undefined } | { ok: false }> => {
  const countText = rule.get("COUNT");
  const untilText = rule.get("UNTIL");
  if (countText !== undefined && untilText !== undefined) return { ok: false };
  if (countText !== undefined) {
    if (!/^\d+$/.test(countText) || Number(countText) < 1) return { ok: false };
    return { ok: true, value: { kind: "count", value: Number(countText) } };
  }
  if (untilText !== undefined) {
    const until = parseUntil(untilText);
    if (!until) return { ok: false };
    return { ok: true, value: { kind: "until", value: until } };
  }
  return { ok: true, value: undefined };
};

const validExdateToken = (token: string): boolean => /^\d{8}$/.test(token) || parseDateTime(token) !== undefined;
const exceptionFor = (rawToken: string): ExceptionExpression => ({ kind: "exception", predicate: { kind: "expression", reference: `@exdate:${rawToken}` }, effect: "suppress" });
const exdateTokenFor = (exception: ExceptionExpression): string | undefined => {
  const ref = exception.predicate.reference;
  return ref.startsWith("@exdate:") ? ref.slice("@exdate:".length) : undefined;
};

const preservedFor = (base: ReadonlyArray<string>, horizon: ResolutionHorizon | undefined, exdateCount: number): ReadonlyArray<string> => [
  ...base,
  ...(horizon?.kind === "count" ? ["explicit occurrence count (COUNT)"] : []),
  ...(horizon?.kind === "until" ? ["explicit recurrence end date (UNTIL)"] : []),
  ...(exdateCount > 0 ? [`${exdateCount} explicit exception date(s) (EXDATE)`] : [])
];

// =============================================================================================
// RRULE import
// =============================================================================================
export function importRRule(request: RRuleImportRequest): OperationResult<ScheduleAdapterImport> {
  const start = parseDateTime(request.dtstart);
  const rule = start ? parseRule(request.rrule) : undefined;
  if (!start || !rule) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE import requires DTSTART in basic local DATE-TIME form and parseable rule parts.");

  const allowed = new Set(["FREQ", "INTERVAL", "BYDAY", "COUNT", "UNTIL", "WKST"]);
  const extraneous = [...rule.keys()].filter((key) => !allowed.has(key));
  if (extraneous.length > 0) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", `RRULE contains parts outside Decan's exact subset: ${extraneous.join(", ")}.`);

  const freq = rule.get("FREQ");
  const unit = freq ? freqToUnit[freq] : undefined;
  if (!freq || !unit) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE FREQ must be one of DAILY, WEEKLY, MONTHLY, YEARLY.");

  const intervalText = rule.get("INTERVAL") ?? "1";
  if (!/^\d+$/.test(intervalText) || Number(intervalText) < 1) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE INTERVAL must be a positive integer.");
  const interval = Number(intervalText);

  // Week start only changes which days share a stride week, so it matters only when weeks are skipped.
  const wkst = rule.get("WKST");
  if (wkst !== undefined && !(wkst in weekdayNames)) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE WKST must be a weekday code (MO, TU, WE, TH, FR, SA, SU).");
  if (wkst !== undefined && wkst !== "MO" && interval > 1) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", `RRULE WKST=${wkst} with INTERVAL>1 is week-start dependent; Decan's week stride uses ISO weeks starting Monday, so only WKST=MO is exact when INTERVAL>1.`);

  const horizonResult = parseHorizon(rule);
  if (!horizonResult.ok) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE COUNT/UNTIL must be a positive integer COUNT xor a valid UNTIL date, not both.");
  const horizon = horizonResult.value;

  const exdateTokens = request.exdates ?? [];
  if (exdateTokens.some((token) => !validExdateToken(token))) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "EXDATE values must be basic-form DATE or local DATE-TIME.");

  const point = clockPoint(start.hour, start.minute, start.second);
  const rawByday = rule.get("BYDAY");
  const source = `DTSTART:${request.dtstart}\nRRULE:${request.rrule}`;

  if (rawByday !== undefined) {
    const tokens = rawByday.split(",").map(parseByDayToken);
    if (tokens.some((token) => token === undefined)) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "BYDAY contains a weekday or ordinal outside Decan's exact selection range (ordinals 1-5 or -1 only).");
    const resolved = tokens as ByDayToken[];

    // DAILY;INTERVAL=1;BYDAY=<set> is every listed weekday of every week: exactly the weekly set.
    const dailyAsWeekly = freq === "DAILY" && interval === 1;
    if (freq === "WEEKLY" || dailyAsWeekly) {
      if (resolved.some((token) => token.ordinal !== undefined)) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", `${freq} BYDAY accepts bare weekdays only; positional weekdays at ${freq.toLowerCase()} frequency have no resolver representation.`);
      const days = resolved.map((token) => weekdayNumbers[weekdayNameCodes[token.weekday]]!);
      if (new Set(days).size !== days.length) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "BYDAY lists the same weekday more than once.");
      const dailyMessage = "Imported DAILY;INTERVAL=1 with BYDAY as the exactly equivalent weekly weekday-set RRULE subset (every listed weekday of every week).";
      if (days.length === 1 && days[0] === plainFromDate(start.date).dayOfWeek) {
        const expression = compoundOf([point, repeatNode("week", interval), ...exdateTokens.map(exceptionFor)]);
        return buildImport("imported_rrule", source, expression, start.date, "DECAN-ADAPTER-RRULE-EXACT-SUBSET", dailyAsWeekly ? dailyMessage : "Imported exact weekly RRULE subset.", preservedFor(["weekly civil recurrence", "local clock point", "lifecycle origin"], horizon, exdateTokens.length), horizon);
      }
      const canonical = [...resolved].sort((left, right) => weekdayNumbers[weekdayNameCodes[left.weekday]]! - weekdayNumbers[weekdayNameCodes[right.weekday]]!);
      const expression = compoundOf([point, repeatNode("week", interval), ...canonical.map(selectionFor), ...exdateTokens.map(exceptionFor)]);
      return buildImport("imported_rrule", source, expression, start.date, "DECAN-ADAPTER-RRULE-EXACT-SUBSET", dailyAsWeekly ? dailyMessage : "Imported exact weekly weekday-set RRULE subset.", preservedFor(["weekly weekday-set selection", "local clock point", "lifecycle origin"], horizon, exdateTokens.length), horizon);
    }

    if (freq === "MONTHLY") {
      const expression = compoundOf([point, repeatNode("month", interval), ...resolved.map(selectionFor), ...exdateTokens.map(exceptionFor)]);
      return buildImport("imported_rrule", source, expression, start.date, "DECAN-ADAPTER-RRULE-EXACT-SUBSET", "Imported exact monthly positional/weekday-selection RRULE subset.", preservedFor(["monthly positional weekday selection", "local clock point", "lifecycle origin"], horizon, exdateTokens.length), horizon);
    }

    return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", freq === "DAILY" ? "DAILY BYDAY is exact only at INTERVAL=1, where it equals a weekly weekday set; with INTERVAL>1 the day stride and the weekday filter interact and have no resolver representation." : "BYDAY is exact only for WEEKLY (bare weekdays), DAILY at INTERVAL=1 (bare weekdays), or MONTHLY (positional/weekday selection).");
  }

  if (strideClamps(start.date, unit, interval)) return unsupported("rrule", "import", "DECAN-ADAPTER-RRULE-UNSUPPORTED", skippedDayMessage(`FREQ=${freq} from DTSTART`, start.date.day));
  const adverb = unitAdverb[unit]!;
  const expression = compoundOf([point, repeatNode(unit, interval), ...exdateTokens.map(exceptionFor)]);
  return buildImport("imported_rrule", source, expression, start.date, "DECAN-ADAPTER-RRULE-EXACT-SUBSET", `Imported exact ${adverb} RRULE subset.`, preservedFor([`${adverb} civil recurrence`, "local clock point", "lifecycle origin"], horizon, exdateTokens.length), horizon);
}

// =============================================================================================
// RRULE export
// =============================================================================================
const basicDateTime = (date: DateValue, hour: number, minute: number, second = 0): string => `${String(date.year).padStart(4, "0")}${String(date.month).padStart(2, "0")}${String(date.day).padStart(2, "0")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}${String(second).padStart(2, "0")}`;

export function exportRRule(request: RRuleExportRequest): OperationResult<RRuleExport> {
  const effectiveFrom = request.lifecycle.effectiveFrom;
  if (request.expression.kind !== "compound" || !effectiveFrom) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE export requires a compound expression with a lifecycle origin.");

  const nodes = request.expression.expressions;
  const recognized = new Set(["point", "repeat", "selection", "exception"]);
  if (nodes.some((node) => !recognized.has(node.kind))) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE export supports only point, repeat, selection, and exception expressions.");

  const point = nodes.find((node): node is PointExpression => node.kind === "point" && node.value.kind === "clock");
  if (!point || point.value.kind !== "clock") return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE export requires exactly one local clock point.");
  const clock = point.value;

  const repeat = nodes.find((node): node is RepeatExpression => node.kind === "repeat");
  const selections = nodes.filter((node): node is SelectionExpression => node.kind === "selection");
  const exceptions = nodes.filter((node): node is ExceptionExpression => node.kind === "exception");

  let freq: string;
  let interval: number;
  let byday: string | undefined;
  let exportMessage: string;
  const preservedBase: string[] = ["local clock point", "lifecycle origin"];

  if (selections.length > 0 && repeat?.unit === "week" && repeat.mode === "civil") {
    if (!selections.every((selection) => selection.filter?.kind === "weekday" && selection.selector.kind === "all")) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "Weekly weekday-set export requires weekday filters with the all selector; ordinals under a weekly repeat have no RRULE equivalent.");
    const days = [...new Set(selections.map((selection) => weekdayNumbers[byDayTokenFor(selection)!]!))].sort((left, right) => left - right);
    freq = "WEEKLY";
    interval = repeat.every;
    byday = days.map((day) => weekdayCodes[day]).join(",");
    preservedBase.push("weekly weekday-set selection");
    exportMessage = "Exported exact weekly weekday-set RRULE subset.";
  } else if (selections.length > 0) {
    if (repeat && (repeat.unit !== "month" || repeat.mode !== "civil")) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "Positional/weekday-selection export requires a monthly civil repeat stride.");
    const tokens = selections.map(byDayTokenFor);
    if (tokens.some((token) => token === undefined)) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE export supports only weekday filters with ordinal or all selectors for BYDAY.");
    freq = "MONTHLY";
    interval = repeat?.every ?? 1;
    byday = (tokens as string[]).join(",");
    preservedBase.push("monthly positional weekday selection");
    exportMessage = "Exported exact monthly positional/weekday-selection RRULE subset.";
  } else {
    if (!repeat || repeat.mode !== "civil") return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE export requires an exact civil repeat cadence.");
    const mappedFreq = unitToFreq[repeat.unit];
    if (strideClamps(effectiveFrom, repeat.unit, repeat.every)) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", `A ${repeat.unit} repeat from day ${effectiveFrom.day} moves to the period's last day when that day is missing, but an RRULE would skip the period instead; this has no exact RRULE representation.`);
    if (!mappedFreq) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", `RRULE export does not support the '${repeat.unit}' recurrence unit.`);
    const adverb = unitAdverb[repeat.unit]!;
    freq = mappedFreq;
    interval = repeat.unit === "quarter" ? repeat.every * 3 : repeat.every;
    byday = repeat.unit === "week" ? weekdayCodes[plainFromDate(effectiveFrom).dayOfWeek] : undefined;
    preservedBase.push(`${adverb} civil recurrence`);
    exportMessage = `Exported exact ${adverb} RRULE subset.`;
  }

  const exdateTokens: string[] = [];
  for (const exception of exceptions) {
    const token = exdateTokenFor(exception);
    if (!token) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE export supports only adapter-authored exception date markers.");
    exdateTokens.push(token);
  }

  let horizonPart = "";
  if (request.horizon?.kind === "count") horizonPart = `;COUNT=${request.horizon.value}`;
  else if (request.horizon?.kind === "until") horizonPart = `;UNTIL=${formatUntil(request.horizon.value.slice(0, 10))}`;
  else if (request.horizon) return unsupported("rrule", "export", "DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE export supports only count or until horizons.");

  const rrule = [`FREQ=${freq}`, `INTERVAL=${interval}`, ...(byday ? [`BYDAY=${byday}`] : [])].join(";") + horizonPart;
  const contentLines = [
    `DTSTART:${basicDateTime(effectiveFrom, clock.hour, clock.minute, clock.second)}`,
    `RRULE:${rrule}`,
    ...(exdateTokens.length > 0 ? [`EXDATE:${exdateTokens.join(",")}`] : [])
  ];

  return { ok: true, value: { contentLines, diagnostics: [{ code: "DECAN-ADAPTER-RRULE-EXACT-SUBSET", message: exportMessage }], lossReport: exactLossReport("rrule", "export", preservedFor(preservedBase, request.horizon, exdateTokens.length)) } };
}
