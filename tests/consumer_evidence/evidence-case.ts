import type {
  ContextSnapshot,
  ReferenceSnapshot,
  ResolutionHorizon,
  TemporalResolution
} from "../../src/index.js";

export type SourceSpec = Readonly<{
  surface: "authoring" | "canonical";
  text?: string;
  textFile?: string;
}>;

export type Gap = Readonly<{
  id: string;
  status: "fixed" | "unsupported" | "deferred";
  reason: string;
}>;

export type MaterializationExpectation = Readonly<{
  candidateIndex: number;
  intentId: string;
  intentVersion: number;
  recordedAt: string;
  asOfBefore?: string;
}>;

export type EvidenceCase = Readonly<{
  consumer: string;
  intent: string;
  source: SourceSpec;
  resolution: Readonly<{
    referenceTime: string;
    horizon: ResolutionHorizon;
    context?: ReadonlyArray<ContextSnapshot>;
    references?: ReadonlyArray<ReferenceSnapshot>;
  }>;
  expected: Readonly<{
    validationStatus: "valid" | "invalid";
    resolutionStatus: TemporalResolution["status"];
    candidateValues?: ReadonlyArray<TemporalResolution["candidates"][number]["value"]>;
    resolutionDerivationKinds?: ReadonlyArray<string>;
    candidateDerivationKinds?: ReadonlyArray<string>;
    needs?: TemporalResolution["needs"];
    materialization?: MaterializationExpectation;
  }>;
  observedGaps: ReadonlyArray<Gap>;
}>;

const object = (value: unknown): Record<string, unknown> | undefined => (
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined
);

const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const status = (value: unknown): boolean => value === "fixed" || value === "unsupported" || value === "deferred";

export function parseEvidenceCase(value: unknown): EvidenceCase {
  const item = object(value);
  if (!item || !nonempty(item.consumer) || !nonempty(item.intent)) {
    throw new Error("consumer evidence requires consumer and intent");
  }

  const source = object(item.source);
  if (!source || (source.surface !== "authoring" && source.surface !== "canonical")) {
    throw new Error("consumer evidence source requires authoring or canonical surface");
  }
  if ((source.text === undefined) === (source.textFile === undefined)) {
    throw new Error("consumer evidence source requires exactly one of text or textFile");
  }

  const resolution = object(item.resolution);
  if (!resolution || !nonempty(resolution.referenceTime) || object(resolution.horizon) === undefined) {
    throw new Error("consumer evidence requires referenceTime and horizon");
  }

  const expected = object(item.expected);
  if (!expected || (expected.validationStatus !== "valid" && expected.validationStatus !== "invalid")) {
    throw new Error("consumer evidence requires validationStatus");
  }
  if (!["resolved", "unresolved", "conflicted"].includes(String(expected.resolutionStatus))) {
    if (expected.resolutionStatus === "partially_resolved") {
      throw new Error("consumer evidence cannot accept partially_resolved as an endpoint");
    }
    throw new Error("consumer evidence requires a supported resolutionStatus");
  }

  if (expected.resolutionStatus === "resolved") {
    if (!Array.isArray(expected.candidateValues)) {
      throw new Error("resolved consumer evidence requires candidateValues");
    }
    if (!Array.isArray(expected.needs) || expected.needs.length !== 0) {
      throw new Error("resolved consumer evidence requires explicit empty needs");
    }
    if (!Array.isArray(expected.resolutionDerivationKinds)) {
      throw new Error("resolved consumer evidence requires resolution derivation expectations");
    }
    if (!Array.isArray(expected.candidateDerivationKinds)) {
      throw new Error("resolved consumer evidence requires candidate derivation expectations");
    }
    if (object(expected.materialization) === undefined) {
      throw new Error("resolved consumer evidence requires materialization replay expectations");
    }
  }

  if (!Array.isArray(item.observedGaps)) {
    throw new Error("consumer evidence requires observedGaps");
  }
  for (const gap of item.observedGaps) {
    const parsed = object(gap);
    if (!parsed || !nonempty(parsed.id) || !status(parsed.status) || !nonempty(parsed.reason)) {
      throw new Error("observed gaps require id, status, and reason");
    }
  }

  return value as EvidenceCase;
}
