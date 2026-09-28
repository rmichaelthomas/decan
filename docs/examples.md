# Decan Examples

These examples show the public shape of Decan as a temporal-intent reference implementation.

## Canonicalize readable source

```ts
import { canonicalizeText } from "decan";

const result = canonicalizeText({
  surface: "authoring",
  text: [
    "time",
    "  point 9am",
    "  repeat every 1 week",
    ""
  ].join("\n")
});
```

The canonical form preserves semantic structure:

```decan
time
  point 09:00
  repeat every week
```

## Resolve with pinned timezone evidence

```ts
import { resolveExpression, timezoneSnapshot } from "decan";

const zone = timezoneSnapshot({
  id: "America/New_York",
  version: "tzdb-2026a",
  initialOffsetMinutes: -240,
  transitions: []
});

const resolution = resolveExpression({
  referenceTime: "2026-08-27T12:00:00Z",
  horizon: { kind: "count", value: 1 },
  lifecycle: {
    status: "active",
    version: 1,
    effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 31 }
  },
  context: [zone],
  expression: {
    kind: "compound",
    expressions: [
      { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } },
      { kind: "repeat", every: 1, unit: "week", mode: "civil" }
    ]
  }
});
```

This produces a finite candidate from explicit inputs. Decan does not read the host timezone.

## Inspect resolver support

```ts
import { classifyResolveSupport } from "decan";

const support = classifyResolveSupport({
  kind: "boundary",
  operator: "by",
  value: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 }
});
```

Boundary expressions are meaningful, but not standalone occurrence candidates. The support matrix says that explicitly instead of leaving `resolve` vague.

## Import exact cron

```ts
import { importCronExpression } from "decan";

const imported = importCronExpression({
  cron: "0 9 * * 1",
  effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 27 }
});
```

The exact subset imports as weekly civil recurrence plus one local clock point. Cron ranges, steps, macros, and multi-time expressions fail closed.

## Import and export exact RRULE

```ts
import { exportRRule, importRRule } from "decan";

const imported = importRRule({
  dtstart: "20260831T090000",
  rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO"
});

const exported = exportRRule({
  expression: {
    kind: "compound",
    expressions: [
      { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } },
      { kind: "repeat", every: 1, unit: "week", mode: "civil" }
    ]
  },
  lifecycle: {
    status: "active",
    version: 1,
    effectiveFrom: { kind: "date", calendar: "iso8601", year: 2026, month: 8, day: 31 }
  }
});
```

Decan does not claim full iCalendar support. RRULE interop is exact only where fidelity is proven.

## Expand a recurring series

```ts
import { importRRule, resolveSeries, timezoneSnapshot } from "@rmichaelthomas/decan/temporal";

const zone = timezoneSnapshot({
  id: "America/Los_Angeles",
  version: "tzdb-2026a",
  initialOffsetMinutes: -420,
  transitions: [{ at: "2026-11-01T09:00:00Z", offsetMinutes: -480 }]
});

const imported = importRRule({
  dtstart: "20260914T180000",
  rrule: "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6",
  exdates: ["20260921T180000"]
});
if (!imported.ok) throw new Error("unsupported RRULE");

const series = resolveSeries({
  expression: imported.value.expression,
  lifecycle: imported.value.lifecycle,
  horizon: imported.value.horizon,
  window: { start: "2026-09-01", end: "2026-09-30" },
  context: [zone]
});
```

`series.value.occurrences` holds five dates: 2026-09-14, 09-16, 09-23, 09-28, and 09-30. Each is 18:00 local, for example `2026-09-15T01:00:00Z[America/Los_Angeles]`. `series.value.excluded` is `["2026-09-21"]`. The excluded Monday still counts toward `COUNT=6`, as in RFC 5545. If the window covered a daylight-saving change, a missing or repeated local time would appear as `civil: "gap"` or `civil: "fold"`, and Decan would not pick an instant for you.

## Materialize an occurrence

```ts
import { MemoryOccurrenceStore, materialize } from "decan";

const store = new MemoryOccurrenceStore();

const created = materialize({
  intentId: "fivexfive.banneker1.automation.weekly-digest",
  intentVersion: 1,
  resolution: resolution.value,
  candidateId: resolution.value.candidates[0].id,
  recordedAt: "2026-08-27T12:00:01Z"
}, store);
```

Materialization records one temporal occurrence. It does not execute the action associated with that occurrence.
