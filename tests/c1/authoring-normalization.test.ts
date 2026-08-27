import { describe, expect, it } from "vitest";
import { canonicalizeText } from "../../src/index.js";

describe("C1 authoring normalization", () => {
  it("normalizes aliases, CRLF, and declaration order into one canonical document", () => {
    const result = canonicalizeText({
      surface: "authoring",
      text: "time\r\n  window morning\r\n  select second Tuesday\r\n  repeat every 1 month\r\n  point 9 AM\r\n"
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        canonicalText: "time\n  point 09:00\n  repeat every month\n  select second Tuesday\n  window morning\n"
      })
    });
  });

  it("normalizes a relation block and explicit business amount without resolving its reference", () => {
    const result = canonicalizeText({
      surface: "authoring",
      text: "time\n  relation\n    after @approval\n    offset 3 business days\n"
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        canonicalText: "time\n  relation\n    after @approval\n    offset 3 business days\n"
      })
    });
  });

  it("normalizes the specified boundary alias without adding meaning", () => {
    const result = canonicalizeText({ surface: "authoring", text: "time\n  boundary no later than noon\n" });
    expect(result).toEqual({ ok: true, value: expect.objectContaining({ canonicalText: "time\n  boundary by noon\n" }) });
  });
});
