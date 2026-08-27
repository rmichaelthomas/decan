import type { ContextKind, ContextSnapshot, ResolveRequest, ResolveResult, ResolutionNeed, TemporalCandidate, TemporalError, TemporalExpression } from "../model/types.js";
import { candidateIdentity, resolutionIdentity } from "./identity.js";

const need = (kind: ContextKind | "reference" | "feature", requiredBy: string, reason = `Missing ${kind} snapshot`): ResolutionNeed => ({ kind, requiredBy, reason });
const error = (code: string, message: string): TemporalError => ({ category: "resolution", code, message, remediation: "correct_source" });
const contextFor = (context: ReadonlyArray<ContextSnapshot>, kind: ContextKind): ContextSnapshot | undefined => context.find((item) => item.kind === kind);

export function resolveExpression(request: ResolveRequest): ResolveResult {
  const context = request.context ?? [];
  const references = request.references ?? [];
  if ((request.horizon.kind === "count" && request.horizon.value < 1) ||
      (request.horizon.kind === "duration" && request.horizon.value.value <= 0)) {
    return { ok: false, errors: [error("DECAN-RESOLUTION-HORIZON-FINITE", "Resolution requires a positive finite horizon.")] };
  }

  const resolutionId = resolutionIdentity(request.expression, request.referenceTime, request.horizon, references, context);
  const needs: ResolutionNeed[] = [];
  const addNeed = (value: ResolutionNeed): void => { if (!needs.some((item) => item.kind === value.kind && item.requiredBy === value.requiredBy)) needs.push(value); };
  const candidateValue = (expression: TemporalExpression): TemporalCandidate | undefined => {
    if (expression.kind === "window") {
      if (expression.value.kind === "semantic_window") {
        if (!contextFor(context, "custom")) addNeed(need("custom", "expression.window"));
        return { kind: "window_candidate", value: { window: expression.value.name, referenceTime: request.referenceTime } };
      }
      if (!contextFor(context, "timezone")) addNeed(need("timezone", "expression.window"));
      return { kind: "window_candidate", value: { start: expression.value.start, end: expression.value.end, referenceTime: request.referenceTime } };
    }
    if (expression.kind === "point") {
      if (expression.value.kind === "clock" && !contextFor(context, "timezone")) addNeed(need("timezone", "expression.point"));
      return { kind: "point_candidate", value: { point: expression.value, referenceTime: request.referenceTime } };
    }
    if (expression.kind === "relation") {
      if (!references.some((item) => item.id === expression.anchor.reference)) addNeed(need("reference", "expression.relation.anchor"));
      return { kind: "point_candidate", value: { relation: expression.relation, anchor: expression.anchor.reference, referenceTime: request.referenceTime } };
    }
    addNeed(need("feature", `expression.${expression.kind}`, `Expression kind '${expression.kind}' is not in the exact resolver subset.`));
    return undefined;
  };

  const baseExpressions = request.expression.kind === "compound" ? request.expression.expressions : [request.expression];
  const values = baseExpressions.map(candidateValue).filter((value): value is TemporalCandidate => value !== undefined);
  const candidates = needs.length > 0 ? [] : values.map((value) => ({ id: candidateIdentity(resolutionId, value), value, derivation: [{ kind: "explicit_snapshot_evaluation", inputs: [request.referenceTime], output: JSON.stringify(value) }] }));
  return {
    ok: true,
    value: {
      id: resolutionId,
      status: needs.length > 0 ? "unresolved" : "resolved",
      candidates,
      needs,
      assumptions: [],
      contextUsed: context,
      horizon: request.horizon,
      derivation: [{ kind: "resolution_frame", inputs: [request.referenceTime], output: resolutionId }]
    }
  };
}
