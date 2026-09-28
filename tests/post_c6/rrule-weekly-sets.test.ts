import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { exportRRule, importCronExpression, importRRule, resolveSeries } from "../../src/index.js";
import type { IntentLifecycle, TemporalExpression } from "../../src/model/types.js";

const clock = (hour: number, minute = 0) => ({ kind: "point", value: { kind: "clock", hour, minute } }) as const;
const weekly = (every: number) => ({ kind: "repeat", every, unit: "week", mode: "civil" }) as const;
const all = (value: string) => ({ kind: "selection", filter: { kind: "weekday", value }, selector: { kind: "all" } });
const exact = (dtstart: string, rrule: string, exdates?: ReadonlyArray<string>) => {
  const result = importRRule({ dtstart, rrule, ...(exdates ? { exdates } : {}) });
  if (!result.ok) throw new Error(`expected exact import of ${rrule}: ${result.errors[0]?.message}`);
  expect(result.value.lossReport.fidelity).toBe("exact");
  return result.value;
};
const expectUnsupported = (dtstart: string, rrule: string, pattern?: RegExp) => {
  const result = importRRule({ dtstart, rrule });
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors[0]).toMatchObject({ category: "capability", code: "DECAN-ADAPTER-RRULE-UNSUPPORTED", details: { lossReport: { fidelity: "unsupported" } } });
  if (pattern) expect(result.errors[0]!.message).toMatch(pattern);
};
const roundTrip = (dtstart: string, rrule: string, exdates?: ReadonlyArray<string>) => {
  const first = exact(dtstart, rrule, exdates);
  const exported = exportRRule({ expression: first.expression, lifecycle: first.lifecycle, ...(first.horizon ? { horizon: first.horizon } : {}) });
  if (!exported.ok) throw new Error(`expected exact export of ${rrule}`);
  expect(exported.value.lossReport.fidelity).toBe("exact");
  const [dtLine, ruleLine, ...rest] = exported.value.contentLines;
  const reExdates = rest.find((line) => line.startsWith("EXDATE:"))?.slice("EXDATE:".length).split(",");
  const second = exact(dtLine!.slice("DTSTART:".length), ruleLine!.slice("RRULE:".length), reExdates);
  expect(second.expression).toEqual(first.expression);
  expect(second.horizon).toEqual(first.horizon);
  expect(second.lifecycle).toEqual(first.lifecycle);
  return { first, contentLines: exported.value.contentLines };
};

describe("RRULE import: weekly weekday sets", () => {
  it("imports WEEKLY;BYDAY=MO,WE as a week-scoped weekday-set compound", () => {
    const imported = exact("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6");
    expect(imported.expression).toEqual({ kind: "compound", expressions: [clock(18), weekly(1), all("monday"), all("wednesday")] });
    expect(imported.horizon).toEqual({ kind: "count", value: 6 });
    expect(imported.lifecycle.effectiveFrom).toEqual({ kind: "date", calendar: "iso8601", year: 2026, month: 9, day: 14 });
    expect(imported.diagnostics).toEqual([{ code: "DECAN-ADAPTER-RRULE-EXACT-SUBSET", message: "Imported exact weekly weekday-set RRULE subset." }]);
    expect(imported.lossReport.preserved).toEqual(["weekly weekday-set selection", "local clock point", "lifecycle origin", "explicit occurrence count (COUNT)"]);
  });

  it("imports a single weekly BYDAY that differs from DTSTART's weekday as a one-day set", () => {
    const imported = exact("20260915T180000", "FREQ=WEEKLY;BYDAY=TH"); // 2026-09-15 is a Tuesday
    expect(imported.expression).toEqual({ kind: "compound", expressions: [clock(18), weekly(1), all("thursday")] });
  });

  it("keeps a single weekly BYDAY matching DTSTART as a plain weekly repeat with no selection", () => {
    const imported = exact("20260915T180000", "FREQ=WEEKLY;BYDAY=TU");
    expect(imported.expression).toEqual({ kind: "compound", expressions: [clock(18), weekly(1)] });
    expect(imported.diagnostics[0]!.message).toBe("Imported exact weekly RRULE subset.");
  });

  it("canonicalizes BYDAY order to MO..SU so the expression does not depend on source order", () => {
    expect(exact("20260914T180000", "FREQ=WEEKLY;BYDAY=SU,WE,MO").expression).toEqual(exact("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE,SU").expression);
  });

  it("carries INTERVAL, UNTIL, and EXDATE markers with a weekday set", () => {
    const imported = exact("20260915T090000", "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;UNTIL=20261231", ["20260929T090000"]);
    expect(imported.expression).toEqual({ kind: "compound", expressions: [clock(9), weekly(2), all("tuesday"), all("thursday"), { kind: "exception", predicate: { kind: "expression", reference: "@exdate:20260929T090000" }, effect: "suppress" }] });
    expect(imported.horizon).toEqual({ kind: "until", value: "2026-12-31" });
    expect(imported.lossReport.preserved).toContain("1 explicit exception date(s) (EXDATE)");
  });

  it("fails closed on ordinals and repeated weekdays at weekly frequency", () => {
    expectUnsupported("20260914T180000", "FREQ=WEEKLY;BYDAY=1MO,WE", /bare weekdays only/);
    expectUnsupported("20260914T180000", "FREQ=WEEKLY;BYDAY=-1FR", /bare weekdays only/);
    expectUnsupported("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,MO", /more than once/);
  });
});

