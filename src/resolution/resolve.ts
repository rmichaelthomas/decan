import { Temporal } from "@js-temporal/polyfill";
import type { ContextKind, ContextSnapshot, ResolveRequest, ResolveResult, ResolutionNeed, TemporalCandidate, TemporalError, TemporalExpression } from "../model/types.js";
import { candidateIdentity, resolutionIdentity } from "./identity.js";
import { resolveCivilTime } from "./civil-time.js";
import { addBusinessDays } from "../providers/business-calendar.js";

const need = (kind: ContextKind | "reference" | "feature", requiredBy: string, reason = `Missing ${kind} snapshot`): ResolutionNeed => ({ kind, requiredBy, reason });
const error = (code: string, message: string): TemporalError => ({ category: "resolution", code, message, remediation: "correct_source" });
const contextFor = (context: ReadonlyArray<ContextSnapshot>, kind: ContextKind) => context.find((item) => item.kind === kind);
const weekday: Record<string, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };

export function resolveExpression(request: ResolveRequest): ResolveResult {
  const context = request.context ?? [];
  const references = request.references ?? [];
  if ((request.horizon.kind === "count" && request.horizon.value < 1) || (request.horizon.kind === "duration" && request.horizon.value.value <= 0)) return { ok: false, errors: [error("DECAN-RESOLUTION-HORIZON-FINITE", "Resolution requires a positive finite horizon.")] };
  const resolutionId = resolutionIdentity(request.expression, request.referenceTime, request.horizon, references, context);
  const needs: ResolutionNeed[] = [];
  const addNeed = (value: ResolutionNeed) => { if (!needs.some((item) => item.kind === value.kind && item.requiredBy === value.requiredBy)) needs.push(value); };
  const count = request.horizon.kind === "count" ? request.horizon.value : 1;
  const baseDate = Temporal.PlainDate.from(request.referenceTime.slice(0, 10));
  const points = (dates: ReadonlyArray<string>): TemporalCandidate[] => dates.map((date) => ({ kind: "point_candidate", value: { date } }));
  const instantValue = (value: string): number => Date.parse(value.replace(/\[[^\]]+\]$/, ""));
  const instantText = (value: number): string => new Date(value).toISOString().replace(".000Z", "Z");
  const elapsedMilliseconds = (value: number, unit: string): number | undefined => unit === "second" ? value * 1_000 : unit === "minute" ? value * 60_000 : unit === "hour" ? value * 3_600_000 : unit === "day" ? value * 86_400_000 : unit === "week" ? value * 604_800_000 : undefined;
  const offsetInstant = (instant: string, amount: Extract<TemporalExpression, { kind: "offset" }>["amount"], direction: number): string | undefined => {
    const milliseconds = amount.mode === "elapsed" ? elapsedMilliseconds(amount.value, amount.unit) : undefined;
    const origin = instantValue(instant);
    return milliseconds === undefined || !Number.isFinite(origin) ? undefined : instantText(origin + milliseconds * direction);
  };
  const clockInstantsForDate = (date: Temporal.PlainDate, hour: number, minute: number, second: number | undefined, requiredBy: string): ReadonlyArray<string> => {
    const zone = contextFor(context, "timezone");
    if (!zone || typeof zone.value !== "object" || zone.value === null || !("initialOffsetMinutes" in zone.value) || !("transitions" in zone.value)) { addNeed(need("timezone", requiredBy)); return []; }
    return resolveCivilTime({ id: zone.id, version: zone.version, initialOffsetMinutes: zone.value.initialOffsetMinutes as number, transitions: zone.value.transitions as ReadonlyArray<{ at: string; offsetMinutes: number }>, year: date.year, month: date.month, day: date.day, hour, minute, ...(second === undefined ? {} : { second }) }).candidates;
  };
  const clockInstants = (hour: number, minute: number, second: number | undefined, requiredBy: string): ReadonlyArray<string> => clockInstantsForDate(baseDate, hour, minute, second, requiredBy);
  const repeatDates = (expression: Extract<TemporalExpression, { kind: "repeat" }>, requiredBy: string): ReadonlyArray<Temporal.PlainDate> => {
    const origin = request.lifecycle?.effectiveFrom;
    if (!origin) { addNeed(need("feature", requiredBy, "Recurrence requires an explicit lifecycle origin.")); return []; }
    const start = Temporal.PlainDate.from({ year: origin.year, month: origin.month, day: origin.day });
    const add = (index: number) => expression.unit === "day" ? { days: expression.every * index } : expression.unit === "week" ? { weeks: expression.every * index } : expression.unit === "month" ? { months: expression.every * index } : expression.unit === "quarter" ? { months: expression.every * 3 * index } : { years: expression.every * index };
    return Array.from({ length: count }, (_, index) => start.add(add(index)));
  };
  const repeatInstants = (origin: string, expression: Extract<TemporalExpression, { kind: "repeat" }>, requiredBy: string): ReadonlyArray<string> => {
    const milliseconds = expression.mode === "elapsed" ? elapsedMilliseconds(expression.every, expression.unit) : undefined;
    const start = instantValue(origin);
    if (milliseconds === undefined || !Number.isFinite(start)) { addNeed(need("feature", requiredBy, "Elapsed sub-day recurrence requires an explicit instant origin.")); return []; }
    return Array.from({ length: count }, (_, index) => instantText(start + milliseconds * index));
  };
  const applyOffset = (candidates: TemporalCandidate[], amount: Extract<TemporalExpression, { kind: "offset" }>["amount"], requiredBy: string, direction = 1): TemporalCandidate[] => candidates.map((candidate) => {
    if (candidate.kind !== "point_candidate" || typeof candidate.value !== "object" || candidate.value === null) return candidate;
    if ("instant" in candidate.value && typeof candidate.value.instant === "string") {
      const instant = offsetInstant(candidate.value.instant, amount, direction);
      if (!instant) { addNeed(need("feature", requiredBy, "This offset requires an elapsed instant candidate.")); return candidate; }
      return { kind: "point_candidate", value: { instant } };
    }
    if ("instants" in candidate.value && Array.isArray(candidate.value.instants) && candidate.value.instants.every((item) => typeof item === "string")) {
      const instants = candidate.value.instants.map((instant) => offsetInstant(instant, amount, direction));
      if (instants.some((instant) => instant === undefined)) { addNeed(need("feature", requiredBy, "This offset requires elapsed instant candidates.")); return candidate; }
      return { kind: "point_candidate", value: { instants } };
    }
    if (!("date" in candidate.value) || typeof candidate.value.date !== "string") return candidate;
    if (amount.mode === "business") {
      const calendar = contextFor(context, "calendar");
      if (!calendar || typeof calendar.value !== "object" || calendar.value === null || !("closedDates" in calendar.value)) { addNeed(need("calendar", requiredBy)); return candidate; }
      return { kind: "point_candidate", value: addBusinessDays({ date: candidate.value.date, days: amount.value * direction, calendar: { id: calendar.id, version: calendar.version, closedDates: calendar.value.closedDates as ReadonlyArray<string> } }) };
    }
    const value = Temporal.PlainDate.from(candidate.value.date);
    const date = amount.unit === "day" ? value.add({ days: amount.value * direction }) : amount.unit === "week" ? value.add({ weeks: amount.value * direction }) : amount.unit === "month" ? value.add({ months: amount.value * direction }) : amount.unit === "quarter" ? value.add({ months: amount.value * 3 * direction }) : amount.unit === "year" ? value.add({ years: amount.value * direction }) : undefined;
    if (!date) { addNeed(need("feature", requiredBy, "This offset requires an instant candidate.")); return candidate; }
    return { kind: "point_candidate", value: { date: date.toString() } };
  });

  const evaluate = (expression: TemporalExpression): TemporalCandidate[] => {
    switch (expression.kind) {
      case "point":
        return [{ kind: "point_candidate", value: expression.value.kind === "date" ? { date: `${expression.value.year}-${String(expression.value.month).padStart(2, "0")}-${String(expression.value.day).padStart(2, "0")}` } : expression.value.kind === "clock" ? { instants: clockInstants(expression.value.hour, expression.value.minute, expression.value.second, "expression.point") } : { point: expression.value, referenceTime: request.referenceTime } }];
      case "window": {
        if (expression.value.kind === "semantic_window") {
          const named = expression.value.name.includes(":");
          const provider = contextFor(context, named ? "custom" : "locale");
          if (!provider) addNeed(need(named ? "custom" : "locale", "expression.window"));
          return [{ kind: "window_candidate", value: { window: expression.value.name, ...(named ? { provider: provider ? { id: provider.id, version: provider.version } : undefined } : { locale: provider ? { id: provider.id, version: provider.version } : undefined }), definition: provider?.value } }];
        }
        return [{ kind: "window_candidate", value: { startInstants: clockInstants(expression.value.start.hour, expression.value.start.minute, expression.value.start.second, "expression.window"), endInstants: clockInstants(expression.value.end.hour, expression.value.end.minute, expression.value.end.second, "expression.window") } }];
      }
      case "repeat": {
        return points(repeatDates(expression, "expression.repeat").map((date) => date.toString()));
      }
      case "selection": {
        const monthStart = Temporal.PlainDate.from({ year: baseDate.year, month: baseDate.month, day: 1 });
        const dates: string[] = [];
        if (expression.filter?.kind === "weekday") {
          const target = weekday[expression.filter.value];
          for (let day = monthStart; day.month === monthStart.month; day = day.add({ days: 1 })) if (day.dayOfWeek === target) dates.push(day.toString());
        } else if (expression.filter?.kind === "business_day") {
          const calendar = contextFor(context, "calendar");
          if (!calendar || typeof calendar.value !== "object" || calendar.value === null || !("closedDates" in calendar.value)) { addNeed(need("calendar", "expression.selection")); return []; }
          const closed = new Set(calendar.value.closedDates as ReadonlyArray<string>);
          for (let day = monthStart; day.month === monthStart.month; day = day.add({ days: 1 })) if (day.dayOfWeek < 6 && !closed.has(day.toString())) dates.push(day.toString());
        } else { addNeed(need("feature", "expression.selection", "Selection filter requires a deterministic candidate provider.")); return []; }
        const selected = expression.selector.kind === "all" ? dates : expression.selector.kind === "ordinal" ? [dates[expression.selector.value === -1 ? dates.length - 1 : expression.selector.value - 1]!].filter(Boolean) : [];
        if (selected.length === 0) addNeed(need("feature", "expression.selection", "Selector is not in the exact resolver subset."));
        return points(selected);
      }
      case "relation": {
        const reference = references.find((item) => item.id === expression.anchor.reference);
        if (!reference) addNeed(need("reference", "expression.relation.anchor"));
        const candidate = reference && typeof reference.value === "object" && reference.value !== null && "date" in reference.value && typeof reference.value.date === "string" ? [{ kind: "point_candidate" as const, value: { date: reference.value.date } }] : reference && typeof reference.value === "object" && reference.value !== null && "instant" in reference.value && typeof reference.value.instant === "string" ? [{ kind: "point_candidate" as const, value: { instant: reference.value.instant } }] : reference ? [{ kind: "point_candidate" as const, value: { relation: expression.relation, anchor: reference.value } }] : [];
        return expression.offset ? applyOffset(candidate, expression.offset.amount, "expression.relation.offset", expression.relation === "before" ? -1 : 1) : candidate;
      }
      case "offset":
        if (expression.amount.mode === "business" && !contextFor(context, "calendar")) addNeed(need("calendar", "expression.offset"));
        return [];
      case "duration":
        addNeed(need("feature", "expression.duration", "Duration expressions are spans, not standalone occurrence candidates."));
        return [];
      case "boundary":
        addNeed(need("feature", "expression.boundary", "Boundary expressions are constraints, not standalone occurrence candidates."));
        return [];
      case "exception":
      case "adjustment":
      case "condition":
        return [];
      case "compound": {
        const repeats = expression.expressions.filter((item): item is Extract<TemporalExpression, { kind: "repeat" }> => item.kind === "repeat");
        const clocks = expression.expressions.filter((item): item is Extract<TemporalExpression, { kind: "point" }> => item.kind === "point" && item.value.kind === "clock");
        const elapsedInstantRepeat = repeats.length === 1 && repeats[0]!.mode === "elapsed" && ["second", "minute", "hour"].includes(repeats[0]!.unit) && expression.expressions.filter((item) => item.kind !== "repeat").length === 1;
        if (elapsedInstantRepeat) {
          const origin = evaluate(expression.expressions.find((item) => item.kind !== "repeat")!);
          return origin.flatMap((candidate) => {
            if (candidate.kind !== "point_candidate" || typeof candidate.value !== "object" || candidate.value === null || !("instant" in candidate.value) || typeof candidate.value.instant !== "string") { addNeed(need("feature", "expression.repeat", "Elapsed sub-day recurrence requires an explicit instant origin.")); return []; }
            return repeatInstants(candidate.value.instant, repeats[0]!, "expression.repeat").map((instant) => ({ kind: "point_candidate" as const, value: { instant } }));
          });
        }
        const composable = repeats.length === 1 && clocks.length === 1 && expression.expressions.every((item) => item.kind === "repeat" || (item.kind === "point" && item.value.kind === "clock"));
        if (composable) {
          const clock = clocks[0]!.value;
          if (clock.kind !== "clock") return [];
          return repeatDates(repeats[0]!, "expression.repeat").map((date) => ({
            kind: "point_candidate" as const,
            value: {
              date: date.toString(),
              instants: clockInstantsForDate(date, clock.hour, clock.minute, clock.second, "expression.point")
            }
          }));
        }
        const base = expression.expressions.filter((item) => item.kind !== "offset" && item.kind !== "exception" && item.kind !== "adjustment" && item.kind !== "condition").flatMap(evaluate);
        return expression.expressions.filter((item): item is Extract<TemporalExpression, { kind: "offset" }> => item.kind === "offset").reduce((candidates, offset) => applyOffset(candidates, offset.amount, "expression.offset"), base);
      }
    }
  };

  let values = evaluate(request.expression);
  let conflicted = false;
  if (request.expression.kind === "compound") {
    const exceptions = request.expression.expressions.filter((item) => item.kind === "exception");
    for (const exception of exceptions) {
      const predicate = references.find((item) => item.id === exception.predicate.reference);
      if (!predicate) addNeed(need("reference", "expression.exception.predicate"));
      else if (predicate.value === true) values = [];
    }
    const conditions = request.expression.expressions.filter((item) => item.kind === "condition");
    for (const condition of conditions) {
      const predicate = references.find((item) => item.id === condition.predicate.reference);
      if (!predicate) addNeed(need("reference", "expression.condition.predicate"));
      else if (typeof predicate.value !== "object" || predicate.value === null || !("value" in predicate.value) || predicate.value.value !== true) values = [];
    }
    const active = request.expression.expressions.filter((item) => item.kind === "adjustment").filter((adjustment) => {
      const predicate = references.find((item) => item.id === adjustment.when.reference);
      if (!predicate) { addNeed(need("reference", "expression.adjustment.when")); return false; }
      return predicate.value === true;
    });
    if (active.length > 1 && active.some((item) => item.precedence === undefined)) conflicted = true;
    if (active.length === 1) {
      const operation = active[0]!.operation;
      if (operation.kind === "substitute" || operation.kind === "move") values = evaluate(operation.target);
    }
  }
  if (request.horizon.kind === "count") values = values.slice(0, request.horizon.value);
  if (request.horizon.kind === "until") {
    const end = request.horizon.value.slice(0, 10);
    values = values.filter((value) => value.kind !== "point_candidate" || typeof value.value !== "object" || value.value === null || !("date" in value.value) || typeof value.value.date !== "string" || value.value.date <= end);
  }
  if (request.horizon.kind === "duration") {
    const amount = request.horizon.value;
    const date = amount.unit === "day" ? baseDate.add({ days: amount.value }) : amount.unit === "week" ? baseDate.add({ weeks: amount.value }) : amount.unit === "month" ? baseDate.add({ months: amount.value }) : amount.unit === "quarter" ? baseDate.add({ months: amount.value * 3 }) : amount.unit === "year" ? baseDate.add({ years: amount.value }) : undefined;
    if (!date) addNeed(need("feature", "horizon.duration", "This horizon duration requires instant resolution."));
    else values = values.filter((value) => value.kind !== "point_candidate" || typeof value.value !== "object" || value.value === null || !("date" in value.value) || typeof value.value.date !== "string" || value.value.date <= date.toString());
  }
  const candidates = needs.length > 0 ? [] : values.map((value) => ({ id: candidateIdentity(resolutionId, value), value, derivation: [{ kind: "explicit_snapshot_evaluation", inputs: [request.referenceTime], output: JSON.stringify(value) }] }));
  return { ok: true, value: { id: resolutionId, status: conflicted ? "conflicted" : needs.length > 0 ? "unresolved" : "resolved", candidates: conflicted ? [] : candidates, needs, assumptions: [], contextUsed: context, horizon: request.horizon, derivation: [{ kind: "resolution_frame", inputs: [request.referenceTime], output: resolutionId }] } };
}
