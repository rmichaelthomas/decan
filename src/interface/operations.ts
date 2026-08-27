import { importCronExpression, importRRule, exportRRule } from "../adapters/cron-rrule.js";
import { canonicalizeText } from "../syntax/index.js";
import { classifyResolveSupport } from "../resolution/support-matrix.js";
import { MemoryOccurrenceStore } from "../occurrences/memory-store.js";
import { materialize } from "../materialization/materialize.js";
import { resolveExpression } from "../resolution/resolve.js";
import { validateDocument } from "../validation/validate.js";
import type {
  ContextSnapshot,
  DateValue,
  IntentLifecycle,
  OperationResult,
  ReferenceSnapshot,
  ResolutionHorizon,
  ResolveRequest,
  TemporalError,
  TemporalExpression,
  TemporalResolution
} from "../model/types.js";

export type TextSurface = "authoring" | "canonical";

export type CanonicalizeOperationInput = Readonly<{ text: string; surface?: TextSurface }>;
export type ValidateOperationInput = CanonicalizeOperationInput;
export type ClassifySupportOperationInput = CanonicalizeOperationInput;
export type ResolveOperationInput = Readonly<{
  text: string;
  surface?: TextSurface;
  referenceTime: string;
  horizon: ResolutionHorizon;
  lifecycle?: IntentLifecycle;
  references?: ReadonlyArray<ReferenceSnapshot>;
  context?: ReadonlyArray<ContextSnapshot>;
}>;
export type ImportCronOperationInput = Readonly<{ cron: string; effectiveFrom: string | DateValue }>;
export type ImportRRuleOperationInput = Readonly<{ dtstart: string; rrule: string }>;
export type ExportRRuleOperationInput = Readonly<{ expression: TemporalExpression; lifecycle: IntentLifecycle }>;
export type MaterializeOperationInput = Readonly<{
  intentId: string;
  intentVersion: number;
  resolution: TemporalResolution;
  candidateId: string;
  recordedAt: string;
  occurrenceKey?: string;
}>;

const failure = (code: string, message: string, details?: Readonly<Record<string, unknown>>): OperationResult<never> => ({
  ok: false,
  errors: [{
    category: "interchange",
    code,
    message,
    ...(details ? { details } : {}),
    remediation: "correct_source"
  } satisfies TemporalError]
});

const surfaceFor = (surface: TextSurface | undefined): TextSurface => surface ?? "authoring";

export function parseIsoDateValue(value: string): OperationResult<DateValue> {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return failure("DECAN-INTERFACE-DATE", "Date values must use YYYY-MM-DD form.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return failure("DECAN-INTERFACE-DATE", "Date value is outside the supported ISO calendar range.");
  return { ok: true, value: { kind: "date", calendar: "iso8601", year, month, day } };
}

export function canonicalizeTemporalIntent(input: CanonicalizeOperationInput) {
  return canonicalizeText({ text: input.text, surface: surfaceFor(input.surface) });
}

export function validateTemporalIntent(input: ValidateOperationInput) {
  const canonical = canonicalizeTemporalIntent(input);
  if (!canonical.ok) return canonical;
  return validateDocument(canonical.value.document);
}

export function classifyTemporalSupport(input: ClassifySupportOperationInput) {
  const canonical = canonicalizeTemporalIntent(input);
  if (!canonical.ok) return canonical;
  return { ok: true as const, value: classifyResolveSupport(canonical.value.document.expression) };
}

export function resolveTemporalIntent(input: ResolveOperationInput) {
  const canonical = canonicalizeTemporalIntent(input);
  if (!canonical.ok) return canonical;
  const request: ResolveRequest = {
    expression: canonical.value.document.expression,
    referenceTime: input.referenceTime,
    horizon: input.horizon,
    references: input.references ?? [],
    context: input.context ?? [],
    ...((input.lifecycle ?? canonical.value.document.lifecycle) ? { lifecycle: input.lifecycle ?? canonical.value.document.lifecycle } : {})
  };
  return resolveExpression(request);
}

export function importCronTemporalIntent(input: ImportCronOperationInput) {
  const effectiveFrom = typeof input.effectiveFrom === "string" ? parseIsoDateValue(input.effectiveFrom) : { ok: true as const, value: input.effectiveFrom };
  if (!effectiveFrom.ok) return effectiveFrom;
  return importCronExpression({ cron: input.cron, effectiveFrom: effectiveFrom.value });
}

export function importRRuleTemporalIntent(input: ImportRRuleOperationInput) {
  return importRRule({ dtstart: input.dtstart, rrule: input.rrule });
}

export function exportRRuleTemporalIntent(input: ExportRRuleOperationInput) {
  return exportRRule({ expression: input.expression, lifecycle: input.lifecycle });
}

export function materializeTemporalIntent(input: MaterializeOperationInput) {
  return materialize({
    intentId: input.intentId,
    intentVersion: input.intentVersion,
    resolution: input.resolution,
    candidateId: input.candidateId,
    recordedAt: input.recordedAt,
    ...(input.occurrenceKey ? { occurrenceKey: input.occurrenceKey } : {})
  }, new MemoryOccurrenceStore());
}
