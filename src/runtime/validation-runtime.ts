import type { TemporalRuntime, ValidateRequest, ValidateResult } from "../model/types.js";
import { validateDocument } from "../validation/validate.js";

/**
 * The C2 surface intentionally claims only validation. Capability profiles remain
 * reserved for the evidence-complete C0/C1, temporal-core, and durable-occurrence layers.
 */
export type ValidationRuntime = Pick<TemporalRuntime, "validate">;

export function createValidationRuntime(): ValidationRuntime {
  return {
    validate: (request: ValidateRequest): ValidateResult => validateDocument(request.document)
  };
}
