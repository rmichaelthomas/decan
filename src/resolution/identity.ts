import { sha256 } from "../canonical/identity.js";
import type { ContextSnapshot, HashIdentity, ReferenceSnapshot, ResolutionHorizon, TemporalExpression } from "../model/types.js";

const ordered = <T extends { id: string; version: string }>(items: ReadonlyArray<T>): ReadonlyArray<T> => [...items].sort((left, right) => {
  const leftKey = sha256(left);
  const rightKey = sha256(right);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
});

export function resolutionIdentity(expression: TemporalExpression, referenceTime: string, horizon: ResolutionHorizon, references: ReadonlyArray<ReferenceSnapshot>, context: ReadonlyArray<ContextSnapshot>): HashIdentity {
  return sha256({ expression, referenceTime, horizon, references: ordered(references), context: ordered(context) });
}

export function candidateIdentity(resolutionId: HashIdentity, value: unknown): HashIdentity {
  return sha256({ resolutionId, value });
}
