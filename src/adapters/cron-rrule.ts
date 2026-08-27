import { Temporal } from "@js-temporal/polyfill";
import type { CompoundExpression, DateValue, Diagnostic, IntentLifecycle, OperationResult, TemporalError, TemporalExpression } from "../model/types.js";

export type ImportedScheduleSource = Readonly<{ kind: "imported_cron" | "imported_rrule"; value: string }>;
export type ScheduleAdapterImport = Readonly<{ source: ImportedScheduleSource; expression: CompoundExpression; lifecycle: IntentLifecycle; diagnostics: ReadonlyArray<Pick<Diagnostic, "code" | "message">> }>;
export type CronImportRequest = Readonly<{ cron: string; effectiveFrom: DateValue }>;
export type RRuleImportRequest = Readonly<{ dtstart: string; rrule: string }>;
export type RRuleExportRequest = Readonly<{ expression: TemporalExpression; lifecycle: IntentLifecycle }>;
export type RRuleExport = Readonly<{ contentLines: ReadonlyArray<string>; diagnostics: ReadonlyArray<Pick<Diagnostic, "code" | "message">> }>;

const weekdayNumbers: Record<string, number> = { SU: 7, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const weekdayCodes: Record<number, string> = { 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA", 7: "SU" };

const unsupported = (code: string, message: string): OperationResult<never> => ({ ok: false, errors: [{ category: "capability", code, message, remediation: "correct_source" } satisfies TemporalError] });
const dateFromPlain = (date: Temporal.PlainDate): DateValue => ({ kind: "date", calendar: "iso8601", year: date.year, month: date.month, day: date.day });
const plainFromDate = (date: DateValue): Temporal.PlainDate => Temporal.PlainDate.from({ year: date.year, month: date.month, day: date.day });
const nextWeekday = (from: DateValue, weekday: number): DateValue => {
  const start = plainFromDate(from);
  const delta = (weekday - start.dayOfWeek + 7) % 7;
  return dateFromPlain(start.add({ days: delta }));
};
const expression = (hour: number, minute: number): CompoundExpression => ({
  kind: "compound",
  expressions: [
    { kind: "point", value: { kind: "clock", hour, minute } },
    { kind: "repeat", every: 1, unit: "week", mode: "civil" }
  ]
});
const lifecycle = (effectiveFrom: DateValue): IntentLifecycle => ({ status: "active", version: 1, effectiveFrom });
const exactImport = (kind: ImportedScheduleSource["kind"], value: string, expressionValue: CompoundExpression, effectiveFrom: DateValue, code: string, message: string): OperationResult<ScheduleAdapterImport> => ({ ok: true, value: { source: { kind, value }, expression: expressionValue, lifecycle: lifecycle(effectiveFrom), diagnostics: [{ code, message }] } });

export function importCronExpression(request: CronImportRequest): OperationResult<ScheduleAdapterImport> {
  const parts = request.cron.trim().split(/\s+/);
  if (parts.length !== 5) return unsupported("DECAN-ADAPTER-CRON-UNSUPPORTED", "Only five-field cron expressions are supported.");
  const [minuteText, hourText, dayOfMonth, month, dayOfWeekText] = parts;
  if (dayOfMonth !== "*" || month !== "*") return unsupported("DECAN-ADAPTER-CRON-UNSUPPORTED", "Only weekly cron expressions with wildcard day-of-month and month are supported.");
  if (!/^\d+$/.test(minuteText ?? "") || !/^\d+$/.test(hourText ?? "") || !/^\d+$/.test(dayOfWeekText ?? "")) return unsupported("DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron import requires single numeric minute, hour, and weekday fields.");
  const minute = Number(minuteText);
  const hour = Number(hourText);
  const cronDay = Number(dayOfWeekText);
  const dayOfWeek = cronDay === 0 ? 7 : cronDay;
  if (minute < 0 || minute > 59 || hour < 0 || hour > 23 || dayOfWeek < 1 || dayOfWeek > 7) return unsupported("DECAN-ADAPTER-CRON-UNSUPPORTED", "Cron import fields are outside the exact supported range.");
  return exactImport("imported_cron", request.cron, expression(hour, minute), nextWeekday(request.effectiveFrom, dayOfWeek), "DECAN-ADAPTER-CRON-EXACT-SUBSET", "Imported exact weekly cron subset.");
}

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

export function importRRule(request: RRuleImportRequest): OperationResult<ScheduleAdapterImport> {
  const start = parseDateTime(request.dtstart);
  const rule = parseRule(request.rrule);
  if (!start || !rule) return unsupported("DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE import requires DTSTART in basic local DATE-TIME form and parseable rule parts.");
  const allowed = new Set(["FREQ", "INTERVAL", "BYDAY"]);
  if ([...rule.keys()].some((key) => !allowed.has(key))) return unsupported("DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE contains parts outside Decan's exact weekly subset.");
  if (rule.get("FREQ") !== "WEEKLY" || (rule.get("INTERVAL") ?? "1") !== "1") return unsupported("DECAN-ADAPTER-RRULE-UNSUPPORTED", "Only weekly RRULEs with INTERVAL=1 are supported.");
  const byday = rule.get("BYDAY");
  if (byday && (!weekdayNumbers[byday] || weekdayNumbers[byday] !== plainFromDate(start.date).dayOfWeek)) return unsupported("DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE BYDAY must be a single weekday matching DTSTART.");
  return exactImport("imported_rrule", `DTSTART:${request.dtstart}\nRRULE:${request.rrule}`, expression(start.hour, start.minute), start.date, "DECAN-ADAPTER-RRULE-EXACT-SUBSET", "Imported exact weekly RRULE subset.");
}

const weeklyParts = (expressionValue: TemporalExpression): Readonly<{ hour: number; minute: number }> | undefined => {
  if (expressionValue.kind !== "compound") return undefined;
  const point = expressionValue.expressions.find((item) => item.kind === "point" && item.value.kind === "clock");
  const repeat = expressionValue.expressions.find((item) => item.kind === "repeat");
  if (!point || point.kind !== "point" || point.value.kind !== "clock" || !repeat || repeat.kind !== "repeat" || repeat.unit !== "week" || repeat.every !== 1 || repeat.mode !== "civil") return undefined;
  return { hour: point.value.hour, minute: point.value.minute };
};
const basicDateTime = (date: DateValue, hour: number, minute: number): string => `${String(date.year).padStart(4, "0")}${String(date.month).padStart(2, "0")}${String(date.day).padStart(2, "0")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;

export function exportRRule(request: RRuleExportRequest): OperationResult<RRuleExport> {
  const parts = weeklyParts(request.expression);
  const effectiveFrom = request.lifecycle.effectiveFrom;
  if (!parts || !effectiveFrom) return unsupported("DECAN-ADAPTER-RRULE-UNSUPPORTED", "RRULE export supports only weekly civil recurrence with one clock point and lifecycle origin.");
  const weekday = weekdayCodes[plainFromDate(effectiveFrom).dayOfWeek];
  return { ok: true, value: { contentLines: [`DTSTART:${basicDateTime(effectiveFrom, parts.hour, parts.minute)}`, `RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=${weekday}`], diagnostics: [{ code: "DECAN-ADAPTER-RRULE-EXACT-SUBSET", message: "Exported exact weekly RRULE subset." }] } };
}
