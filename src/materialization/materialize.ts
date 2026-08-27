import { sha256 } from "../canonical/identity.js";
import type { MaterializeRequest, MaterializeResult, TemporalError } from "../model/types.js";
import type { OccurrenceStore } from "../occurrences/store.js";

const failure = (code: string, message: string): MaterializeResult => ({ ok: false, errors: [{ category: "materialization", code, message, remediation: "correct_source" } satisfies TemporalError] });

export function materialize(request: MaterializeRequest, store: OccurrenceStore): MaterializeResult {
  if (request.resolution.status !== "resolved" || request.resolution.needs.length > 0) return failure("DECAN-MATERIALIZATION-RESOLUTION", "Only a complete resolved result may be materialized.");
  const candidate = request.resolution.candidates.find((item) => item.id === request.candidateId);
  if (!candidate) return failure("DECAN-MATERIALIZATION-CANDIDATE", "The selected candidate is not part of the resolution.");
  const occurrenceKey = request.occurrenceKey ?? sha256({ intentId: request.intentId, intentVersion: request.intentVersion, candidateId: candidate.id });
  const existing = store.find(request.intentId, occurrenceKey);
  if (existing) return { ok: true, value: { occurrence: existing, disposition: "existing" } };
  const occurrence = { id: sha256({ intentId: request.intentId, intentVersion: request.intentVersion, occurrenceKey }), intentId: request.intentId, intentVersion: request.intentVersion, occurrenceKey, phase: "materialized" as const };
  const disposition = store.appendMaterialized(occurrence, request.recordedAt);
  return { ok: true, value: { occurrence: store.find(request.intentId, occurrenceKey)!, disposition } };
}
