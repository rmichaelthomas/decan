# Series resolution — post-build benchmarks

Run on branch `feat/series-resolution-and-weekday-sets` (version 1.1.0) after `npm run build`, 2026-09-28, Node v22.23.1. Same hand-built `America/Los_Angeles` snapshot as the pre-build file. Series window for `resolveSeries`: `2026-01-01`..`2027-12-31`, default `maxOccurrences` (1000).

## Summary

| # | Case | Expected (prompt §10.2) | Actual | Result |
|---|---|---|---|---|
| 1 | `FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6` | exact import, correct expansion | import: `Imported exact weekly weekday-set RRULE subset.`; 6 dates 2026-09-14, 2026-09-16, 2026-09-21, 2026-09-23, 2026-09-28, 2026-09-30 | ✅ |
| 2 | `FREQ=WEEKLY;BYDAY=TH` from a Tuesday | exact import, correct expansion | import: `Imported exact weekly weekday-set RRULE subset.`; Thursdays from 2026-09-17 (origin Tuesday 2026-09-15 not included) to 2027-12-30, 68 dates, no horizon so bounded by the window end | ✅ |
| 3 | `FREQ=MONTHLY;BYDAY=2TU;COUNT=4` | the four 2nd Tuesdays | 2026-09-08, 2026-10-13, 2026-11-10, 2026-12-08 | ✅ |
| 4 | `FREQ=WEEKLY;COUNT=5` + EXDATE `20260922T180000` | 4 occurrences + 1 excluded | occurrences 2026-09-15, 2026-09-29, 2026-10-06, 2026-10-13; excluded ['2026-09-22'] | ✅ |
| 5 | `FREQ=WEEKLY;UNTIL=20261231` | weekly through 2026-12-29 | 16 dates, 2026-09-15 .. 2026-12-29 | ✅ |

## `resolveExpression` is unchanged (asserted)

The pre-build script (`series-resolution-benchmarks-pre.md`) was re-run unmodified against this branch's `dist/`, and each output was compared as parsed JSON to the output captured on `main` at `90c3235`:

| Output | Pre vs post |
|---|---|
| case 3 `resolveExpression` (count 4) | ✅ unchanged |
| case 4 `resolveExpression`, no reference | ✅ unchanged |
| case 4 `resolveExpression`, `true` reference | ✅ unchanged |
| case 5 `resolveExpression` (count 1) | ✅ unchanged |
| case 3 / 4 / 5 `importRRule` output | ✅ unchanged / ✅ unchanged / ✅ unchanged |

Cases 1 and 2, unsupported on `main`, now import exactly (`ok: True`, `ok: True`).

In addition, the byte-identical guard in `tests/post_c6/rrule-weekly-sets.test.ts` hashes `JSON.stringify` of the import **and** export output for 109 pre-existing exact inputs. Those are every input exercised by `rrule-adapter-full-surface.test.ts`, including both enumerated property domains, plus the exact inputs in `cron-rrule-adapters.test.ts`, `temporal-loss-report.test.ts`, and the pre-build cases. The hashes were captured from a clean build of `90c3235` in a scratch worktree. The guard was captured over 109 inputs. After the day-skipping fix, 97 import and 97 export hashes still match exactly. The other 12 are monthly rules starting on day 31. They were exact in 1.0.0 but produced wrong dates, and they now fail closed; a separate test asserts that.

## Case detail — instants

Case 1 (`MO,WE`, 18:00 local, PDT):

