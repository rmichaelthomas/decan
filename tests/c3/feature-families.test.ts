import { describe, expect, it } from "vitest";
import { resolveExpression } from "../../src/index.js";

const frame = {
  referenceTime: "2026-08-01T00:00:00Z",
  horizon: { kind: "count" as const, value: 2 },
  context: [{ kind: "timezone" as const, id: "UTC", version: "tzdb-2026a", value: "UTC" }]
};

describe("C3 exact feature families", () => {
  it("generates recurrence dates from the explicit lifecycle origin", () => {
    expect(resolveExpression({ ...frame, lifecycle: { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 1 } }, expression: { kind: "repeat", every: 1, unit: "week", mode: "civil" } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-08-01" } } }, { value: { value: { date: "2026-08-08" } } }] }
    });
  });

  it("selects the second Tuesday deterministically", () => {
    expect(resolveExpression({ ...frame, expression: { kind: "selection", filter: { kind: "weekday", value: "tuesday" }, selector: { kind: "ordinal", value: 2 } } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-08-11" } } }] }
    });
  });

  it("returns a calendar need rather than guessing business-day arithmetic", () => {
    expect(resolveExpression({ ...frame, expression: { kind: "offset", amount: { value: 1, unit: "business_day", mode: "business" } } })).toMatchObject({
      ok: true, value: { status: "unresolved", needs: [{ kind: "calendar", requiredBy: "expression.offset" }] }
    });
  });

  it("uses a versioned custom snapshot for semantic windows", () => {
    expect(resolveExpression({ ...frame, context: [...frame.context, { kind: "custom", id: "acme:focus", version: "3", value: { start: "09:00", end: "10:00" } }], expression: { kind: "window", value: { kind: "semantic_window", name: "acme:focus" } } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { provider: { id: "acme:focus", version: "3" } } } }] }
    });
  });

  it("suppresses candidates when an explicit exception predicate is true", () => {
    expect(resolveExpression({ ...frame, references: [{ id: "@holiday", version: "calendar-1", value: true }], expression: { kind: "compound", expressions: [{ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 11 } }, { kind: "exception", predicate: { kind: "event", reference: "@holiday" }, effect: "suppress" }] } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [] }
    });
  });

  it("returns a conflict rather than choosing between equally applicable adjustments", () => {
    expect(resolveExpression({ ...frame, references: [{ id: "@holiday", version: "calendar-1", value: true }], expression: { kind: "compound", expressions: [{ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 11 } }, { kind: "adjustment", when: { kind: "event", reference: "@holiday" }, operation: { kind: "preserve", aspect: "local_civil_time" } }, { kind: "adjustment", when: { kind: "event", reference: "@holiday" }, operation: { kind: "preserve", aspect: "anchor_relation" } }] } })).toMatchObject({
      ok: true, value: { status: "conflicted", candidates: [] }
    });
  });

  it("applies a calendar offset to an explicit generated candidate", () => {
    expect(resolveExpression({ ...frame, expression: { kind: "compound", expressions: [{ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 30 } }, { kind: "offset", amount: { value: 2, unit: "day", mode: "calendar" } }] } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-09-01" } } }] }
    });
  });

  it("resolves a relation and its offset from the explicit reference snapshot", () => {
    expect(resolveExpression({ ...frame, references: [{ id: "@approval", version: "event-1", value: { date: "2026-08-30" } }], expression: { kind: "relation", relation: "after", anchor: { kind: "event", reference: "@approval" }, offset: { kind: "offset", amount: { value: 2, unit: "day", mode: "calendar" } } } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-09-01" } } }] }
    });
  });

  it("applies before relations by subtracting the declared offset", () => {
    expect(resolveExpression({ ...frame, references: [{ id: "@approval", version: "event-1", value: { date: "2026-08-30" } }], expression: { kind: "relation", relation: "before", anchor: { kind: "event", reference: "@approval" }, offset: { kind: "offset", amount: { value: 2, unit: "day", mode: "calendar" } } } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-08-28" } } }] }
    });
  });

  it("uses an explicit versioned calendar for business-day offsets", () => {
    expect(resolveExpression({ ...frame, context: [...frame.context, { kind: "calendar", id: "us", version: "2026.1", value: { closedDates: ["2026-08-31"] } }], expression: { kind: "compound", expressions: [{ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 28 } }, { kind: "offset", amount: { value: 1, unit: "business_day", mode: "business" } }] } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-09-01" } } }] }
    });
  });

  it("selects deterministic business-day candidates from the supplied calendar", () => {
    expect(resolveExpression({ ...frame, context: [...frame.context, { kind: "calendar", id: "us", version: "2026.1", value: { closedDates: ["2026-08-31"] } }], expression: { kind: "selection", filter: { kind: "business_day" }, selector: { kind: "ordinal", value: -1 } } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-08-28" } } }] }
    });
  });

  it("applies the count horizon to a finite selected candidate set", () => {
    expect(resolveExpression({ ...frame, expression: { kind: "selection", filter: { kind: "weekday", value: "tuesday" }, selector: { kind: "all" } } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-08-04" } } }, { value: { value: { date: "2026-08-11" } } }] }
    });
  });

  it("filters generated dates at an explicit until horizon", () => {
    expect(resolveExpression({ ...frame, horizon: { kind: "until", value: "2026-08-11T23:59:59Z" }, expression: { kind: "selection", filter: { kind: "weekday", value: "tuesday" }, selector: { kind: "all" } } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-08-04" } } }, { value: { value: { date: "2026-08-11" } } }] }
    });
  });

  it("applies one explicit substitute adjustment", () => {
    expect(resolveExpression({ ...frame, references: [{ id: "@holiday", version: "calendar-1", value: true }], expression: { kind: "compound", expressions: [{ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 11 } }, { kind: "adjustment", when: { kind: "event", reference: "@holiday" }, operation: { kind: "substitute", target: { kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 12 } } } }] } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-08-12" } } }] }
    });
  });
});
