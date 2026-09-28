# Series resolution — pre-build benchmarks

Run against **unmodified `main` at `90c3235`** (`npm run build`, then the script below against `dist/index.js`), 2026-09-28, Node v22.23.1.
Timezone snapshot: hand-built `America/Los_Angeles` (initial −480; transitions 2026-03-08T10:00Z → −420, 2026-11-01T09:00Z → −480, 2027-03-14T10:00Z → −420, 2027-11-07T09:00Z → −480). No host timezone data.

All five facts the build prompt's scope rests on reproduced as recorded. No stop condition fired.

| # | Case | Expected (prompt §3) | Actual | Match |
|---|---|---|---|---|
| 1 | `FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6` from `20260914T180000` | unsupported | `ok: false`, `DECAN-ADAPTER-RRULE-UNSUPPORTED` | ✅ |
| 2 | `FREQ=WEEKLY;BYDAY=TH` from `20260915T180000` (a Tuesday) | unsupported | `ok: false`, `DECAN-ADAPTER-RRULE-UNSUPPORTED` | ✅ |
| 3 | `FREQ=MONTHLY;BYDAY=2TU;COUNT=4` → `resolveExpression` count 4 | concatenated, non-series output | `[{instants:[2026-09-09T01:00:00Z]}, {date:2026-09-08}, {date:2026-10-08}, {date:2026-11-08}]` — clock-at-reference, then raw month strides (the 8th, not 2nd Tuesdays); the selection result was cut by the count slice | ✅ |
| 4 | `FREQ=WEEKLY;COUNT=5` + EXDATE `20260922T180000` → `resolveExpression` | `unresolved`, then empty | without reference: `unresolved`, need `reference` / `expression.exception.predicate`; with `true` reference: `resolved`, `candidates: []` (whole series suppressed) | ✅ |
| 5 | `FREQ=WEEKLY;UNTIL=20261231` → `resolveExpression` count 1 | UNTIL alone does not drive generation | one candidate, `2026-09-15` — UNTIL only filters; the count decides how many are generated | ✅ |

## Case 1 — import

Message: `Weekly BYDAY is exact only for a single weekday matching DTSTART; weekday sets and positional weekdays at weekly frequency have no resolver representation.`

## Case 2 — import

Message: `Weekly BYDAY is exact only for a single weekday matching DTSTART; weekday sets and positional weekdays at weekly frequency have no resolver representation.`

## Case 3 — `resolveExpression` output

```json
{
  "ok": true,
  "status": "resolved",
  "candidates": [
    {
      "instants": [
        "2026-09-09T01:00:00Z[America/Los_Angeles]"
      ]
    },
    {
      "date": "2026-09-08"
    },
    {
      "date": "2026-10-08"
    },
    {
      "date": "2026-11-08"
    }
  ],
  "needs": []
}
```

## Case 4 — `resolveExpression` output

Without a reference for `@exdate:20260922T180000`:

```json
{
  "ok": true,
  "status": "unresolved",
  "candidates": [],
  "needs": [
    {
      "kind": "reference",
      "requiredBy": "expression.exception.predicate",
      "reason": "Missing reference snapshot"
    }
  ]
}
```

With `{ id: "@exdate:20260922T180000", value: true }`:

```json
{
  "ok": true,
  "status": "resolved",
  "candidates": [],
  "needs": []
}
```

## Case 5 — `resolveExpression` output (count 1)

```json
{
  "ok": true,
  "status": "resolved",
  "candidates": [
    {
      "date": "2026-09-15",
      "instants": [
        "2026-09-16T01:00:00Z[America/Los_Angeles]"
      ]
    }
  ],
  "needs": []
}
```

## Script

```js
// Pre-build benchmark: runs against the built dist/ of the checkout given in argv[2].
const root = process.argv[2];
const { importRRule, resolveExpression, timezoneSnapshot } = await import(`${root}/dist/index.js`);
const zone = timezoneSnapshot({ id: "America/Los_Angeles", version: "bench-2026", initialOffsetMinutes: -480, transitions: [
  { at: "2026-03-08T10:00:00Z", offsetMinutes: -420 }, { at: "2026-11-01T09:00:00Z", offsetMinutes: -480 },
  { at: "2027-03-14T10:00:00Z", offsetMinutes: -420 }, { at: "2027-11-07T09:00:00Z", offsetMinutes: -480 }] });
const brief = (r) => r.ok ? { ok: true, status: r.value.status, candidates: r.value.candidates.map((c) => c.value.value), needs: r.value.needs } : { ok: false, code: r.errors[0].code, message: r.errors[0].message };
const out = {};
out.case1 = importRRule({ dtstart: "20260914T180000", rrule: "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6" });
out.case2 = importRRule({ dtstart: "20260915T180000", rrule: "FREQ=WEEKLY;BYDAY=TH" });
const c3 = importRRule({ dtstart: "20260908T180000", rrule: "FREQ=MONTHLY;BYDAY=2TU;COUNT=4" });
out.case3 = { import: c3, resolveExpression: brief(resolveExpression({ expression: c3.value.expression, lifecycle: c3.value.lifecycle, referenceTime: "2026-09-08T00:00:00Z", horizon: { kind: "count", value: 4 }, context: [zone] })) };
const c4 = importRRule({ dtstart: "20260915T180000", rrule: "FREQ=WEEKLY;COUNT=5", exdates: ["20260922T180000"] });
const r4 = (references) => brief(resolveExpression({ expression: c4.value.expression, lifecycle: c4.value.lifecycle, referenceTime: "2026-09-15T00:00:00Z", horizon: { kind: "count", value: 5 }, context: [zone], ...(references ? { references } : {}) }));
out.case4 = { import: c4, withoutReference: r4(), withTrueReference: r4([{ id: "@exdate:20260922T180000", version: "1", value: true }]) };
const c5 = importRRule({ dtstart: "20260915T180000", rrule: "FREQ=WEEKLY;UNTIL=20261231" });
out.case5 = { import: c5, resolveExpressionCount1: brief(resolveExpression({ expression: c5.value.expression, lifecycle: c5.value.lifecycle, referenceTime: "2026-09-15T00:00:00Z", horizon: { kind: "count", value: 1 }, context: [zone] })) };
console.log(JSON.stringify(out, null, 2));
```

Full JSON output (including import results) was captured alongside and is reproduced in the post-build file for the `resolveExpression` equality check.
