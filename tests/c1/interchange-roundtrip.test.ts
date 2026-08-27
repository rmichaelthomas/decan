import { describe, expect, it } from "vitest";
import { deserializeInterchange, serializeInterchange } from "../../src/index.js";

describe("C1 canonical interchange", () => {
  it("serializes and deserializes an expression through the I-1 envelope with stable bytes", () => {
    const expression = {
      kind: "compound" as const,
      expressions: [{ kind: "point" as const, value: { kind: "clock" as const, hour: 9, minute: 0 } }]
    };
    const first = serializeInterchange({ record: expression });
    expect(first).toMatchObject({ ok: true, value: { envelope: { format: "temporal-intent", version: "0.1", type: "expression" } } });
    if (!first.ok) throw new Error("expected serialization");

    const decoded = deserializeInterchange({ bytes: first.value.bytes });
    expect(decoded).toEqual({ ok: true, value: first.value.envelope });
    if (!decoded.ok || decoded.value.expression === undefined) throw new Error("expected expression envelope");

    const second = serializeInterchange({ record: decoded.value.expression });
    expect(second).toMatchObject({ ok: true });
    if (!second.ok) throw new Error("expected reserialization");
    expect(second.value.bytes).toBe(first.value.bytes);
  });

  it("normalizes semantic expression order before producing RFC 8785 bytes", () => {
    const left = serializeInterchange({ record: { kind: "compound", expressions: [
      { kind: "window", value: { kind: "semantic_window", name: "morning" } },
      { kind: "repeat", every: 1, unit: "month", mode: "civil" }
    ] } });
    const right = serializeInterchange({ record: { kind: "compound", expressions: [
      { kind: "repeat", every: 1, unit: "month", mode: "civil" },
      { kind: "window", value: { kind: "semantic_window", name: "morning" } }
    ] } });
    expect(left).toMatchObject({ ok: true });
    expect(right).toMatchObject({ ok: true });
    if (!left.ok || !right.ok) throw new Error("expected serialization");
    expect(left.value.bytes).toBe(right.value.bytes);
  });
});
