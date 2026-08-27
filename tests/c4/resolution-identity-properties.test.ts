import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { resolutionIdentity } from "../../src/index.js";

describe("C4 resolution identity properties", () => {
  it("is invariant to equivalent snapshot ordering and sensitive to provider versions", () => {
    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 5 }), (versions) => {
      const context = versions.map((version) => ({ kind: "timezone" as const, id: `zone-${version}`, version: "tzdb-2026a", value: version }));
      const expression = { kind: "point" as const, value: { kind: "date" as const, calendar: "iso8601" as const, year: 2026, month: 8, day: 27 } };
      const first = resolutionIdentity(expression, "2026-08-27T00:00:00Z", { kind: "count", value: 1 }, [], context);
      const reversed = resolutionIdentity(expression, "2026-08-27T00:00:00Z", { kind: "count", value: 1 }, [], [...context].reverse());
      expect(first).toBe(reversed);
      const changed = resolutionIdentity(expression, "2026-08-27T00:00:00Z", { kind: "count", value: 1 }, [], [{ ...context[0]!, version: "tzdb-2026b" }, ...context.slice(1)]);
      expect(changed).not.toBe(first);
    }));
  });
});
