import { describe, expect, it } from "vitest";
import { createTemporalCoreRuntime, localeSnapshot, resolveExpression } from "../../src/index.js";

describe("post-C6 locale snapshots", () => {
  const frame = {
    referenceTime: "2026-08-01T00:00:00Z",
    horizon: { kind: "count" as const, value: 1 },
    context: [{ kind: "timezone" as const, id: "UTC", version: "tzdb-2026a", value: { initialOffsetMinutes: 0, transitions: [] } }]
  };

  it("resolves a locale day-period only from an explicit versioned locale snapshot", () => {
    const locale = localeSnapshot({ id: "participant-locale", version: "cldr-46", locale: "en-US", periods: { morning: { start: { hour: 8, minute: 0 }, end: { hour: 12, minute: 0 } } } });
    expect(resolveExpression({ ...frame, context: [...frame.context, locale], expression: { kind: "window", value: { kind: "semantic_window", name: "morning" } } })).toMatchObject({
      ok: true, value: { status: "resolved", candidates: [{ value: { value: { locale: { id: "participant-locale", version: "cldr-46" } } } }] }
    });
  });

  it("returns a locale need instead of choosing an ambient default", () => {
    expect(resolveExpression({ ...frame, expression: { kind: "window", value: { kind: "semantic_window", name: "morning" } } })).toMatchObject({
      ok: true, value: { status: "unresolved", needs: [{ kind: "locale", requiredBy: "expression.window" }] }
    });
  });

  it("advertises explicit locale snapshots without claiming live observer support", () => {
    expect(createTemporalCoreRuntime().capabilities()).toMatchObject({
      ok: true,
      value: { features: expect.arrayContaining([{ id: "explicit-locale-snapshots", support: { resolve: "exact" } }, { id: "live-dynamic-observers", support: { resolve: "pending" } }]) }
    });
  });
});