describe("RRULE import: DAILY;INTERVAL=1 with BYDAY is a weekly weekday set", () => {
  it("imports the same compound, horizon, and preserved semantics as the WEEKLY rule", () => {
    for (const interval of ["", ";INTERVAL=1"]) {
      const daily = exact("20260914T180000", `FREQ=DAILY${interval};BYDAY=MO,WE;COUNT=6`);
      const weeklyRule = exact("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6");
      expect(daily.expression).toEqual(weeklyRule.expression);
      expect(daily.horizon).toEqual(weeklyRule.horizon);
      expect(daily.lifecycle).toEqual(weeklyRule.lifecycle);
      expect(daily.lossReport).toEqual(weeklyRule.lossReport);
      expect(daily.diagnostics[0]!.message).toMatch(/DAILY;INTERVAL=1 with BYDAY as the exactly equivalent weekly weekday-set/);
    }
  });

  it("maps DAILY;BYDAY=<DTSTART's weekday> to the plain weekly repeat", () => {
    expect(exact("20260915T180000", "FREQ=DAILY;BYDAY=TU").expression).toEqual({ kind: "compound", expressions: [clock(18), weekly(1)] });
  });

  it("resolves to exactly the dates of the equivalent WEEKLY rule", () => {
    const series = (rrule: string) => {
      const imported = exact("20260914T180000", rrule);
      const result = resolveSeries({ expression: imported.expression, lifecycle: imported.lifecycle, ...(imported.horizon ? { horizon: imported.horizon } : {}), window: { start: "2026-09-01", end: "2027-12-31" } });
      if (!result.ok) throw new Error("expected series");
      return result.value.occurrences.map((occurrence) => occurrence.date);
    };
    expect(series("FREQ=DAILY;BYDAY=MO,WE,FR;COUNT=20")).toEqual(series("FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=20"));
  });

  it("fails closed on DAILY BYDAY with INTERVAL>1 and on ordinals", () => {
    expectUnsupported("20260914T180000", "FREQ=DAILY;INTERVAL=2;BYDAY=MO,WE", /INTERVAL>1/);
    expectUnsupported("20260914T180000", "FREQ=DAILY;BYDAY=1MO", /bare weekdays only/);
  });
});

describe("RRULE import: WKST matrix", () => {
  const codes = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
  const shapes = ["FREQ=WEEKLY;BYDAY=MO,WE", "FREQ=WEEKLY;BYDAY=MO", "FREQ=MONTHLY;BYDAY=2TU", "FREQ=DAILY", "FREQ=YEARLY"] as const;

  it("accepts WKST=MO at every INTERVAL without changing the expression", () => {
    for (const shape of shapes) for (const interval of [1, 2, 3]) {
      const withWkst = exact("20260914T180000", `${shape};INTERVAL=${interval};WKST=MO`);
      expect(withWkst.expression).toEqual(exact("20260914T180000", `${shape};INTERVAL=${interval}`).expression);
    }
  });

  it("accepts any other WKST only at INTERVAL=1, where week start cannot change the occurrence set", () => {
    for (const code of codes.filter((item) => item !== "MO")) for (const shape of shapes) {
      expect(exact("20260914T180000", `${shape};INTERVAL=1;WKST=${code}`).expression).toEqual(exact("20260914T180000", `${shape};INTERVAL=1`).expression);
      expect(exact("20260914T180000", `${shape};WKST=${code}`).expression).toEqual(exact("20260914T180000", shape).expression);
      for (const interval of [2, 4]) expectUnsupported("20260914T180000", `${shape};INTERVAL=${interval};WKST=${code}`, /week-start dependent/);
    }
  });

  it("fails closed on a WKST value that is not a weekday code", () => {
    expectUnsupported("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;WKST=XX", /weekday code/);
  });

  it("still fails closed on parts outside the widened allow-list", () => {
    expectUnsupported("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;BYSETPOS=1", /outside Decan's exact subset: BYSETPOS/);
    expectUnsupported("20260914T180000", "FREQ=MONTHLY;BYMONTHDAY=15", /BYMONTHDAY/);
  });
});

describe("RRULE export: weekly weekday sets", () => {
  const lifecycle: IntentLifecycle = { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 9, day: 15 } };

  it("exports selections under repeat(week) as a canonical-order BYDAY set", () => {
    const expression: TemporalExpression = { kind: "compound", expressions: [clock(9), weekly(2), all("thursday"), all("tuesday")] as TemporalExpression[] };
    const result = exportRRule({ expression, lifecycle, horizon: { kind: "count", value: 8 } });
    expect(result).toMatchObject({ ok: true, value: { contentLines: ["DTSTART:20260915T090000", "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=8"], diagnostics: [{ code: "DECAN-ADAPTER-RRULE-EXACT-SUBSET", message: "Exported exact weekly weekday-set RRULE subset." }], lossReport: { fidelity: "exact", preserved: ["local clock point", "lifecycle origin", "weekly weekday-set selection", "explicit occurrence count (COUNT)"] } } });
  });

  it("fails closed exporting an ordinal selection under a weekly repeat", () => {
    const expression: TemporalExpression = { kind: "compound", expressions: [clock(9), weekly(1), { kind: "selection", filter: { kind: "weekday", value: "tuesday" }, selector: { kind: "ordinal", value: 2 } }] as TemporalExpression[] };
    const result = exportRRule({ expression, lifecycle });
    expect(result).toMatchObject({ ok: false, errors: [{ category: "capability", code: "DECAN-ADAPTER-RRULE-UNSUPPORTED", details: { lossReport: { fidelity: "unsupported" } } }] });
  });

  it("round-trips every new import shape through export and back to an identical expression", () => {
    expect(roundTrip("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6").contentLines).toEqual(["DTSTART:20260914T180000", "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE;COUNT=6"]);
    expect(roundTrip("20260915T180000", "FREQ=WEEKLY;BYDAY=TH").contentLines).toEqual(["DTSTART:20260915T180000", "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TH"]);
    roundTrip("20260914T180000", "FREQ=WEEKLY;BYDAY=SU,WE,MO");
    roundTrip("20260915T090000", "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;UNTIL=20261231", ["20260929T090000"]);
    roundTrip("20260914T180000", "FREQ=WEEKLY;INTERVAL=3;BYDAY=MO,TU,WE,TH,FR,SA,SU;WKST=MO");
    roundTrip("20260914T180000", "FREQ=WEEKLY;BYDAY=SA,SU;WKST=SU;COUNT=10");
    expect(roundTrip("20260914T180000", "FREQ=DAILY;BYDAY=MO,WE;COUNT=6").contentLines).toEqual(["DTSTART:20260914T180000", "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE;COUNT=6"]);
    roundTrip("20260915T180000", "FREQ=DAILY;BYDAY=TU");
  });
});

