import type { CanonicalizeRequest, CanonicalizeResult, ParseRequest, ParseResult } from "../model/types.js";
import { canonicalizeDocument } from "../canonical/identity.js";
import { printDocument } from "../canonical/printer.js";
import { parseDocument } from "./parser.js";

export { parseDocument } from "./parser.js";

export function canonicalizeText(request: CanonicalizeRequest): CanonicalizeResult {
  const parsed = parseDocument(request);
  if (!parsed.ok) return parsed;
  return { ok: true, value: canonicalizeDocument(parsed.value) };
}

export const parse = (request: ParseRequest): ParseResult => parseDocument(request);
export { printDocument };
