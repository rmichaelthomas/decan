#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import {
  canonicalizeTemporalIntent,
  classifyTemporalSupport,
  exportRRuleTemporalIntent,
  importCronTemporalIntent,
  importRRuleTemporalIntent,
  materializeTemporalIntent,
  resolveTemporalIntent,
  validateTemporalIntent
} from "../interface/operations.js";

export const DECAN_MCP_TOOL_NAMES = [
  "decan_canonicalize",
  "decan_validate",
  "decan_classify_support",
  "decan_resolve",
  "decan_import_cron",
  "decan_import_rrule",
  "decan_export_rrule",
  "decan_materialize"
] as const;

export const DECAN_MCP_RESOURCE_URIS = [
  "decan://proper-time/spec",
  "decan://proper-time/conformance",
  "decan://proper-time/corpus",
  "decan://proper-time/launch-argument"
] as const;

export const DECAN_MCP_PROMPT_NAMES = [
  "explain-proper-time-intent",
  "convert-schedule-to-decan"
] as const;

export type DecanMcpToolName = typeof DECAN_MCP_TOOL_NAMES[number];

type McpTextResult = Readonly<{
  content: Array<{ type: "text"; text: string }>;
  structuredContent: unknown;
}>;

const SurfaceSchema = z.enum(["authoring", "canonical"]).optional();
const JsonSchema = z.unknown();
const CanonicalizeSchema = z.object({ text: z.string(), surface: SurfaceSchema });
const ResolveSchema = CanonicalizeSchema.extend({
  referenceTime: z.string(),
  horizon: JsonSchema,
  lifecycle: JsonSchema.optional(),
  references: z.array(JsonSchema).optional(),
  context: z.array(JsonSchema).optional()
});
const ImportCronSchema = z.object({ cron: z.string(), effectiveFrom: JsonSchema });
const ImportRRuleSchema = z.object({ dtstart: z.string(), rrule: z.string() });
const ExportRRuleSchema = z.object({ expression: JsonSchema, lifecycle: JsonSchema });
const MaterializeSchema = z.object({
  intentId: z.string(),
  intentVersion: z.number().int().positive(),
  resolution: JsonSchema,
  candidateId: z.string(),
  recordedAt: z.string(),
  occurrenceKey: z.string().optional()
});

function canonicalizeInput(input: z.infer<typeof CanonicalizeSchema>) {
  return input.surface === undefined ? { text: input.text } : { text: input.text, surface: input.surface };
}

function repoFile(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), "utf8");
}

export async function callDecanMcpTool(name: DecanMcpToolName, args: unknown): Promise<unknown> {
  switch (name) {
    case "decan_canonicalize":
      return canonicalizeTemporalIntent(canonicalizeInput(CanonicalizeSchema.parse(args)));
    case "decan_validate":
      return validateTemporalIntent(canonicalizeInput(CanonicalizeSchema.parse(args)));
    case "decan_classify_support":
      return classifyTemporalSupport(canonicalizeInput(CanonicalizeSchema.parse(args)));
    case "decan_resolve": {
      const input = ResolveSchema.parse(args);
      return resolveTemporalIntent({
        text: input.text,
        referenceTime: input.referenceTime,
        horizon: input.horizon as never,
        ...(input.surface === undefined ? {} : { surface: input.surface }),
        ...(input.lifecycle === undefined ? {} : { lifecycle: input.lifecycle as never }),
        ...(input.references === undefined ? {} : { references: input.references as never }),
        ...(input.context === undefined ? {} : { context: input.context as never })
      });
    }
    case "decan_import_cron":
      return importCronTemporalIntent(ImportCronSchema.parse(args) as never);
    case "decan_import_rrule":
      return importRRuleTemporalIntent(ImportRRuleSchema.parse(args));
    case "decan_export_rrule": {
      const input = ExportRRuleSchema.parse(args);
      return exportRRuleTemporalIntent({ expression: input.expression as never, lifecycle: input.lifecycle as never });
    }
    case "decan_materialize": {
      const input = MaterializeSchema.parse(args);
      return materializeTemporalIntent({
        intentId: input.intentId,
        intentVersion: input.intentVersion,
        resolution: input.resolution as never,
        candidateId: input.candidateId,
        recordedAt: input.recordedAt,
        ...(input.occurrenceKey ? { occurrenceKey: input.occurrenceKey } : {})
      });
    }
  }
}

