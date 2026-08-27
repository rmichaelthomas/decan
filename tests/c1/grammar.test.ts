import { describe, expect, it } from "vitest";
import { canonicalizeText } from "../../src/index.js";

describe("C1 frozen statement grammar", () => {
  it("accepts the non-executable canonical statement shapes", () => {
    const result = canonicalizeText({
      surface: "canonical",
      text: [
        "intent payroll-close",
        "source",
        "  kind natural_language",
        "  value \"Close payroll # on Friday.\"",
        "  created-at \"2026-08-27T06:00:00Z\"",
        "time",
        "  point noon",
        "  window 08:00 to 12:00",
        "  repeat every 2 weeks",
        "  select last business day",
        "  select Friday",
        "  relation",
        "    after @approval",
        "    offset 3 business days",
        "  condition gate",
        "    when @office-open",
        "    for at-least 30 minutes elapsed",
        "  boundary by 17:00",
        "  except @holidays",
        "  adjust",
        "    when @holiday",
        "    precedence 2",
        "    move forward to next business day",
        "  adjust",
        "    when @manual-close",
        "    substitute point 17:00",
        "reference approval",
        "  kind event",
        "  source \"workflow:approval\"",
        "context",
        "  calendar holidays @us.federal-holidays",
        "lifecycle",
        "  status active",
        "  effective-from 2026-08-28",
        ""
      ].join("\n")
    });

    expect(result).toMatchObject({ ok: true, value: { canonicalText: expect.stringContaining("intent payroll-close\n") } });
    if (!result.ok) throw new Error("expected canonicalization");
    expect(result.value.canonicalText).toContain("  select Friday\n");
    expect(result.value.canonicalText).toContain("    substitute point 17:00\n");
    expect(result.value.canonicalText).toContain('  value "Close payroll # on Friday."\n');
  });
});
