import { describe, expect, it } from "vitest";
import { createDurableOccurrencesRuntime, createTemporalCoreRuntime, MemoryOccurrenceStore } from "../../src/index.js";

describe("durable-occurrences profile boundary", () => {
  it("claims durable occurrences without exposing execution behavior", () => {
    const runtime = createDurableOccurrencesRuntime(new MemoryOccurrenceStore());
    expect(runtime.capabilities()).toMatchObject({ ok: true, value: { profile: "durable-occurrences" } });
    expect(Object.keys(runtime)).not.toContain("execute");
    expect(Object.keys(runtime)).not.toContain("retry");
  });

  it("reports exact core families and intentional pending observer families", () => {
    expect(createTemporalCoreRuntime().capabilities()).toMatchObject({
      ok: true,
      value: {
        profile: "temporal-core",
        operations: { resolve: "partial" },
        features: expect.arrayContaining([
          { id: "snapshot-temporal-core", support: { resolve: "partial" } },
          { id: "locale-day-period", support: { resolve: "pending" } },
          { id: "dynamic-observers", support: { resolve: "pending" } }
        ])
      }
    });
  });
});
