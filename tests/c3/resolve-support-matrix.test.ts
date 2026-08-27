import { describe, expect, it } from "vitest";
import { classifyResolveSupport, createTemporalCoreRuntime, resolveExpression } from "../../src/index.js";
import type { TemporalExpression } from "../../src/index.js";

describe("C3 resolver support matrix", () => {
  it("classifies every Decan expression family instead of leaving general resolve vague", () => {
    const expressions: Readonly<Record<string, TemporalExpression>> = {
      point: { kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 } },
      window: { kind: "window", value: { kind: "semantic_window", name: "morning" } },
      repeat: { kind: "repeat", every: 1, unit: "week", mode: "civil" },
      selection: { kind: "selection", filter: { kind: "weekday", value: "monday" }, selector: { kind: "next" } },
      relation: { kind: "relation", relation: "after", anchor: { kind: "event", reference: "@approval" } },
      offset: { kind: "offset", amount: { value: 1, unit: "business_day", mode: "business" } },
      duration: { kind: "duration", amount: { value: 1, unit: "hour", mode: "elapsed" } },
      condition: { kind: "condition", mode: "gate", predicate: { kind: "event", reference: "@approval" } },
      boundary: { kind: "boundary", operator: "by", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 } },
      exception: { kind: "exception", predicate: { kind: "event", reference: "@holiday" }, effect: "suppress" },
      adjustment: { kind: "adjustment", when: { kind: "event", reference: "@holiday" }, operation: { kind: "preserve", aspect: "local_civil_time" } },
      compound: { kind: "compound", expressions: [{ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 } }] }
    };

    expect(Object.fromEntries(Object.entries(expressions).map(([name, expression]) => [name, classifyResolveSupport(expression)]))).toEqual({
      point: { expressionKind: "point", support: "exact", outcome: "candidate", needs: [], unsupported: [] },
      window: { expressionKind: "window", support: "needs", outcome: "needs", needs: ["locale"], unsupported: [] },
      repeat: { expressionKind: "repeat", support: "needs", outcome: "needs", needs: ["lifecycle.effectiveFrom"], unsupported: [] },
      selection: { expressionKind: "selection", support: "unsupported", outcome: "unsupported", needs: [], unsupported: ["selector.next"] },
      relation: { expressionKind: "relation", support: "needs", outcome: "needs", needs: ["reference:@approval"], unsupported: [] },
      offset: { expressionKind: "offset", support: "needs", outcome: "needs", needs: ["calendar"], unsupported: [] },
      duration: { expressionKind: "duration", support: "unsupported", outcome: "unsupported", needs: [], unsupported: ["duration.as-candidate"] },
      condition: { expressionKind: "condition", support: "needs", outcome: "needs", needs: ["reference:@approval"], unsupported: [] },
      boundary: { expressionKind: "boundary", support: "unsupported", outcome: "unsupported", needs: [], unsupported: ["boundary.as-candidate"] },
      exception: { expressionKind: "exception", support: "needs", outcome: "needs", needs: ["reference:@holiday"], unsupported: [] },
      adjustment: { expressionKind: "adjustment", support: "needs", outcome: "needs", needs: ["reference:@holiday"], unsupported: [] },
      compound: { expressionKind: "compound", support: "exact", outcome: "candidate", needs: [], unsupported: [] }
    });
  });

  it("reports unsupported expression families as typed feature needs at resolution time", () => {
    expect(resolveExpression({
      referenceTime: "2026-08-27T12:00:00Z",
      horizon: { kind: "count", value: 1 },
      expression: { kind: "boundary", operator: "by", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 } }
    })).toMatchObject({
      ok: true,
      value: {
        status: "unresolved",
        candidates: [],
        needs: [{ kind: "feature", requiredBy: "expression.boundary", reason: "Boundary expressions are constraints, not standalone occurrence candidates." }]
      }
    });
  });

  it("promotes temporal-core resolve to exact classification while preserving out-of-core boundaries", () => {
    expect(createTemporalCoreRuntime().capabilities()).toMatchObject({
      ok: true,
      value: {
        operations: { resolve: "exact" },
        features: expect.arrayContaining([
          { id: "resolve-support-matrix", support: { resolve: "exact" } },
          { id: "live-dynamic-observers", support: { resolve: "unsupported" } }
        ])
      }
    });
  });
});
