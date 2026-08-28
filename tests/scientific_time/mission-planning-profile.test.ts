import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { astronomicalSnapshot, explicitReference, resolveExpression } from "../../src/index.js";

describe("scientific mission-planning profile", () => {
  test("preserves an authoritative eclipse event and resolves its elapsed relation", () => {
    const astronomy = astronomicalSnapshot({ id: "spice.eclipse", version: "kernel-2026-08-27", value: { source: "authoritative ephemeris", timeScale: "UTC" } });
    const eclipseEntry = explicitReference({ id: "@eclipse-entry", version: "event-42", value: { instant: "2026-08-27T12:00:00Z" } });
    expect(resolveExpression({
      referenceTime: "2026-08-27T00:00:00Z", horizon: { kind: "count", value: 1 }, context: [astronomy], references: [eclipseEntry],
      expression: { kind: "relation", relation: "after", anchor: { kind: "event", reference: "@eclipse-entry" }, offset: { kind: "offset", amount: { value: 30, unit: "second", mode: "elapsed" } } }
    })).toMatchObject({ ok: true, value: { status: "resolved", candidates: [{ value: { value: { instant: "2026-08-27T12:00:30Z" } } }], contextUsed: [astronomy] } });
  });

  test("records the profile escalation gate", () => {
    const spike = readFileSync(resolve(process.cwd(), "docs/scientific-time-spike.md"), "utf8");
    expect(spike).toContain("Mission-Planning Snapshot Profile");
    expect(spike).toContain("Scientific Time Profile");
    expect(spike).toContain("leap-second");
  });
});
