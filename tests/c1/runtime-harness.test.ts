import { describe, expect, it } from "vitest";
import { createSyntaxInterchangeRuntime } from "../../src/index.js";

describe("C1 syntax-interchange runtime adapter", () => {
  it("reports only syntax-interchange conformance and performs the C1 stages", () => {
    const runtime = createSyntaxInterchangeRuntime();
    const parsed = runtime.parse({ surface: "authoring", text: "time\n  point 9am\n" });
    expect(parsed).toMatchObject({ ok: true });
    expect(runtime.capabilities()).toMatchObject({ ok: true, value: { profile: "syntax-interchange" } });
  });
});
