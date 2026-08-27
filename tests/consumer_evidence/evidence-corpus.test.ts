import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MemoryOccurrenceStore,
  canonicalizeText,
  materialize,
  resolveExpression,
  validateDocument
} from "../../src/index.js";
import type { NormalizedDocument } from "../../src/index.js";
import { parseEvidenceCase } from "./evidence-case.js";
import type { EvidenceCase, SourceSpec } from "./evidence-case.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const corpusRoot = join(root, "fixtures/consumer-evidence");

const caseDirectories = existsSync(corpusRoot)
  ? readdirSync(corpusRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(corpusRoot, entry.name))
    .filter((directory) => existsSync(join(directory, "case.json")))
  : [];

function readCase(directory: string): EvidenceCase {
  return parseEvidenceCase(JSON.parse(readFileSync(join(directory, "case.json"), "utf8")));
}

function sourceText(directory: string, source: SourceSpec): string {
  if (source.text !== undefined) return source.text;
  if (source.textFile !== undefined) return readFileSync(join(directory, source.textFile), "utf8");
  throw new Error("consumer evidence source requires text or textFile");
}

function resolvedDocument(directory: string, evidence: EvidenceCase): NormalizedDocument {
  const canonical = canonicalizeText({
    surface: evidence.source.surface,
    text: sourceText(directory, evidence.source)
  });
  if (!canonical.ok) throw new Error(`consumer evidence source did not canonicalize: ${JSON.stringify(canonical.errors)}`);
  return canonical.value.document;
}

describe("post-C6 real consumer evidence corpus", () => {
  if (caseDirectories.length === 0) {
    it.todo("add the first real consumer fixture under fixtures/consumer-evidence/<case>/case.json");
  }

  for (const directory of caseDirectories) {
    const evidence = readCase(directory);

    it(`${evidence.consumer}: ${evidence.intent}`, () => {
      expect(evidence.observedGaps.every((gap) => ["fixed", "unsupported", "deferred"].includes(gap.status))).toBe(true);

      const document = resolvedDocument(directory, evidence);
      const validation = validateDocument(document);
      expect(validation).toMatchObject({ ok: true, value: { status: evidence.expected.validationStatus } });

      const resolutionRequest = {
        expression: document.expression,
        referenceTime: evidence.resolution.referenceTime,
        horizon: evidence.resolution.horizon,
        context: evidence.resolution.context ?? [],
        references: evidence.resolution.references ?? [],
        ...(document.lifecycle === undefined ? {} : { lifecycle: document.lifecycle })
      };
      const resolution = resolveExpression(resolutionRequest);

      expect(resolution).toMatchObject({ ok: true, value: { status: evidence.expected.resolutionStatus } });
      if (!resolution.ok) throw new Error("consumer evidence resolution failed operationally");
      expect(resolution.value.status).not.toBe("partially_resolved");

      if (evidence.expected.candidateValues !== undefined) {
        expect(resolution.value.candidates.map((candidate) => candidate.value)).toEqual(evidence.expected.candidateValues);
      }
      if (evidence.expected.resolutionDerivationKinds !== undefined) {
        expect(resolution.value.derivation.map((step) => step.kind)).toEqual(evidence.expected.resolutionDerivationKinds);
      }
      if (evidence.expected.candidateDerivationKinds !== undefined) {
        for (const candidate of resolution.value.candidates) {
          expect(candidate.derivation.map((step) => step.kind)).toEqual(evidence.expected.candidateDerivationKinds);
        }
      }
      if (evidence.expected.needs !== undefined) {
        expect(resolution.value.needs).toEqual(evidence.expected.needs);
      }

      if (evidence.expected.materialization !== undefined) {
        const expected = evidence.expected.materialization;
        const candidate = resolution.value.candidates[expected.candidateIndex];
        if (candidate === undefined) throw new Error("materialization candidateIndex does not select a candidate");

        const store = new MemoryOccurrenceStore();
        const first = materialize({
          intentId: expected.intentId,
          intentVersion: expected.intentVersion,
          resolution: resolution.value,
          candidateId: candidate.id,
          recordedAt: expected.recordedAt
        }, store);
        expect(first).toMatchObject({ ok: true, value: { disposition: "created" } });

        const second = materialize({
          intentId: expected.intentId,
          intentVersion: expected.intentVersion,
          resolution: resolution.value,
          candidateId: candidate.id,
          recordedAt: expected.recordedAt
        }, store);
        expect(second).toMatchObject({ ok: true, value: { disposition: "existing" } });

        if (expected.asOfBefore !== undefined) {
          expect(store.query({ intentId: expected.intentId, asOf: expected.asOfBefore }).items).toEqual([]);
        }
        expect(store.query({ intentId: expected.intentId }).items).toHaveLength(1);
      }
    });
  }
});
