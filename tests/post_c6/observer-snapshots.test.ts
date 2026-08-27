import { describe, expect, it } from "vitest";
import { observationReference, resolveExpression } from "../../src/index.js";

describe("post-C6 observer snapshots", () => {
  const frame = {
    referenceTime: "2026-08-01T00:00:00Z",
    horizon: { kind: "count" as const, value: 1 },
    context: [{ kind: "timezone" as const, id: "UTC", version: "tzdb-2026a", value: { initialOffsetMinutes: 0, transitions: [] } }]
  };

  it("gates candidates from an explicit versioned completion observation", () => {
    const approval = observationReference({ id: "approval", kind: "completion", version: "event-7", observedAt: "2026-08-01T08:00:00Z", value: true });
    const result = resolveExpression({ ...frame, references: [approval], expression: { kind: "compound", expressions: [{ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 2 } }, { kind: "condition", mode: "gate", predicate: { kind: "event", reference: "@approval" } }] } });

    expect(result).toMatchObject({ ok: true, value: { status: "resolved", candidates: [{ value: { value: { date: "2026-08-02" } } }], contextUsed: frame.context } });
  });

  it("suppresses candidates when the supplied gate observation is false", () => {
    const approval = observationReference({ id: "approval", kind: "completion", version: "event-8", observedAt: "2026-08-01T08:00:00Z", value: false });

    expect(resolveExpression({ ...frame, references: [approval], expression: { kind: "compound", expressions: [{ kind: "point", value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 2 } }, { kind: "condition", mode: "gate", predicate: { kind: "event", reference: "@approval" } }] } })).toMatchObject({ ok: true, value: { status: "resolved", candidates: [] } });
  });
});
