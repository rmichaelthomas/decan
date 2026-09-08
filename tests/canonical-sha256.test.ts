import { createHash } from "node:crypto";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../src/canonical/sha256.js";
import { canonicalizeText } from "../src/syntax/index.js";

const nodeHex = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

describe("the pure SHA-256 is byte-identical to node:crypto", () => {
  it("matches on the empty string and known vectors", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("matches across lengths that cross every padding boundary", () => {
    for (let length = 0; length <= 200; length += 1) {
      const text = "a".repeat(length);
      expect(sha256Hex(text), `length ${length}`).toBe(nodeHex(text));
    }
  });

  it("matches on multi-byte UTF-8, which is where a naive implementation diverges", () => {
    for (const text of ["Beyonc\u00e9", "\u65e5\u672c\u8a9e", "\ud83c\udfb5\ud83c\udfb6", "\u00e9"]) {
      expect(sha256Hex(text), text).toBe(nodeHex(text));
    }
  });

  it("matches on arbitrary strings", () => {
    fc.assert(fc.property(fc.string({ maxLength: 512 }), (text) => sha256Hex(text) === nodeHex(text)), { numRuns: 500 });
  });

  it("keeps the canonical expression hash consumers already pin", () => {
    const result = canonicalizeText({ surface: "canonical", text: "time\n  point 2022-07-29\n  repeat every year\n" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // MuseSky pins this value and asserts Decan produces it.
    expect(result.value.expressionHash).toBe("sha256:044209342ded7899ab43471d39119eb786478ca6948225e53e6a378c1d0a1990");
  });
});