export function toMcpTextResult(value: unknown): McpTextResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value
  };
}

export function createDecanMcpServer(): McpServer {
  const server = new McpServer(
    { name: "decan", version: "0.0.0" },
    {
      instructions: "Use Decan to preserve temporal intent before converting it to cron, RRULE, timestamps, scheduler jobs, or agent actions. Decan is snapshot-only and fail-closed: if context is missing, return needs instead of guessing."
    }
  );
  const register = (name: DecanMcpToolName, title: string, description: string, inputSchema: z.ZodType) => {
    server.registerTool(name, { title, description, inputSchema }, async (args) => toMcpTextResult(await callDecanMcpTool(name, args)));
  };

  register("decan_canonicalize", "Canonicalize Decan source", "Parse readable Decan source and return canonical text, stable hashes, and the normalized document.", CanonicalizeSchema);
  register("decan_validate", "Validate Decan intent", "Validate canonical Decan semantics and return stable validation errors or unresolved dependencies.", CanonicalizeSchema);
  register("decan_classify_support", "Classify resolver support", "Report whether an expression is exact, needs context, unsupported, or conflicted under Decan's declared resolver matrix.", CanonicalizeSchema);
  register("decan_resolve", "Resolve Decan intent", "Resolve a Decan expression over a finite horizon using only explicit context and reference snapshots.", ResolveSchema);
  register("decan_import_cron", "Import cron", "Import an exact weekly cron subset into Decan or fail closed when fidelity would be lost.", ImportCronSchema);
  register("decan_import_rrule", "Import RRULE", "Import an exact weekly RRULE subset into Decan or fail closed when fidelity would be lost.", ImportRRuleSchema);
  register("decan_export_rrule", "Export RRULE", "Export Decan's exact weekly civil recurrence subset as DTSTART plus RRULE.", ExportRRuleSchema);
  register("decan_materialize", "Materialize occurrence", "Materialize a selected resolved candidate into an append-only occurrence record.", MaterializeSchema);

  server.registerResource("proper-time-spec", "decan://proper-time/spec", { title: "Proper Time and Decan", mimeType: "text/markdown" }, async (uri) => ({ contents: [{ uri: uri.href, text: repoFile("SPEC.md") }] }));
  server.registerResource("proper-time-conformance", "decan://proper-time/conformance", { title: "Decan Conformance", mimeType: "text/markdown" }, async (uri) => ({ contents: [{ uri: uri.href, text: repoFile("docs/conformance.md") }] }));
  server.registerResource("proper-time-corpus", "decan://proper-time/corpus", { title: "Proper Time Corpus", mimeType: "text/markdown" }, async (uri) => ({ contents: [{ uri: uri.href, text: repoFile("docs/proper-time-corpus.md") }] }));
  server.registerResource("proper-time-launch-argument", "decan://proper-time/launch-argument", { title: "Decan Launch Argument", mimeType: "text/markdown" }, async (uri) => ({ contents: [{ uri: uri.href, text: repoFile("docs/launch-argument.md") }] }));

  server.registerPrompt("explain-proper-time-intent", {
    title: "Explain Proper Time intent",
    description: "Explain a Decan temporal intent for a human reviewer without collapsing it into scheduler jargon.",
    argsSchema: z.object({ intent: z.string().optional() })
  }, ({ intent }) => ({
    messages: [{
      role: "user" as const,
      content: { type: "text" as const, text: `Explain this temporal intent in Decan / Proper Time terms. Name what is explicit, what context evidence is required, what Decan refuses to infer, and which scheduler/calendar forms could represent it exactly if any.\n\n${intent ?? ""}` }
    }]
  }));
  server.registerPrompt("convert-schedule-to-decan", {
    title: "Convert schedule to Decan",
    description: "Guide a model through converting cron, RRULE, or product scheduling prose into Decan source with honest gaps.",
    argsSchema: z.object({ source: z.string() })
  }, ({ source }) => ({
    messages: [{
      role: "user" as const,
      content: { type: "text" as const, text: `Convert the following scheduling source into Decan. Preserve source evidence, declare context/reference needs, and fail closed when the source is lossy or unsupported.\n\n${source}` }
    }]
  }));

  return server;
}

export function serveDecanMcpStdio() {
  return serveStdio(() => createDecanMcpServer(), {
    onerror: (error) => { console.error(error.message); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  serveDecanMcpStdio();
}
