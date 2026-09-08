import { canonicalize } from "json-canonicalize";
import { sha256Hex } from "./sha256.js";
import type { CanonicalizedValue, HashIdentity, NormalizedDocument, TemporalExpression } from "../model/types.js";
import { printDocument } from "./printer.js";
import { normalizeDocument } from "../syntax/normalize.js";

export const canonicalJson = (value: unknown): string => canonicalize(value);
export const sha256 = (value: unknown): HashIdentity => `sha256:${sha256Hex(canonicalJson(value))}`;

const semanticDocument = (document: NormalizedDocument) => ({
  ...(document.intentId ? { intentId: document.intentId } : {}),
  ...(document.source ? { source: document.source } : {}),
  expression: document.expression,
  references: document.references,
  context: document.context,
  ...(document.lifecycle ? { lifecycle: document.lifecycle } : {})
});

export function canonicalizeDocument(document: NormalizedDocument): CanonicalizedValue {
  const normalized = normalizeDocument(document);
  const expressionHash = sha256(normalized.expression as TemporalExpression);
  const hasIntentSemantics = normalized.intentId !== undefined || normalized.references.length > 0 || normalized.context.length > 0 || normalized.lifecycle !== undefined;
  return {
    document: normalized,
    canonicalText: printDocument(normalized),
    expressionHash,
    ...(hasIntentSemantics ? { intentVersionHash: sha256(semanticDocument(normalized)) } : {})
  };
}
