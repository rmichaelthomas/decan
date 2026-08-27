import { describe, expect, it } from "vitest";
import { canonicalizeText, resolveExpression } from "../../src/index.js";

describe("C3 elapsed instant resolution", () => {
  it("applies elapsed hour offsets to explicit instant-valued references", () => {
    expect(resolveExpression({
      expression: {
        kind: "relation",
        relation: "after",
        anchor: { kind: "event", reference: "@resource-touch" },
        offset: { kind: "offset", amount: { value: 24, unit: "hour", mode: "elapsed" } }
      },
      referenceTime: "2026-08-27T18:00:00Z",
      horizon: { kind: "count", value: 1 },
      references: [{ id: "@resource-touch", version: "test", value: { instant: "2026-08-27T18:00:00Z" } }]
    })).toMatchObject({
      ok: true,
      value: {
        status: "resolved",
        candidates: [{ value: { kind: "point_candidate", value: { instant: "2026-08-28T18:00:00Z" } } }],
        needs: []
      }
    });
  });

  it("accepts elapsed sub-day recurrence source and expands from an instant origin", () => {
    const canonical = canonicalizeText({
      surface: "authoring",
      text: [
        "time",
        "  relation",
        "    after @process-started",
        "    offset 10 seconds elapsed",
        "  repeat every 30 seconds elapsed",
        "reference process-started",
        "  kind event",
        ""
      ].join("\n")
    });
    expect(canonical).toMatchObject({ ok: true });
    if (!canonical.ok) throw new Error("expected elapsed repeat source to canonicalize");

    expect(resolveExpression({
      expression: canonical.value.document.expression,
      referenceTime: "2026-08-27T17:00:00Z",
      horizon: { kind: "count", value: 3 },
      lifecycle: { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 } },
      references: [{ id: "@process-started", version: "test", value: { instant: "2026-08-27T17:00:00Z" } }]
    })).toMatchObject({
      ok: true,
      value: {
        status: "resolved",
        candidates: [
          { value: { kind: "point_candidate", value: { instant: "2026-08-27T17:00:10Z" } } },
          { value: { kind: "point_candidate", value: { instant: "2026-08-27T17:00:40Z" } } },
          { value: { kind: "point_candidate", value: { instant: "2026-08-27T17:01:10Z" } } }
        ],
        needs: []
      }
    });
  });
});
