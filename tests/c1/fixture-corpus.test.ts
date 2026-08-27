import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalizeText } from "../../src/index.js";

describe("C1 portable fixture corpus", () => {
  it("converges authoring evidence onto its canonical fixture", () => {
    const fixture = resolve(process.cwd(), "fixtures/c1/basic-monthly-window");
    const authoring = readFileSync(resolve(fixture, "authoring.ti"), "utf8");
    const canonical = readFileSync(resolve(fixture, "canonical.ti"), "utf8");
    const result = canonicalizeText({ surface: "authoring", text: authoring });
    expect(result).toEqual({ ok: true, value: expect.objectContaining({ canonicalText: canonical }) });
  });
});
