import { readFile } from "node:fs/promises";
import {
  type CanonicalizeOperationInput,
  canonicalizeTemporalIntent,
  classifyTemporalSupport,
  exportRRuleTemporalIntent,
  importCronTemporalIntent,
  importRRuleTemporalIntent,
  materializeTemporalIntent,
  resolveTemporalIntent,
  validateTemporalIntent
} from "../interface/operations.js";
import type { ContextSnapshot, IntentLifecycle, ReferenceSnapshot, ResolutionHorizon, TemporalExpression, TemporalResolution } from "../model/types.js";

export type DecanCliIo = Readonly<{
  readFile: (path: string) => Promise<string>;
  writeStdout: (text: string) => void;
  writeStderr: (text: string) => void;
}>;

const nodeIo: DecanCliIo = {
  readFile: (path) => readFile(path, "utf8"),
  writeStdout: (text) => { process.stdout.write(text); },
  writeStderr: (text) => { process.stderr.write(text); }
};

const usage = `Decan public interface

Usage:
  decan canonicalize <file.ti> [--surface authoring|canonical]
  decan validate <file.ti> [--surface authoring|canonical]
  decan support <file.ti> [--surface authoring|canonical]
  decan resolve <file.ti> --reference-time <instant> --horizon-count <n> [--context <context.json>] [--references <references.json>]
  decan import-cron "<expr>" --effective-from <YYYY-MM-DD>
  decan import-rrule --dtstart <YYYYMMDDTHHMMSS> --rrule <RRULE>
  decan export-rrule --expression <expression.json> --lifecycle <lifecycle.json>
  decan materialize --intent-id <id> --intent-version <n> --resolution <resolution.json> --candidate-id <id> --recorded-at <instant>
`;

type ParsedArgs = Readonly<{ command?: string; positionals: ReadonlyArray<string>; options: Readonly<Record<string, string | true>> }>;

function parseArgs(argv: ReadonlyArray<string>): ParsedArgs {
  const [command, ...rest] = argv;
  const positionals: string[] = [];
  const options: Record<string, string | true> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]!;
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = rest[index + 1];
    if (next === undefined || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return { command, positionals, options };
}

function requiredOption(options: Readonly<Record<string, string | true>>, name: string): string {
  const value = options[name];
  if (typeof value !== "string") throw new Error(`Missing --${name}`);
  return value;
}

function optionalSurface(options: Readonly<Record<string, string | true>>): CanonicalizeOperationInput["surface"] {
  const value = options.surface;
  if (value === undefined) return undefined;
  if (value === "authoring" || value === "canonical") return value;
  throw new Error("--surface must be authoring or canonical");
}

function textInput(text: string, options: Readonly<Record<string, string | true>>): CanonicalizeOperationInput {
  const surface = optionalSurface(options);
  return surface === undefined ? { text } : { text, surface };
}

async function jsonFromFile<T>(io: DecanCliIo, path: string): Promise<T> {
  return JSON.parse(await io.readFile(path)) as T;
}

function writeJson(io: DecanCliIo, result: unknown): number {
  io.writeStdout(`${JSON.stringify(result, null, 2)}\n`);
  return typeof result === "object" && result !== null && "ok" in result && result.ok === false ? 1 : 0;
}

export async function runDecanCli(argv: ReadonlyArray<string>, io: DecanCliIo = nodeIo): Promise<number> {
  try {
    const parsed = parseArgs(argv);
    if (!parsed.command || parsed.command === "help" || parsed.options.help === true) {
      io.writeStdout(usage);
      return 0;
    }

    if (parsed.command === "canonicalize") {
      const file = parsed.positionals[0];
      if (!file) throw new Error("Missing source file");
      return writeJson(io, canonicalizeTemporalIntent(textInput(await io.readFile(file), parsed.options)));
    }

    if (parsed.command === "validate") {
      const file = parsed.positionals[0];
      if (!file) throw new Error("Missing source file");
      return writeJson(io, validateTemporalIntent(textInput(await io.readFile(file), parsed.options)));
    }

    if (parsed.command === "support") {
      const file = parsed.positionals[0];
      if (!file) throw new Error("Missing source file");
      return writeJson(io, classifyTemporalSupport(textInput(await io.readFile(file), parsed.options)));
    }

    if (parsed.command === "resolve") {
      const file = parsed.positionals[0];
      if (!file) throw new Error("Missing source file");
      const horizonCount = Number(requiredOption(parsed.options, "horizon-count"));
      if (!Number.isInteger(horizonCount) || horizonCount < 1) throw new Error("--horizon-count must be a positive integer");
      const contextPath = parsed.options.context;
      const referencesPath = parsed.options.references;
      const context = typeof contextPath === "string" ? await jsonFromFile<ReadonlyArray<ContextSnapshot>>(io, contextPath) : [];
      const references = typeof referencesPath === "string" ? await jsonFromFile<ReadonlyArray<ReferenceSnapshot>>(io, referencesPath) : [];
      const surface = optionalSurface(parsed.options);
      return writeJson(io, resolveTemporalIntent({
        text: await io.readFile(file),
        referenceTime: requiredOption(parsed.options, "reference-time"),
        horizon: { kind: "count", value: horizonCount } satisfies ResolutionHorizon,
        context,
        references,
        ...(surface === undefined ? {} : { surface })
      }));
    }

    if (parsed.command === "import-cron") {
      const cron = parsed.positionals[0];
      if (!cron) throw new Error("Missing cron expression");
      return writeJson(io, importCronTemporalIntent({ cron, effectiveFrom: requiredOption(parsed.options, "effective-from") }));
    }

    if (parsed.command === "import-rrule") {
      return writeJson(io, importRRuleTemporalIntent({
        dtstart: requiredOption(parsed.options, "dtstart"),
        rrule: requiredOption(parsed.options, "rrule")
      }));
    }

    if (parsed.command === "export-rrule") {
      return writeJson(io, exportRRuleTemporalIntent({
        expression: await jsonFromFile<TemporalExpression>(io, requiredOption(parsed.options, "expression")),
        lifecycle: await jsonFromFile<IntentLifecycle>(io, requiredOption(parsed.options, "lifecycle"))
      }));
    }

    if (parsed.command === "materialize") {
      return writeJson(io, materializeTemporalIntent({
        intentId: requiredOption(parsed.options, "intent-id"),
        intentVersion: Number(requiredOption(parsed.options, "intent-version")),
        resolution: await jsonFromFile<TemporalResolution>(io, requiredOption(parsed.options, "resolution")),
        candidateId: requiredOption(parsed.options, "candidate-id"),
        recordedAt: requiredOption(parsed.options, "recorded-at"),
        ...(typeof parsed.options["occurrence-key"] === "string" ? { occurrenceKey: parsed.options["occurrence-key"] } : {})
      }));
    }

    throw new Error(`Unknown command ${parsed.command}`);
  } catch (error) {
    io.writeStderr(`${error instanceof Error ? error.message : String(error)}\n\n${usage}`);
    return 2;
  }
}
