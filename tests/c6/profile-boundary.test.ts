import { describe, expect, it } from "vitest";
import { createDurableOccurrencesRuntime, MemoryOccurrenceStore } from "../../src/index.js";

describe("durable-occurrences profile boundary", () => {
  it("claims durable occurrences without exposing execution behavior", () => {
    const runtime = createDurableOccurrencesRuntime(new MemoryOccurrenceStore());
    expect(runtime.capabilities()).toMatchObject({ ok: true, value: { profile: "durable-occurrences" } });
    expect(Object.keys(runtime)).not.toContain("execute");
    expect(Object.keys(runtime)).not.toContain("retry");
  });
});
