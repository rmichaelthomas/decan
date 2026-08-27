import { describe, expect, it } from "vitest";
import { deserializeInterchange } from "../../src/index.js";

describe("C1 fail-closed compatibility", () => {
  it("rejects unknown semantic fields, node kinds, versions, and null", () => {
    const invalid = [
      '{"format":"temporal-intent","version":"0.1","type":"expression","expression":{"kind":"point","value":{"kind":"clock","hour":9,"minute":0},"surprise":true}}',
      '{"format":"temporal-intent","version":"0.1","type":"expression","expression":{"kind":"future"}}',
      '{"format":"temporal-intent","version":"9.9","type":"expression","expression":{"kind":"point","value":{"kind":"clock","hour":9,"minute":0}}}',
      '{"format":"temporal-intent","version":"0.1","type":"expression","expression":null}'
      ,'{"format":"temporal-intent","version":"0.1","type":"expression","expression":{"kind":"selection","selector":{"kind":"all"},"filter":{"kind":"weekday","value":"friday"},"surprise":true}}'
      ,'{"format":"temporal-intent","version":"0.1","type":"expression","expression":{"kind":"selection","selector":{"kind":"future"}}}'
      ,'{"format":"temporal-intent","version":"0.1","type":"expression","expression":{"kind":"adjustment","when":{"kind":"event","reference":"@holiday"},"operation":{"kind":"preserve","aspect":"local_civil_time","surprise":true}}}'
    ];
    for (const bytes of invalid) expect(deserializeInterchange({ bytes })).toMatchObject({ ok: false, errors: [expect.objectContaining({ category: "interchange" })] });
  });

  it("accepts the explicit all-candidates selector needed by select Friday", () => {
    const bytes = '{"format":"temporal-intent","version":"0.1","type":"expression","expression":{"kind":"selection","selector":{"kind":"all"},"filter":{"kind":"weekday","value":"friday"}}}';
    expect(deserializeInterchange({ bytes })).toMatchObject({ ok: true, value: { expression: { kind: "selection", selector: { kind: "all" } } } });
  });

  it("does not accept unknown fields within a complete intent envelope", () => {
    const bytes = '{"format":"temporal-intent","version":"0.1","type":"intent","intent":{"id":"payroll","expression":{"kind":"compound","expressions":[]},"surprise":true}}';
    expect(deserializeInterchange({ bytes })).toMatchObject({ ok: false, errors: [expect.objectContaining({ category: "interchange" })] });
  });
});