/**
 * Byte-identical guard. Every importRRule input that was exact at 90c3235 (1.0.0 + ./temporal) and
 * is exercised by the pre-existing suites, with sha256(JSON.stringify(output)) of its import and of
 * the export of that import, captured from a clean build of 90c3235. Key order counts.
 * Twelve monthly rules starting on day 31 were exact in 1.0.0 but wrong (Decan moved the
 * missing day to month end; RRULE skips the month). They now fail closed and are asserted separately.
 */
const BASELINE_1_0_0: ReadonlyArray<readonly [string, string, ReadonlyArray<string>, string, string]> = [
  ["20260831T090000", "FREQ=DAILY;INTERVAL=3", [], "bc6c1f815eed4720287df4976e22df54547a1748722556a2ba78072ac318a214", "54f20098389e21ef643e38e48bd73d382d3166557160d183d0fab89b75744ffa"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO", [], "680be4fa7f5219f301b89b622842209eae5e0ab839f392adb56039250cdc60cb", "8eab710acf228c0f2656de0bc67c8bdbf12cda97071a00ba418669a8ab8a2dc1"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1", [], "5fe0a1f59c348faa2fea697b6f532b8127a86c401a973587be142e1993e4e506", "dcf980b0c3a4117be89a4605f3aafd24c295ad98b7bb3528832b71c41b2a0fab"],
  ["20260901T090000", "FREQ=YEARLY;INTERVAL=1", [], "11b970c8827503296755516d84883cdbf447ced359b887505b1be316d2ae0926", "480f3ed15581b49a018e1417984d8e122c6a128aaddf05da1503aa2f83751c6a"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=1", [], "4ca5fb4ab398be01180539a5bfb5108f151dc68a04fb051dc4fa63627a4bbfd8", "cdaa2d854bac5d8f769f37bdc54117c2bf945bfeee5f82df633be12c3c21685a"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=2", [], "1d6bd7b452eab4124a6df7ced8e8194b90a107708aecd386336a17a2063f4487", "98e8c347e3311d494f253a529774d77ccdf843126a9b91380a90e7bb8207da48"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=3", [], "bc6c1f815eed4720287df4976e22df54547a1748722556a2ba78072ac318a214", "54f20098389e21ef643e38e48bd73d382d3166557160d183d0fab89b75744ffa"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=4", [], "9361226f9b08f893225e94329ea8a5893eac802e216764bfa64b505119257fef", "6f6848f26f7608d7b70f2d73a976fc7d29d2166ba3caad8003b073ad169ba768"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=5", [], "48c7d97ec672ff98fbc7f72cb1770216b80fa14ac4e194736b1737471fb3e28a", "8a8bf460a822a55404b3e100f41c6822797af0c2062ae92103386967f7773157"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=6", [], "9b39b175dbc635a2e36a7113a3e64016f343bbc4ff75c5ba65bc583952854a61", "a2d4e2a2c8c4ebb10e0856a797f4044d7246e33f2c076f5ee0907169b2fc8e57"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=7", [], "16ba85317bd3d3941feaa93c52062a42022ee9e6d0f8f93745ebac7cd7594142", "499628da821be32103cb302b40abdc92564b9ed42beb2e87659ba2f4462b20bd"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=8", [], "18cf36366b850f7b1c74e51cbcb58a4d7edc8f9bea5da0ccd2eb35f3fa8137e8", "e59f2bfd7c3fbf0fd90a85c19a7c65f65da3a42d96360ccc96084fa0f0c7951e"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=9", [], "eac738e42e92a8ae929f1c82a1e182766414c3170a8e92c2e1ef6352d6d5ab8a", "21fb597dd6e1163864d3d61cf42221c6eb513c5f9525a952acc8bfaa300a237b"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=10", [], "65bcd8d5eb21be96b8db09c2aba8d9c0a9dabfc32e505c3028fbc4736840a74c", "e9aa9d0ddd908e31bc957afc2bb8dc8341f70763007fe328ac8edf891b79075a"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=11", [], "7fe926b62a05847b4bc84e7dbef18e9f298434daeda353f676a20775ff9f020a", "5cff899d1a22870e8f5a2a9c0615f073b0e8f101331282d4af35854fdbd23aaa"],
  ["20260831T090000", "FREQ=DAILY;INTERVAL=12", [], "6c21d4a983745318bafcf3b8f1bcc44460db6e547b0c008651bedf44a93abf92", "f1f9628928a3bbc0e1504828e6fc748cb381fe42d5421a1e967bdc7603c1aa82"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO", [], "a644e7d62aa7f541ff244e065eeaf1bbfb97c264b36af66170db3684ae86642a", "72e4303079c05374d3a1eded05cf9d07252d4adeee9370a663efe69a98062258"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO", [], "680be4fa7f5219f301b89b622842209eae5e0ab839f392adb56039250cdc60cb", "8eab710acf228c0f2656de0bc67c8bdbf12cda97071a00ba418669a8ab8a2dc1"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=3;BYDAY=MO", [], "57f7a148bc91ef525e426ddd7f6966d3a122cf76a5278c4d668af0c1d76eb819", "a63617f015863c3169e38f9f24a8d7538afc6978b654b83477e8c52fefe10759"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=4;BYDAY=MO", [], "b2ebf8264738ee007d11b0346055b026b328159c647825d10c26121a32493b30", "f0efe750ae6f0b91c94d718da9dd79af628282aedb84dc3510ea5c3b63fac338"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=5;BYDAY=MO", [], "b7d00efadd6e1f6a684722cf6b47bff63890cda86ff067efa7f3ff41e8ac728d", "5b1467e503a4f8d818f6211648b7b022631d701a71dac8da485f891f1b8a731e"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=6;BYDAY=MO", [], "f7473e37a7f4c419e256d5b68bb7db73ce1aea27f30dd18a78a8fbe1fd8a1814", "e978e43186d4f6a542aba9a23282ec272c2bd69e737cc10a743028b7b007a675"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=7;BYDAY=MO", [], "979d74076061c37a8f61c203b2a1590c958260cea40036f812de5d6e6aeee8c9", "dffc311321e6dda5d4b391468a21126450d00c75aa3a3dfe15b9f8b3c99c3ff1"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=8;BYDAY=MO", [], "f9d3d70ca20e24239d397c9d678f2fe0d201af57e5902f7bfebc1696e4723706", "f33df30879741b55b5d775accedf6af519aa5e36cc501bca9112137157b4a69c"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=9;BYDAY=MO", [], "370470392cdc38451ec43406bf0915ab3f2a0b4d983c534e6740b207a3df0af3", "d48dbf0cb76bfaa71f7fe865299a716794c70dfe57335459e43caa2ceac9eef2"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=10;BYDAY=MO", [], "72c06ea30c64de7324b23a8673111bc9df807b527b1e8bb0b75d048260456c92", "115be9b591e1883bb3c3ab7ec3508543295a553e577bf95fa6b279cb04b5f09a"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=11;BYDAY=MO", [], "b1c99a8f8794f97a33b1fd1c8427dfac8b0a6aa07df1e9ac533c1d20ce516557", "603ffbb0afa2cbfbde2b3d5ec9e80a83c7689237325f6b0526fee164bf1362c5"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=12;BYDAY=MO", [], "47005ef533180372d106b475e9d557b9d8fc18bdb9cd4a8aff12c2236ded584e", "91b37b676e560935461f38d894cff2c2f769b89a83f41d0e026bc9452f690f58"],
  ["20260831T090000", "FREQ=MONTHLY;INTERVAL=12", [], "9910ff517f9be4d6b07bfabd86eacf90da8cac9ceac3a0de1019bd873c6ddbeb", "17b671dea3a3872c76759c2f391127055aa9afd11241d3988594aebecd00924a"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=1", [], "7ff0c7d5d27957c8093fa05b544a0e793406215ce62ff2797da51377c98bcaff", "75524d5ea187af09b2035032ee2f3b1e9d8deaeea47787020da3d23d106161e3"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=2", [], "dd79cbd37ce882abd3da06f0ea1372ede0b6088dc6cb16a3e5746a47066adbed", "513b3addaab505fd1d2e0ff1645104425320b9b20aa22e5c5740bb5b23fa9607"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=3", [], "5788d87db496b89652557412c6a965d3c325b85793de87f0fb182f1cf5585a4c", "68933eb0c33d807db8695541726b9f58e5ec3e7a0d6fa482845025e3058bd786"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=4", [], "91348fa940337b8f0097f8e6859322e6e45311fe06c1ccc23a8b022020d112e8", "6785e6d5f372eab2c6e0d2cbc996633e574d081b9b9b8acf95a9f3874c167dd7"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=5", [], "2f7023ccebac9701d9d4d5c46c141459bd4b1d7eda14790b9835ac1805dba606", "a3b8ecc7d40d91105cfffe6682dd98631bd5ab8ded0649f92007754fa0078644"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=6", [], "5fa468b706bd45a7c0c86c29fbe56379cabd00c7d68a2184f1663c1f4b139d2d", "e7e01861f9b39de5c9da3514f5e602981778b22430de11e3c9a1dd5376fc8d5a"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=7", [], "7463507267bfa10ba3dbede820087134c113d0b25dc719b36da48cef435b9536", "4b30080f457b90afd4bd31819afdbede3336eda741b8769b90dd39a7cd71fc0b"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=8", [], "9846f630f58b3a849e38e2bd28e11a51962c103e2dd20752518220d92ff802ac", "1d68d8040b3f3137f83c1083167d6d3587ea9ee8db97ea0d9d75419728dd67c6"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=9", [], "a81399476a0ab26935a566382a53f7dcd13be70800d12a0abbf614ecc0e07414", "d3f58e45ac35d18e6327c1704c0ec5cd91f35127d2ad0cbf2af09d3be467f6b7"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=10", [], "0ea3f50dbeced60060add2ff7ddef3e009d5d497753a88bb47ab50fb911c38ad", "60ec65b4d309e135c7ad53571636cd60e2eee29ada8d2ad87a4b3673b39a9f2c"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=11", [], "967d34752f81a4479000899445927404b89b086f4b2891996320c439a149506c", "82b9abfb284bc28c3adf2c541623a293b44aba63fef5c62fbbe4a960b411826c"],
  ["20260831T090000", "FREQ=YEARLY;INTERVAL=12", [], "ed89136ed9efedd85dc940991269a085dbe977d55362220cfd573a8a4e54b340", "c527da016ee0816691280b89f134f9540a061eedc29f8d66f96e67097ced7624"],
  ["20260901T083000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3TU", [], "9d9aa1bb5a9cbcd13548e3b965b4f03f5bb4441722120b888beb4659fd82b7f6", "521f880b53174526b7cd8f39f63874a9a4d4d908b484fbc7a6f5fb23e94ae5a7"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1FR", [], "8ababdc5c20668ca43bf9827fd9638e64bd0d93de737739c000231bd5f08f421", "9bde9d6109cad715d6754420a215977ac22c6439ffbad4b3b6dc876ef35c84e9"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=WE", [], "b1d4340145dff7f408af6e36b84af9d8bbf03883794c7998f5113ab78bf82f1f", "e9e8fb2d49ed62c98a01c317bc2fc7ebf2e082454d248394b77a62715c322c5e"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=TU,TH", [], "5ffae899091eead4ffbf76cc454fcab8f636611c3def747cc559fb22bf3a43fa", "31fea8fae8b2097850f8331d6f01ff51d96b2d85e3e5bcdba5bf11ea08efc17d"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=2;BYDAY=+1MO", [], "bcd0bf8c38ed2c090c19fc7fa58f151627a7b559e47b57855d5c34a0e89ccde9", "a882c99c3c126033181fd7de5960591276ef1aae0f1e898f871f2ec16bc92e19"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+1MO", [], "aa5d74a7c01c02d1d4ca6ae7895ebe2b56d218d43c0967abfd8bf732d67b1ad0", "1f17423dec2a55e1b223e5cbd4bf0513ee2713a22d6a7e829cf912701efeec8b"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+1TU", [], "cf4572d1f675e3c714ac3982f96821a3cda1be56a2ebe9a861b5ba6fa5d15d83", "5fc8d7414324b9d9530a1b515ce05c16a7cd95ec8b75d641660b3b9912dc01db"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+1WE", [], "704ddb10be2033f269f4c3c14eedb14acf7c021c98ca61a0ce1a380ddb52bdca", "292fcb44d3d0c7d69d8e01dbd9543e0bd03566a077da717eef996a636ccb61d2"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+1TH", [], "d9a776a722d0da57d4852741307c9a6c3cefe4ae395af68b335dea39ef911d4e", "c8ae6838499059f7b731d05f873710b66a243825af8f51ca5d5ecd75cb175547"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+1FR", [], "9989b8de25735f3d00e241b8e5f61b7ebd73e2e6a4345e22d2a1375eddc631b4", "e94278cd809d98246e0bb10215af46cd654dafa86e33d50d7c8b3f60e2ced828"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+1SA", [], "1d0e5619e4cb247793c3c1ea067ee1606048611d09873798aace833909ee8213", "ebbe9927895d94b5974edb007495f09e1595492b19998a4d8d7fd68a2f08481e"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+1SU", [], "37df00ded677c601530982f1409e8adb0f4d136a95371828ea06d544e2a3fac6", "5e5568b7236578ad440f3c52ce75328ae0f7b3b1259205dc9a6b8838a5ea50a7"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+2MO", [], "36cd4aa9cc561afbfd38da7bcb555b3a599e1e3ee98e1ec4107e226f32028cdb", "8e46b7eadd71b2db27f15d452df3adc18d5d786a3edbd0dbe18526a477724319"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+2TU", [], "bd53c959f9d883777a44c714b070f946f4afdb7bf2ecb6ab27ca5d35d7d0e5f4", "96acc1858e8ce6998eb28491090b6300cab259b90aba9db590a8833f6dfde0f3"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+2WE", [], "64ee147792123a82d15f606bca9960a65f4988e6ace44678b8da440be44b7cd4", "4043ddc435b828a98f660a9b552c4b6d472d416d419bbb7896a2d2a39031bed0"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+2TH", [], "2c9e73fdf925b88a64f6a2cf7d61d47176895988b6415dd6c4052bd542bfbef6", "4bdafa127ad06bc066234ed5ebbd6ef1fc9bf59ba15a4e75276b03b5e206b5ab"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+2FR", [], "cf124d20e0810fe4622fff9fdc93ce59f0867a178ca016de9eb6bc97cc6a11b6", "be777a23439ce23ca7d06d9348966911cf21f31b805044733a8098912eb7e771"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+2SA", [], "f2e4ae6c07d59127c247ffc22d05658d3183cebbc4b4e881c776b3e271a10f64", "6159b3ea6afde7a13817c3e2fe5dafc28719a60cf80dd512449c2755d5e91c77"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+2SU", [], "f8bd4920bec06c5b35c2850ea78a1361edb86f4f5b193e7d7a0db8b098e71951", "a9851a93e21d11e76a059d207d03547effbcc2ce887778093399f7437d3a37c1"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3MO", [], "9c5defe000b18c509aa0c5a20e76066d1871c06c43cb80d17204952781f73c04", "5901f334b026db0d9c380423aa6fb2a1e08a669874b63108584bdf18a7748b52"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3TU", [], "501f08658706fb1d10fcd410c9904c291991ae9d790dea7e4d58c18139da3b90", "786679ac287eb35ec4345847ab1f0be25b6d75ca416fe1dd6deae91777c21ce2"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3WE", [], "29a28a24bcaebb9329a72abfc4902c31fe85a2ff112e85681320342e22d326ee", "76dd52538f9346e94aee96238d30e107fae61e6872cb7c64935ac4e7a749796c"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3TH", [], "c87a1931353e44f1e2a1771c77a0bec84a8e9ae3582f657a4e4aba0340cdebf8", "fe028f53c19f00a17ac1672647b22c3d581cbbf92933ad6fe2706d3375d8b807"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3FR", [], "0b286d84f43e2e1da1497a333efe8ddaa2065b4fca930d7f956453db4427491f", "b643f1e96e383ff00cd3f17e660f2b38d4d761e1eb0fc2577e4090f2a6ddc82b"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3SA", [], "9ff08563d796198097fe29c3fbdd1f5bf69469650f5f8d6a2d012ebc89c53914", "7b50f861da567d87be8390655638f0b6fab1204804ddb5f79d75a958199ad659"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3SU", [], "9c6f51b91d0f638bef6ae480c1ca9a1943dc43e823fbcdd38c46e73f00cbfc50", "f604d03d04f16e9df54e97ad8728f78120c61f417a0977a0de947eead0bab674"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+4MO", [], "28d6338edf3705fa53b855fb5790de7dbd9a42184006573b824864d54ee1f981", "a3b6464ea16f345f4223cbe31749e7dd14894bbfe323c34d9b088855e4ca9fdc"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+4TU", [], "b9690278365b838da3728df4173beb2354ea0ef02e85b029b9385409b081f5ac", "7089e7e62ebf29d37666fa50012eaf7bb48d630916c15ba9056be58d7dc1c064"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+4WE", [], "71752879550bba81eee996ec25d618986d0f9f8d5fe5196db0a7f9f08531681d", "29da447eb2b8f50fcdc39f4b0abefd7e27610ad3c9e4d523b6f46e894716f4a7"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+4TH", [], "6051f4e8ea7da4885079dc8a2d2c03e5047ee10880cfbb81bc72a6d4031c1bb7", "ecc4b57d1ada4d4bb841d4e9020b12ace25c24ea0ccb376e106d3099f1ee15ca"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+4FR", [], "eb368e4313daa0c829929ea7e6cf46be04012aea981dfe8f2ff95d39e15a3673", "91070477ba85b2db01c8ca0fba1e99f9859aa021a1129b7e3b14b146d2116e75"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+4SA", [], "269e8a77e8618e5d23db716894760d233e9f976d586fd016426ea4a4ea78007f", "10a1591ffd643712a964a255d52e3506294b13d7d7eb820647506e1ea8cd24c6"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+4SU", [], "627876c6848b5a71833a3f04b92a274b93e6d3608e85976b51bb48defdc21b1d", "0e3db0c92054734cb8e2442722564cfb09753dc61335003d240bca459f37ce7a"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+5MO", [], "9f13d91906a9df434b8dd51e4a0a7cde5c8d298ffae3a788e404ffd1038fc62f", "63cc23f793002c610538f8b002e2565c72ecd8b7da1703c3fe81acc9a0213eeb"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+5TU", [], "1cfe5f779f54db20999070c9e389f2d485867e3543b2fc3c172f176b2fa31d79", "56f566b3e78dc2872cc953f5a567763b1f4ba7e734037bd4953f55199d01380f"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+5WE", [], "4a7d8128defcdc7f7bcbde8e5ecf99eb256b8e5f9e76e84621d08244e7bb0e4c", "fb720bfdec48122faf95e7b61c0d877569cc93d34c4c74e1f73e68bc9aa389a9"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+5TH", [], "fe69bd11dab78e6cb06b6f1729ed2f25cf267d4e4b2dc42ab639458d90e859b6", "f857dc525052d2fb10a759179b66caee8ab72023dac3839faa10d9a16d5b0303"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+5FR", [], "f742c631079ca6abbf4c5b0d5d4f82d8506f20653ce826dbb0f253a05e07f220", "f222a4b3087ebaac25060027d9423f23ab48a08948509010cea3a2fb2afd659f"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+5SA", [], "b5c5cb902195b994cd810dd7d94a7cf4ca0471b3175a17a9d486bdebe23b8ae8", "cc547efb97b31f446c058fb300bacc1016105e0c49889fa113f2d1b87dd30ab4"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+5SU", [], "c53b20c946078696b848bab390768acbfe52491e540e33b713a8e18e7cf8daf1", "ddbbab339d42ac107eb1b76b0e7d9f3dbd45c409af751840c9654c421f3bbfae"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1MO", [], "085389bef4f18cbe400ede3f27407290652034cb0eb545c889094aee93c6c3ed", "d2d8d4c367189c84c097211ed63b0948e07f08bb22dce25c233308a54088075d"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1TU", [], "73c89b318e88ffd4cf57a774ce2f1429eed32a874eee063fdfc61d8869e4ffe2", "7ada3fe0d8e1aa852581ccda3e488b8389823d8ef92120138bdfb87e4d8bed4f"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1WE", [], "8fbb529324f10c384ae9642e7b4e266f00bf1efde4d0958fb5c4313208c81534", "2f5593fbde1ca2687e6274f66a7efea295e604a4461ed83cc6caf7ed9714e095"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1TH", [], "8e71835f7e9fc65c89d5144dd7a84918fe264dd01841f31346eb4479dc597f8c", "4b052a76e7ba8d87f9709d3236d44777a157449a34f6fb7a01d61f5356f29373"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1FR", [], "8ababdc5c20668ca43bf9827fd9638e64bd0d93de737739c000231bd5f08f421", "9bde9d6109cad715d6754420a215977ac22c6439ffbad4b3b6dc876ef35c84e9"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1SA", [], "a92544b7a3b192a798edcf125d8c5d113830e3105569e753a1635cd068391987", "121c0896db8101c7c645effc6b83d1b13bf794505e9b80c5c2966ee3e1c547e4"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=-1SU", [], "ee820eeec7fb4a0550d1f7dc6ec230428f4dbb616e07538d43c036d4de49ac41", "5888f83ce0d70687dae2359afed8ea0e01fdfcdbe92af470ffee47fb5b984f7b"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;COUNT=10", [], "bc317b7d828d4a0c28fc4798d1cd8ac952e47c74378750351e0f08f488a69c76", "c066777b6433fbd65d722dff2f1d4224021fb75843cb4df66f9a0b9c776fdf7e"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;UNTIL=20271231", [], "b221a163de1004a254ed036b61c413f5e10d3c8788b50192fb10910bdba9e1f5", "9fefd0c4d6066d720cc9cd210c61c4ad176be5b4d3f05c9fd2e40e3a75e276c3"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO", ["20260907T090000"], "969b460734a09624400cb8079d0b084496cf4c7f517ceab28efb905bbc7db4d3", "5f379e27178f522d9d5dc911d89fd4d0d9dbc9ca2cd32057605f4fe492e38f0e"],
  ["20260901T090000", "FREQ=MONTHLY;INTERVAL=1;BYDAY=+3TU;COUNT=6", ["20261020T090000", "20270119T090000"], "d4e4f78cb3cb4fe928cf7b9a5f042347b67e4a231151db872161fca3e60f0fba", "ded320b514f25d1a4a328d488914b02364ad144476f239cf52e2d8a98faa27eb"],
  ["20260831T090000", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO", [], "a644e7d62aa7f541ff244e065eeaf1bbfb97c264b36af66170db3684ae86642a", "72e4303079c05374d3a1eded05cf9d07252d4adeee9370a663efe69a98062258"],
  ["20260908T180000", "FREQ=MONTHLY;BYDAY=2TU;COUNT=4", [], "0555e7668d44186dca1e07041f12e2b2752bb8b3750790746c530a1cd59b9bd3", "078e71bd9497075b9b50bde1de5d51d3d9711ee60e0838a778318c612666ecc1"],
  ["20260915T180000", "FREQ=WEEKLY;COUNT=5", ["20260922T180000"], "c868b1fdcee7646f2d0ff8840f22e56b4c5726dff0f20b1c05975cc4fa820215", "1d8dbba367899e5ac8de0c481b43c52a1ecffe350d2d99c3e50a846cdcb6f3b8"],
  ["20260915T180000", "FREQ=WEEKLY;UNTIL=20261231", [], "19d41e976f279dc713727ead93dde4ea7b13c0816c02dbb502932b746e0b2100", "c64f8bc8b6828534eb5d3b0080278756505a52de4b0f11ac95978d1c76424bd5"],
  ["20260915T180000", "FREQ=WEEKLY;BYDAY=TU", [], "04f11902d0c5eedd4bc28390b66990ee57afbac53ab17a4c76596475903ca633", "fe6b5e59c532bb1de07a79434188292f921c2e71cfdb65ea0e6d1740289de540"]
];

describe("byte-identical guard: pre-1.1.0 exact inputs", () => {
  const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

  it("covers exactly 97 pre-1.1.0 inputs; the 12 day-31 monthly rules are asserted below", () => expect(BASELINE_1_0_0).toHaveLength(97));

  it("now fails closed on the 12 pre-1.1.0 monthly rules whose DTSTART day is missing in some months", () => {
    const changed = [...Array.from({ length: 11 }, (_, index) => ["20260831T090000", `FREQ=MONTHLY;INTERVAL=${index + 1}`] as const), ["20260131T070809", "FREQ=MONTHLY;INTERVAL=1;UNTIL=20261231T235959Z"] as const];
    for (const [dtstart, rrule] of changed) expect(importRRule({ dtstart, rrule })).toMatchObject({ ok: false, errors: [{ category: "capability", code: "DECAN-ADAPTER-RRULE-UNSUPPORTED", details: { lossReport: { fidelity: "unsupported" } } }] });
  });

  it(`keeps all ${BASELINE_1_0_0.length} import and export outputs byte-identical to 90c3235`, () => {
    const drift = BASELINE_1_0_0.flatMap(([dtstart, rrule, exdates, importHash, exportHash]) => {
      const imported = importRRule({ dtstart, rrule, ...(exdates.length > 0 ? { exdates } : {}) });
      if (!imported.ok) return [`${rrule}: no longer exact`];
      const exported = exportRRule({ expression: imported.value.expression, lifecycle: imported.value.lifecycle, ...(imported.value.horizon ? { horizon: imported.value.horizon } : {}) });
      return [
        ...(hash(imported) === importHash ? [] : [`${dtstart} ${rrule}: import drifted`]),
        ...(hash(exported) === exportHash ? [] : [`${dtstart} ${rrule}: export drifted`])
      ];
    });
    expect(drift).toEqual([]);
  });
});

describe("day-skipping monthly and yearly rules fail closed", () => {
  const unsupportedImport = (dtstart: string, rrule: string) => expect(importRRule({ dtstart, rrule })).toMatchObject({ ok: false, errors: [{ category: "capability", message: expect.stringMatching(/skips periods that have no day/) }] });

  it("rejects MONTHLY from day 29, 30, or 31 when some stride month lacks that day", () => {
    unsupportedImport("20260131T090000", "FREQ=MONTHLY");
    unsupportedImport("20260130T090000", "FREQ=MONTHLY;COUNT=3");
    unsupportedImport("20260129T090000", "FREQ=MONTHLY;INTERVAL=1");
    unsupportedImport("20260831T090000", "FREQ=MONTHLY;INTERVAL=6");
  });

  it("keeps MONTHLY exact when the day exists in every stride month", () => {
    exact("20260831T090000", "FREQ=MONTHLY;INTERVAL=12");
    exact("20260128T090000", "FREQ=MONTHLY");
    exact("20260131T090000", "FREQ=MONTHLY;INTERVAL=2;BYDAY=-1FR"); // weekday selections never move a day
  });

  it("rejects YEARLY from Feb 29 and keeps other yearly days exact", () => {
    unsupportedImport("20280229T090000", "FREQ=YEARLY");
    exact("20280228T090000", "FREQ=YEARLY");
    exact("20261231T090000", "FREQ=YEARLY");
  });

  it("rejects the same shapes from cron and on RRULE export", () => {
    const effectiveFrom = { kind: "date" as const, calendar: "iso8601" as const, year: 2026, month: 8, day: 27 };
    expect(importCronExpression({ cron: "0 9 31 * *", effectiveFrom })).toMatchObject({ ok: false, errors: [{ message: expect.stringMatching(/skips periods/) }] });
    expect(importCronExpression({ cron: "0 9 29 2 *", effectiveFrom })).toMatchObject({ ok: false, errors: [{ message: expect.stringMatching(/skips periods/) }] });
    expect(importCronExpression({ cron: "0 9 28 * *", effectiveFrom })).toMatchObject({ ok: true });
    const lifecycle: IntentLifecycle = { status: "active", version: 1, effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 1, day: 31 } };
    const repeat = (unit: "month" | "quarter" | "year", every: number): TemporalExpression => ({ kind: "compound", expressions: [clock(9), { kind: "repeat", every, unit, mode: "civil" }] as TemporalExpression[] });
    expect(exportRRule({ expression: repeat("month", 1), lifecycle })).toMatchObject({ ok: false, errors: [{ category: "capability" }] });
    expect(exportRRule({ expression: repeat("quarter", 1), lifecycle })).toMatchObject({ ok: false, errors: [{ category: "capability" }] });
    expect(exportRRule({ expression: repeat("year", 1), lifecycle })).toMatchObject({ ok: true });
  });
});
