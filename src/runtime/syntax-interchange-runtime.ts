import type { CapabilityManifest, CapabilityResult, CanonicalizeRequest, CanonicalizeResult, DeserializeRequest, DeserializeResult, ParseRequest, ParseResult, PrintRequest, PrintResult, SerializeRequest, SerializeResult, TemporalRuntime } from "../model/types.js";
import { printDocument } from "../canonical/printer.js";
import { deserializeInterchange, serializeInterchange } from "../interchange/interchange.js";
import { canonicalizeText, parseDocument } from "../syntax/index.js";

export type SyntaxInterchangeRuntime = Pick<TemporalRuntime, "parse" | "canonicalize" | "print" | "serialize" | "deserialize" | "capabilities">;

const operations: CapabilityManifest["operations"] = {
  parse: "exact", canonicalize: "exact", print: "exact", validate: "pending", serialize: "exact", deserialize: "exact",
  resolve: "pending", materialize: "pending", queryOccurrences: "pending", getOccurrence: "pending", inspect: "pending", explain: "pending", capabilities: "exact"
};

const capability = (): CapabilityResult => ({ ok: true, value: { profile: "syntax-interchange", operations, features: [{ id: "canonical-syntax-interchange", support: { parse: "exact", canonicalize: "exact", print: "exact", serialize: "exact", deserialize: "exact" } }] } });

export function createSyntaxInterchangeRuntime(): SyntaxInterchangeRuntime {
  return {
    parse: (request: ParseRequest): ParseResult => parseDocument(request),
    canonicalize: (request: CanonicalizeRequest): CanonicalizeResult => canonicalizeText(request),
    print: (request: PrintRequest): PrintResult => ({ ok: true, value: { text: printDocument(request.document) } }),
    serialize: (request: SerializeRequest): SerializeResult => serializeInterchange(request),
    deserialize: (request: DeserializeRequest): DeserializeResult => deserializeInterchange(request),
    capabilities: capability
  };
}
