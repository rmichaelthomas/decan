import { describe, expect, it } from "vitest";
import { createValidationRuntime } from "../../src/index.js";
import type { NormalizedDocument } from "../../src/model/types.js";
import { validateDocument } from "../../src/validation/validate.js";

const documentWith = (expressions: NormalizedDocument["expression"]["expressions"]): NormalizedDocument => ({
  expression: { kind: "compound", expressions },
  references: [],
  context: [],
  lifecycle: {
    status: "active",
    version: 1,
    effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 }
  }
});

describe("C2 semantic validation", () => {
  it("exposes validation through the public C2 runtime", () => {
    const runtime = createValidationRuntime();

    expect(runtime.validate({ document: documentWith([]) })).toEqual({
      ok: true,
      value: { status: "valid", errors: [], unresolvedDependencies: [] }
    });
  });

  it("rejects a non-positive recurrence interval after parsing", () => {
    const result = validateDocument(documentWith([{ kind: "repeat", every: 0, unit: "week", mode: "civil" }]));

    expect(result).toEqual({
      ok: true,
      value: {
        status: "invalid",
        errors: [{
          category: "validation",
          code: "DECAN-VALIDATION-REPEAT-POSITIVE",
          message: "Recurrence intervals must be positive.",
          path: "expression.expressions[0].every",
          remediation: "correct_source"
        }],
        unresolvedDependencies: []
      }
    });
  });

  it("keeps a declared unresolved reference valid while reporting its dependency", () => {
    const result = validateDocument({
      expression: {
        kind: "compound",
        expressions: [{
          kind: "relation",
          relation: "after",
          anchor: { kind: "event", reference: "@planning" }
        }]
      },
      references: [{ id: "planning", kind: "event", status: "unresolved" }],
      context: [],
      lifecycle: { status: "active", version: 1 }
    });

    expect(result).toEqual({
      ok: true,
      value: {
        status: "valid",
        errors: [],
        unresolvedDependencies: [{ kind: "reference", id: "@planning" }]
      }
    });
  });

  it("rejects an elapsed month instead of silently changing its meaning", () => {
    const result = validateDocument(documentWith([{
      kind: "offset",
      amount: { value: 1, unit: "month", mode: "elapsed" }
    }]));

    expect(result).toMatchObject({
      ok: true,
      value: {
        status: "invalid",
        errors: [{
          category: "validation",
          code: "DECAN-VALIDATION-DURATION-MODE",
          path: "expression.expressions[0].amount"
        }]
      }
    });
  });

  it("requires a lifecycle origin for recurrence instead of using resolver time", () => {
    const result = validateDocument({
      ...documentWith([{ kind: "repeat", every: 1, unit: "month", mode: "civil" }]),
      lifecycle: { status: "active", version: 1 }
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        status: "invalid",
        errors: [{
          category: "validation",
          code: "DECAN-VALIDATION-RECURRENCE-ORIGIN",
          path: "lifecycle.effectiveFrom"
        }]
      }
    });
  });

  it("requires every referenced anchor to be explicitly declared", () => {
    const result = validateDocument(documentWith([{
      kind: "relation",
      relation: "after",
      anchor: { kind: "event", reference: "@planning" }
    }]));

    expect(result).toMatchObject({
      ok: true,
      value: {
        status: "invalid",
        errors: [{
          category: "validation",
          code: "DECAN-VALIDATION-REFERENCE-DECLARED",
          path: "expression.expressions[0].anchor.reference"
        }],
        unresolvedDependencies: []
      }
    });
  });

  it("requires duration expressions to state their semantic role", () => {
    const result = validateDocument(documentWith([{
      kind: "duration",
      amount: { value: 30, unit: "minute", mode: "elapsed" }
    }]));

    expect(result).toMatchObject({
      ok: true,
      value: {
        status: "invalid",
        errors: [{
          category: "validation",
          code: "DECAN-VALIDATION-DURATION-ROLE",
          path: "expression.expressions[0].role"
        }]
      }
    });
  });

  it("rejects competing adjustments when no precedence resolves the conflict", () => {
    const result = validateDocument({
      ...documentWith([{
        kind: "adjustment",
        when: { kind: "event", reference: "@holiday" },
        operation: { kind: "preserve", aspect: "local_civil_time" }
      }, {
        kind: "adjustment",
        when: { kind: "event", reference: "@holiday" },
        operation: { kind: "preserve", aspect: "anchor_relation" }
      }]),
      references: [{ id: "holiday", kind: "event", status: "resolved" }]
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        status: "invalid",
        errors: [{
          category: "validation",
          code: "DECAN-VALIDATION-ADJUSTMENT-CONFLICT",
          path: "expression.expressions[1].precedence"
        }]
      }
    });
  });
});
