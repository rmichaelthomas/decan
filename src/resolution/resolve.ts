import { Temporal } from "@js-temporal/polyfill";
import type { ContextKind, ContextSnapshot, ResolveRequest, ResolveResult, ResolutionNeed, TemporalCandidate, TemporalError, TemporalExpression } from "../model/types.js";
import { candidateIdentity, resolutionIdentity } from "./identity.js";

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

  const evaluate = (expression: TemporalExpression): TemporalCandidate[] => {
    switch (expression.kind) {
      case "point":
        if (expression.value.kind === "clock" && !contextFor(context, "timezone")) addNeed(need("timezone", "expression.point"));
        return [{ kind: "point_candidate", value: expression.value.kind === "date" ? { date: `${expression.value.year}-${String(expression.value.month).padStart(2, "0")}-${String(expression.value.day).padStart(2, "0")}` } : { point: expression.value, referenceTime: request.referenceTime } }];
      case "window": {
        if (expression.value.kind === "semantic_window") {
          const provider = contextFor(context, "custom");
          if (!provider) addNeed(need("custom", "expression.window"));
          return [{ kind: "window_candidate", value: { window: expression.value.name, provider: provider ? { id: provider.id, version: provider.version } : undefined, definition: provider?.value } }];
        }
        if (!contextFor(context, "timezone")) addNeed(need("timezone", "expression.window"));
        return [{ kind: "window_candidate", value: { start: expression.value.start, end: expression.value.end, referenceTime: request.referenceTime } }];
      }
      case "repeat": {
        const origin = request.lifecycle?.effectiveFrom;
        if (!origin) { addNeed(need("feature", "expression.repeat", "Recurrence requires an explicit lifecycle origin.")); return []; }
        const start = Temporal.PlainDate.from({ year: origin.year, month: origin.month, day: origin.day });
        const add = (index: number) => expression.unit === "day" ? { days: expression.every * index } : expression.unit === "week" ? { weeks: expression.every * index } : expression.unit === "month" ? { months: expression.every * index } : expression.unit === "quarter" ? { months: expression.every * 3 * index } : { years: expression.every * index };
        return points(Array.from({ length: count }, (_, index) => start.add(add(index)).toString()));
      }
      case "selection": {
        if (expression.filter?.kind !== "weekday") { addNeed(need("feature", "expression.selection", "Only weekday selection is in the exact resolver subset.")); return []; }
        const target = weekday[expression.filter.value];
        const monthStart = Temporal.PlainDate.from({ year: baseDate.year, month: baseDate.month, day: 1 });
        const dates: string[] = [];
        for (let day = monthStart; day.month === monthStart.month; day = day.add({ days: 1 })) if (day.dayOfWeek === target) dates.push(day.toString());
        const selected = expression.selector.kind === "all" ? dates : expression.selector.kind === "ordinal" ? [dates[expression.selector.value === -1 ? dates.length - 1 : expression.selector.value - 1]!].filter(Boolean) : [];
        if (selected.length === 0) addNeed(need("feature", "expression.selection", "Selector is not in the exact resolver subset."));
        return points(selected);
      }
      case "relation": {
        const reference = references.find((item) => item.id === expression.anchor.reference);
        if (!reference) addNeed(need("reference", "expression.relation.anchor"));
        return reference ? [{ kind: "point_candidate", value: { relation: expression.relation, anchor: reference.value } }] : [];
      }
      case "offset":
        if (expression.amount.mode === "business" && !contextFor(context, "calendar")) addNeed(need("calendar", "expression.offset"));
        return [];
      case "exception":
      case "adjustment":
        return [];
      case "compound": return expression.expressions.flatMap(evaluate);
      default:
        addNeed(need("feature", `expression.${expression.kind}`, `Expression kind '${expression.kind}' is not in the exact resolver subset.`));
        return [];
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
    const active = request.expression.expressions.filter((item) => item.kind === "adjustment").filter((adjustment) => {
      const predicate = references.find((item) => item.id === adjustment.when.reference);
      if (!predicate) { addNeed(need("reference", "expression.adjustment.when")); return false; }
      return predicate.value === true;
    });
    if (active.length > 1 && active.some((item) => item.precedence === undefined)) conflicted = true;
  }
  const candidates = needs.length > 0 ? [] : values.map((value) => ({ id: candidateIdentity(resolutionId, value), value, derivation: [{ kind: "explicit_snapshot_evaluation", inputs: [request.referenceTime], output: JSON.stringify(value) }] }));
  return { ok: true, value: { id: resolutionId, status: conflicted ? "conflicted" : needs.length > 0 ? "unresolved" : "resolved", candidates: conflicted ? [] : candidates, needs, assumptions: [], contextUsed: context, horizon: request.horizon, derivation: [{ kind: "resolution_frame", inputs: [request.referenceTime], output: resolutionId }] } };
}
