import { describe, expectTypeOf, it } from "vitest";
import type { TemporalRuntime } from "../../src/index.js";

describe("C0 temporal boundary", () => {
  it("does not make downstream execution verbs callable", () => {
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("run");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("execute");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("dispatch");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("retry");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("ack");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("claim");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("complete");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("succeed");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("verify");
    expectTypeOf<TemporalRuntime>().not.toHaveProperty("fulfill");
  });
});