| date | instants | civil |
|---|---|---|
| 2026-09-14 | `2026-09-15T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-09-16 | `2026-09-17T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-09-21 | `2026-09-22T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-09-23 | `2026-09-24T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-09-28 | `2026-09-29T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-09-30 | `2026-10-01T01:00:00Z[America/Los_Angeles]` | exact |

Case 3 (2nd Tuesdays; the offset shifts from −420 to −480 after 2026-11-01, and 18:00 local stays 18:00):

| date | instants | civil |
|---|---|---|
| 2026-09-08 | `2026-09-09T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-10-13 | `2026-10-14T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-11-10 | `2026-11-11T02:00:00Z[America/Los_Angeles]` | exact |
| 2026-12-08 | `2026-12-09T02:00:00Z[America/Los_Angeles]` | exact |

Case 4 (EXDATE consumes the count):

| date | instants | civil |
|---|---|---|
| 2026-09-15 | `2026-09-16T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-09-29 | `2026-09-30T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-10-06 | `2026-10-07T01:00:00Z[America/Los_Angeles]` | exact |
| 2026-10-13 | `2026-10-14T01:00:00Z[America/Los_Angeles]` | exact |

## Imported expressions (new shapes)

Case 1:

```json
{
  "kind": "compound",
  "expressions": [
    {
      "kind": "point",
      "value": {
        "kind": "clock",
        "hour": 18,
        "minute": 0
      }
    },
    {
      "kind": "repeat",
      "every": 1,
      "unit": "week",
      "mode": "civil"
    },
    {
      "kind": "selection",
      "filter": {
        "kind": "weekday",
        "value": "monday"
      },
      "selector": {
        "kind": "all"
      }
    },
    {
      "kind": "selection",
      "filter": {
        "kind": "weekday",
        "value": "wednesday"
      },
      "selector": {
        "kind": "all"
      }
    }
  ]
}
```

Case 2:

```json
{
  "kind": "compound",
  "expressions": [
    {
      "kind": "point",
      "value": {
        "kind": "clock",
        "hour": 18,
        "minute": 0
      }
    },
    {
      "kind": "repeat",
      "every": 1,
      "unit": "week",
      "mode": "civil"
    },
    {
      "kind": "selection",
      "filter": {
        "kind": "weekday",
        "value": "thursday"
      },
      "selector": {
        "kind": "all"
      }
    }
  ]
}
```

## Script

```js
// Post-build benchmark: the pre script's cases on this checkout, then the same inputs through resolveSeries.
const root = process.argv[2];
const { importRRule, resolveSeries, timezoneSnapshot } = await import(`${root}/dist/index.js`);
const zone = timezoneSnapshot({ id: "America/Los_Angeles", version: "bench-2026", initialOffsetMinutes: -480, transitions: [
  { at: "2026-03-08T10:00:00Z", offsetMinutes: -420 }, { at: "2026-11-01T09:00:00Z", offsetMinutes: -480 },
  { at: "2027-03-14T10:00:00Z", offsetMinutes: -420 }, { at: "2027-11-07T09:00:00Z", offsetMinutes: -480 }] });
const window = { start: "2026-01-01", end: "2027-12-31" };
const run = (dtstart, rrule, exdates) => {
  const imported = importRRule({ dtstart, rrule, ...(exdates ? { exdates } : {}) });
  if (!imported.ok) return { import: "unsupported", message: imported.errors[0].message };
  const s = resolveSeries({ expression: imported.value.expression, lifecycle: imported.value.lifecycle, ...(imported.value.horizon ? { horizon: imported.value.horizon } : {}), window, context: [zone] });
  return { import: imported.value.diagnostics[0].message, expression: imported.value.expression, series: s.ok ? { occurrences: s.value.occurrences, excluded: s.value.excluded, needs: s.value.needs, truncated: s.value.truncated } : s.errors };
};
console.log(JSON.stringify({
  case1: run("20260914T180000", "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6"),
  case2: run("20260915T180000", "FREQ=WEEKLY;BYDAY=TH"),
  case3: run("20260908T180000", "FREQ=MONTHLY;BYDAY=2TU;COUNT=4"),
  case4: run("20260915T180000", "FREQ=WEEKLY;COUNT=5", ["20260922T180000"]),
  case5: run("20260915T180000", "FREQ=WEEKLY;UNTIL=20261231")
}, null, 2));
```
