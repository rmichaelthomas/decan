import { describe, expect, it } from "vitest";
import { canonicalizeText } from "../../src/index.js";

describe("C1 canonical identity", () => {
  it("gives equivalent authoring forms one SHA-256 expression identity", () => {
    const first = canonicalizeText({ surface: "authoring", text: "time\n  repeat every 1 week\n  point 9am\n" });
    const second = canonicalizeText({ surface: "authoring", text: "time\n  point 09:00\n  repeat every week\n" });

    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({ ok: true });
    if (!first.ok || !second.ok) throw new Error("expected source to canonicalize");
    expect(first.value.expressionHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(first.value.expressionHash).toBe(second.value.expressionHash);
  });
});
