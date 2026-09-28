# Decan Conformance

This document states what the current Decan reference implementation claims and what it deliberately does not claim.

## Profiles

| Profile | Status | Scope |
|---|---:|---|
| `syntax-interchange` | exact | parse, canonicalize, print, JSON interchange, stable identities |
| `temporal-core` | exact | semantic validation, resolver support classification, snapshot-only resolution |
| `durable-occurrences` | exact | materialize resolved candidates into append-only Occurrence storage |

`durable-occurrences` is available only with an Occurrence store. The SQLite adapter is the durable conformance target.

## Resolver support

`temporal-core.resolve` is exact over Decan's declared support matrix. This means every expression family is handled deterministically as one of:

- candidate-producing;
- typed dependency need;
- explicit conflict;
- unsupported feature need.

It does not mean every temporal idea produces a timestamp.

Use `classifyResolveSupport(expression)` to inspect support before resolution.

## Exact implemented seams

- readable/canonical source normalization;
- JSON interchange round-tripping;
- semantic validation;
- explicit point and window handling;
- civil recurrence with lifecycle origin;
- series resolution (`resolveSeries`): repeat stride composed with week- or month-scoped weekday selections, per-date `EXDATE` suppression, and `COUNT`/`UNTIL` horizons over a caller-supplied window;
- elapsed sub-day recurrence from explicit instant origin;
- relation offsets from date or instant references;
- business-day offsets with explicit calendar snapshots;
- semantic windows with explicit locale/custom snapshots;
- explicit observer/reference snapshots for gated conditions;
- explicit context snapshot adapters;
- civil-time gap/fold behavior from pinned zone rules;
- append-only materialization;
- exact full-surface cron/RRULE import/export subset (interval-based cadences, monthly positional/weekday-set `BYDAY`, weekly weekday sets, `DAILY`+`BYDAY` at `INTERVAL=1`, `WKST`, `COUNT`/`UNTIL` horizons, `EXDATE` exception markers);
- CLI commands for canonicalize, validate, support, resolve, import/export, and materialize;
- MCP stdio tools, read-only resources, and prompts for agent hosts.

## Adapter support

