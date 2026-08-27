import type { GetOccurrenceRequest, GetOccurrenceResult, MaterializeRequest, MaterializeResult, OccurrenceQuery, OccurrenceQueryResult, ResolveRequest, ResolveResult, TemporalRuntime, ValidateRequest, ValidateResult } from "../model/types.js";
import { durableOccurrenceCapabilities, temporalCoreCapabilities } from "../capabilities/temporal-core.js";
import { materialize } from "../materialization/materialize.js";
import type { OccurrenceStore } from "../occurrences/store.js";
import { resolveExpression } from "../resolution/resolve.js";
import { validateDocument } from "../validation/validate.js";

export type TemporalCoreRuntime = Pick<TemporalRuntime, "validate" | "resolve" | "capabilities">;
export type DurableOccurrencesRuntime = Pick<TemporalRuntime, "validate" | "resolve" | "materialize" | "queryOccurrences" | "getOccurrence" | "capabilities">;

export const createTemporalCoreRuntime = (): TemporalCoreRuntime => ({
  validate: (request: ValidateRequest): ValidateResult => validateDocument(request.document),
  resolve: (request: ResolveRequest): ResolveResult => resolveExpression(request),
  capabilities: temporalCoreCapabilities
});

export const createDurableOccurrencesRuntime = (store: OccurrenceStore): DurableOccurrencesRuntime => ({
  validate: (request: ValidateRequest): ValidateResult => validateDocument(request.document),
  resolve: (request: ResolveRequest): ResolveResult => resolveExpression(request),
  materialize: (request: MaterializeRequest): MaterializeResult => materialize(request, store),
  queryOccurrences: (query: OccurrenceQuery): OccurrenceQueryResult => ({ ok: true, value: store.query(query) }),
  getOccurrence: (request: GetOccurrenceRequest): GetOccurrenceResult => {
    const value = store.get(request.id);
    return value === undefined ? { ok: false, errors: [{ category: "storage", code: "DECAN-STORAGE-OCCURRENCE-NOT-FOUND", message: "Occurrence was not found.", remediation: "correct_source" }] } : { ok: true, value };
  },
  capabilities: durableOccurrenceCapabilities
});
