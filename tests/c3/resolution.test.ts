import { describe, expect, it } from "vitest";
import { resolveExpression } from "../../src/index.js";

describe("C3 explicit resolution core", () => {
  const request = {
    expression: { kind: "window" as const, value: { kind: "explicit_window" as const, start: { kind: "clock" as const, hour: 9, minute: 0 }, end: { kind: "clock" as const, hour: 10, minute: 0 } } },
    referenceTime: "2026-08-27T09:00:00-07:00[America/Los_Angeles]",
    horizon: { kind: "count" as const, value: 2 },
    context: [{ kind: "timezone" as const, id: "America/Los_Angeles", version: "tzdb-2026a", value: { initialOffsetMinutes: -420, transitions: [] } }]
  };

  it("produces a deterministic finite window candidate from explicit snapshots", () => {
    const result = resolveExpression(request);

    expect(result).toMatchObject({
      ok: true,
      value: {
        status: "resolved",
        id: expect.stringMatching(/^sha256:/),
        candidates: [{ id: expect.stringMatching(/^sha256:/), value: { kind: "window_candidate" } }],
        needs: [],
        contextUsed: request.context
      }
    });
  });

  it("returns a typed need when the required time-zone snapshot is absent", () => {
    const { context: _context, ...withoutContext } = request;

    expect(resolveExpression(withoutContext)).toMatchObject({
      ok: true,
      value: {
        status: "unresolved",
        candidates: [],
        needs: [{ kind: "timezone", requiredBy: "expression.window", reason: "Missing timezone snapshot" }]
      }
    });
  });

  it("turns a clock point into an instant using the supplied zone rules", () => {
    expect(resolveExpression({ ...request, expression: { kind: "point", value: { kind: "clock", hour: 9, minute: 0, second: 30 } } })).toMatchObject({
      ok: true,
      value: { status: "resolved", candidates: [{ value: { value: { instants: ["2026-08-27T16:00:30Z[America/Los_Angeles]"] } } }] }
    });
  });

  it("rejects an unbounded resolution horizon at the operation boundary", () => {
    expect(resolveExpression({ ...request, horizon: { kind: "count", value: 0 } })).toMatchObject({
      ok: false,
      errors: [{ category: "resolution", code: "DECAN-RESOLUTION-HORIZON-FINITE" }]
    });
  });
});