Cron/RRULE adapter support is exact for the following full-surface subset (v1.0, widened in 1.1.0). Every shape the RRULE importer accepts resolves as a series through `resolveSeries` (see [Series resolution](#series-resolution)).

**RRULE — interval-based cadences (no `BYDAY`):**

- `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY` with any positive integer `INTERVAL`, mapped to Decan `repeat` (`day`/`week`/`month`/`year`) with matching `every`;
- explicit local `DTSTART` (basic `YYYYMMDDTHHMMSS` form), preserved including non-zero seconds;
- `WEEKLY` with a single `BYDAY` matching `DTSTART`'s own weekday (redundant but explicit) still imports as this plain `repeat(week)`, with no `selection`, byte-for-byte as in 1.0.0.

**RRULE — `WEEKLY` weekday sets (1.1.0):**

- `WEEKLY` with a `BYDAY` of one or more bare weekdays (no ordinals), where the set is anything other than exactly `{DTSTART's weekday}`, imports as `compound([clock, repeat(week, INTERVAL), ...selection(weekday, all), ...exceptions])`. This covers weekday sets (`BYDAY=MO,WE`) and a single weekday that differs from `DTSTART` (`BYDAY=TH` from a Tuesday). The loss report preserves `"weekly weekday-set selection"`;
- selections are emitted in canonical `MO`..`SU` order, so the expression does not depend on the order of the source `BYDAY` list;
- a weekday listed twice, or any ordinal at weekly frequency (`BYDAY=1MO`), fails closed;
- export: `selection(weekday, all)` expressions under `repeat(week, n, civil)` export as `FREQ=WEEKLY;INTERVAL=n;BYDAY=<codes in MO..SU order>`. Import → export → import is the identity on the expression. An ordinal selection under a weekly repeat fails closed on export.

**RRULE — `DAILY` with `BYDAY` (1.1.0):**

- `DAILY` with `INTERVAL=1` (explicit or default) and a `BYDAY` set means every listed weekday of every week. It imports as exactly the compound the `WEEKLY` rule with the same set would produce, with the same horizon and loss report, and a diagnostic that states the equivalence. It exports back as `FREQ=WEEKLY`;
- `DAILY` with `INTERVAL>1` plus `BYDAY` still fails closed: the day stride and the weekday filter interact, and that interaction has no resolver representation.

**RRULE — `WKST` (1.1.0):**

- `WKST=MO` is accepted at any `INTERVAL`. Decan's week stride uses ISO weeks, which start on Monday;
- any other `WKST` is accepted only at `INTERVAL=1`, where week start cannot change the occurrence set. With `INTERVAL>1` it fails closed with a message naming week-start dependence. This rule applies at every `FREQ`;
- a `WKST` value that is not a weekday code fails closed.

**RRULE — `MONTHLY` positional and weekday-set `BYDAY`:**

- one or more `BYDAY` tokens of the form `(+|-)?N<weekday>` or a bare `<weekday>`, each mapped to a Decan `selection` expression (`filter: weekday`, `selector: ordinal N` for `+1`..`+5`, `selector: ordinal -1` for "last", `selector: all` for a bare weekday token meaning every occurrence of that weekday in the month);
- multiple `BYDAY` tokens (a weekday set, e.g. `BYDAY=TU,TH`) become multiple `selection` expressions in the same `compound`;
- `INTERVAL` on a positional `MONTHLY` rule is carried as a `repeat(month, every=INTERVAL, mode=civil)` sibling expression inside the compound. To expand "the 3rd Tuesday of every month" across a range, use `resolveSeries`, which composes the stride with the month-scoped selections. `resolveExpression`'s behavior is unchanged: its generic `compound` handling still evaluates `repeat` and `selection` independently and concatenates the results, so passing the whole compound to it with a large `count` horizon does not produce the series.

**RRULE — horizons:**

- `COUNT=n` ↔ `{ kind: "count", value: n }` on `ScheduleAdapterImport.horizon` / `RRuleExportRequest.horizon`;
- `UNTIL=<DATE or DATE-TIME>` ↔ `{ kind: "until", value: "YYYY-MM-DD" }` (time-of-day, if present on import, is not preserved — Decan's own horizon comparison is date-granularity only, per `resolve.ts`'s `until` handling);
- `COUNT` and `UNTIL` together on one rule is rejected (RFC 5545 forbids both; this is not a Decan-specific restriction).

**RRULE — `EXDATE`:**

- each `EXDATE` value becomes a Decan `exception` expression whose `predicate.reference` is `@exdate:<original token text>`. To apply the exclusions per date, use `resolveSeries`, which evaluates these markers (date-granular; see [Series resolution](#series-resolution)). `resolveExpression`'s behavior is unchanged: its generic `exception` handling is still a global suppress gate keyed on an externally supplied boolean reference, so a `true` reference for one marker empties the entire result, not just that date.

**Cron — extends the existing weekly subset with two new shapes:**

- monthly-by-day: five-field cron with numeric day-of-month, wildcard month, wildcard day-of-week → Decan `repeat(month, 1)`, anchored to the next occurrence of that day-of-month on or after `effectiveFrom`;
- yearly: five-field cron with numeric day-of-month, numeric month, wildcard day-of-week → Decan `repeat(year, 1)`, anchored similarly. A day/month combination that never occurs (e.g. day 31 with a month lookahead that never lands) fails closed.
- cron's day-of-month plus day-of-week combined (POSIX "OR" semantics) is not supported — it has no Decan equivalent and fails closed.

**Still unsupported — fails closed with a loss report naming the discarded consequence:**

- `BYSETPOS`, `BYYEARDAY`, `BYWEEKNO`, `BYMONTH`, `BYMONTHDAY` (alone or combined with `BYDAY`, e.g. "first Monday of November" `YEARLY` recurrences), and any other RFC 5545 part outside `FREQ`/`INTERVAL`/`BYDAY`/`COUNT`/`UNTIL`/`WKST`;
- `BYDAY` ordinals outside Decan's exact selection range (only `+1`..`+5` and `-1` are supported — `TemporalSelector`'s `ordinal` variant has no `-2`..`-5`);
- `BYDAY` ordinals at `WEEKLY` or `DAILY` frequency, and a `BYDAY` list that repeats a weekday;
- `BYDAY` combined with `DAILY` at `INTERVAL>1`, or with `YEARLY` at any interval;
- `WKST` other than `MO` when `INTERVAL>1`;
- full RFC 5545/iCalendar (`VTIMEZONE`, `RDATE`, `RECURRENCE-ID`, multiple `RRULE` lines, etc.) — out of scope, unchanged from the prior release.

Unsupported or lossy shapes return capability errors. They are not silently approximated.

## Series resolution

`resolveSeries(request)` expands one recurring compound into a finite, ordered occurrence list over a caller-supplied window. It is a separate function; `resolveExpression` is unchanged.

```ts
resolveSeries({
  expression,       // a compound as produced by importRRule, or authored in the same shape
  lifecycle,        // lifecycle.effectiveFrom is the series origin (DTSTART's civil date)
  horizon,          // optional: { kind: "count" } or { kind: "until" }
  window,           // { start, end }: inclusive YYYY-MM-DD civil dates
  context,          // a timezone snapshot, required if and only if the compound has a clock point
  maxOccurrences    // optional generation cap, default 1000
});
// -> { id, occurrences: [{ date, instants, civil }], excluded, needs, truncated }
```

**Accepted shape.** Anything else fails closed with a capability error whose `details.lossReport` names what was not modeled:

- exactly one `repeat` with `mode: "civil"` and unit `day`, `week`, `month`, or `year`;
- at most one `point`, which must be a valid local `clock`;
- zero or more `selection`s with a `weekday` filter. Under `repeat(week)` the selector must be `all`. Under `repeat(month)` it must be `all` or an ordinal (`1`–`5`, `-1`). Selections under `repeat(day)` or `repeat(year)` are not modeled;
- zero or more `exception`s whose `predicate.reference` is `@exdate:` followed by a basic `YYYYMMDD` or `YYYYMMDDTHHMMSS` token.

Any other exception, and any `condition`, `adjustment`, `offset`, `relation`, `window`, `boundary`, or `duration`, is rejected. Those have their own semantics in `resolveExpression`, and `resolveSeries` does not silently reinterpret them. A `duration` horizon is also a capability error.

**Selection scope.** A selection is scoped to the period of the enclosing repeat's unit. Under `repeat(week, n)` that period is the ISO week (Monday start) containing each stride week. Under `repeat(month, n)` it is the calendar month.

**Stride.** Periods step by `repeat.every` from the period that contains `effectiveFrom`. With no selections, occurrences are `effectiveFrom` advanced by the stride, exactly as `resolveExpression` generates repeat dates. That includes month-end clamping: Jan 31 + 1 month is Feb 28. RFC 5545 would skip the invalid date instead.

**Origin.** Dates before `effectiveFrom` in the first period are not occurrences. When selections are present, `effectiveFrom` is an occurrence only if it satisfies them. RFC 5545 leaves the result for a `DTSTART` that is not synchronized with the rule undefined, and `resolveSeries` does not invent one.

**Horizons.**

- Generation always starts at `effectiveFrom`, never at `window.start`, so a window that begins mid-series still counts from the origin. Only dates inside the window are returned.
- `COUNT` limits generated occurrences before `EXDATE` suppression, as in RFC 5545. An excluded date still consumes the count.
- `UNTIL` drives generation directly: the series stops at the first generated date after `UNTIL`. There is no count estimation. `UNTIL` is date-granular, as it is in `resolveExpression`.
- With no horizon, generation runs to `window.end`.
- `maxOccurrences` caps generated dates. Hitting the cap before the horizon or the window end sets `truncated: true`.

**EXDATE is date-granular.** The date part of an `@exdate:` token suppresses that civil date. A date-time token whose time differs from the clock point still suppresses that date. Suppressed dates inside the window are listed in `excluded`. A token that matches no generated date suppresses nothing.

**Instants.** With a clock point, each date resolves through `resolveCivilTime` against the supplied timezone snapshot, the same way `resolveExpression` resolves a clock on a repeat date. Each occurrence's `civil` is:

- `exact`: one instant;
- `gap`: the local time does not exist that day (spring-forward), so `instants` is empty;
- `fold`: the local time occurs twice (fall-back), so `instants` holds both, earliest first;
- `date_only`: the compound has no clock point.

**No gap or fold policy is chosen.** The consumer decides, per the non-conformant behavior below. A missing timezone snapshot is a `timezone` need, not a guess, and occurrences are then empty. A missing `lifecycle.effectiveFrom` is a `feature` need.

**Identity.** `id` is the SHA-256 of the canonical JSON of `{ expression, lifecycle, horizon, window, context }`, in the style of the resolver's resolution identity. `maxOccurrences` is not part of the identity.

`resolveSeries` never reads the host timezone, clock, or locale. Its only time inputs are the request's fields.

## Human-first claim

Decan meets the human-first design goal by providing:

- readable source syntax;
- canonical text that is deterministic and reviewable;
- source records that remain immutable evidence;
- semantic windows and relations that do not collapse prematurely into timestamps;
- visible unresolved needs and conflicts.

## Agent-friendly claim

Decan meets the agent-friendly design goal by providing:

- typed public operations;
- strict success/failure envelopes;
- stable content identities;
- deterministic finite resolution;
- capability manifests;
- support classification;
- explicit snapshot inputs;
- derivation-bearing candidates;
- idempotent materialization;
- CLI and MCP surfaces that expose the same core behavior without ambient host inference.

## Non-conformant behavior

A Decan-compatible implementation must not:

- invent timezone, locale, location, calendar, or observer context;
- fetch live data during core resolution;
- treat understanding as authority;
- treat execution as fulfillment;
- silently degrade unsupported cron/RRULE semantics;
- rewrite original intent with resolved timestamps;
- hide conflicts by choosing a policy without an explicit input.

## Current non-goals

- Full RFC 5545/iCalendar import/export.
- Full RRULE semantics.
- Cron ranges, steps, lists, or macros, and cron shapes beyond weekly, monthly-by-day, and yearly.
- Live dynamic observers in core.
- Natural-language parsing beyond source/authoring evidence.
- A hosted scheduler service.
- Public governance or standards-submission process.
