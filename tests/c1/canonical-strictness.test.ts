import { describe, expect, it } from "vitest";
import { parseDocument } from "../../src/index.js";

describe("C1 strict canonical surface", () => {
  it("rejects authoring aliases on the canonical surface", () => {
    const result = parseDocument({ surface: "canonical", text: "time\n  point 9am\n" });
    expect(result).toMatchObject({ ok: false, errors: [expect.objectContaining({ category: "syntax" })] });
  });

  it("rejects tabs and reserved punctuation", () => {
    expect(parseDocument({ surface: "canonical", text: "time\n\tpoint 09:00\n" })).toMatchObject({ ok: false });
    expect(parseDocument({ surface: "authoring", text: "time\n  point 09:00!\n" })).toMatchObject({ ok: false });
  });

  it("rejects recurrence aliases while allowing them at the authoring edge", () => {
    expect(parseDocument({ surface: "canonical", text: "time\n  repeat every 1 month\n" })).toMatchObject({ ok: false });
    expect(parseDocument({ surface: "canonical", text: "time\n  repeat every 2 week\n" })).toMatchObject({ ok: false });
    expect(parseDocument({ surface: "authoring", text: "time\n  repeat every 1 month\n" })).toMatchObject({ ok: true });
  });
});
