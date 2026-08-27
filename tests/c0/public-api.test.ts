import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  CanonicalizeRequest,
  DeserializeRequest,
  Diagnostic,
  MaterializeRequest,
  OperationResult,
  ParseRequest,
  ResolveRequest,
  SerializeRequest,
  TemporalError,
  TemporalRuntime
} from "../../src/index.js";

describe("C0 public runtime contract", () => {
  it("exposes exactly the locked temporal observation operations", () => {
    expectTypeOf<TemporalRuntime>().toMatchTypeOf<{
      parse(request: ParseRequest): unknown;
      canonicalize(request: CanonicalizeRequest): unknown;
      print(request: unknown): unknown;
      validate(request: unknown): unknown;
      serialize(request: SerializeRequest): unknown;
      deserialize(request: DeserializeRequest): unknown;
      resolve(request: ResolveRequest): unknown;
      materialize(request: MaterializeRequest): unknown;
      queryOccurrences(request: unknown): unknown;
      getOccurrence(request: unknown): unknown;
      inspect(request: unknown): unknown;
      explain(request: unknown): unknown;
      capabilities(request?: unknown): unknown;
    }>();
  });

  it("uses the shared success-or-operation-failure envelope", () => {
    type Success = Extract<OperationResult<{ readonly state: "known" }>, { ok: true }>;
    type Failure = Extract<OperationResult<{ readonly state: "known" }>, { ok: false }>;
    expectTypeOf<Success["ok"]>().toEqualTypeOf<true>();
    expectTypeOf<Success["value"]>().toEqualTypeOf<{ readonly state: "known" }>();
    expectTypeOf<Success["diagnostics"]>().toMatchTypeOf<ReadonlyArray<Diagnostic> | undefined>();
    expectTypeOf<Failure["ok"]>().toEqualTypeOf<false>();
    expectTypeOf<Failure["errors"]>().toMatchTypeOf<ReadonlyArray<TemporalError>>();
    expectTypeOf<Failure["diagnostics"]>().toMatchTypeOf<ReadonlyArray<Diagnostic> | undefined>();
    expect(true).toBe(true);
  });
});
