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
- elapsed sub-day recurrence from explicit instant origin;
- relation offsets from date or instant references;
- business-day offsets with explicit calendar snapshots;
- semantic windows with explicit locale/custom snapshots;
- explicit observer/reference snapshots for gated conditions;
- explicit context snapshot adapters;
- civil-time gap/fold behavior from pinned zone rules;
- append-only materialization;
- exact full-surface cron/RRULE import/export subset (interval-based cadences, monthly positional/weekday-set `BYDAY`, `COUNT`/`UNTIL` horizons, `EXDATE` exception markers);
- CLI commands for canonicalize, validate, support, resolve, import/export, and materialize;
- MCP stdio tools, read-only resources, and prompts for agent hosts.

## Adapter support

Cron/RRULE adapter support is exact for the following full-surface subset (v1.0):

**RRULE — interval-based cadences (no `BYDAY`):**

- `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY` with any positive integer `INTERVAL`, mapped to Decan `repeat` (`day`/`week`/`month`/`year`) with matching `every`;
- explicit local `DTSTART` (basic `YYYYMMDDTHHMMSS` form), preserved including non-zero seconds;
- `WEEKLY` additionally accepts a single `BYDAY` matching `DTSTART`'s own weekday (redundant but explicit) — this is unchanged from the prior subset, only `INTERVAL` is now unrestricted.

**RRULE — `MONTHLY` positional and weekday-set `BYDAY`:**

- one or more `BYDAY` tokens of the form `(+|-)?N<weekday>` or a bare `<weekday>`, each mapped to a Decan `selection` expression (`filter: weekday`, `selector: ordinal N` for `+1`..`+5`, `selector: ordinal -1` for "last", `selector: all` for a bare weekday token meaning every occurrence of that weekday in the month);
- multiple `BYDAY` tokens (a weekday set, e.g. `BYDAY=TU,TH`) become multiple `selection` expressions in the same `compound`;
- `INTERVAL` on a positional `MONTHLY` rule is carried as a `repeat(month, every=INTERVAL, mode=civil)` sibling expression inside the compound — **this is adapter-carried cadence-stride metadata, not something the raw resolver evaluates in one call.** Decan's `resolveExpression` resolves the `selection` filter against the month of whatever `referenceTime` it is given; it does not iterate months on its own. A consumer that needs "the 3rd Tuesday of every month across a range" (e.g. 5xFive's availability evaluator) must call `resolveExpression` once per eligible month — stepping by `repeat.every` months starting at `lifecycle.effectiveFrom` — passing just that month's reference time, and take the `selection` result. Passing the whole compound to `resolveExpression` in one call with a large `count` horizon does **not** produce the intended multi-month series, because `repeat` and `selection` are independently evaluated and concatenated by the resolver's generic `compound` handling, not composed.

**RRULE — horizons:**

- `COUNT=n` ↔ `{ kind: "count", value: n }` on `ScheduleAdapterImport.horizon` / `RRuleExportRequest.horizon`;
- `UNTIL=<DATE or DATE-TIME>` ↔ `{ kind: "until", value: "YYYY-MM-DD" }` (time-of-day, if present on import, is not preserved — Decan's own horizon comparison is date-granularity only, per `resolve.ts`'s `until` handling);
- `COUNT` and `UNTIL` together on one rule is rejected (RFC 5545 forbids both; this is not a Decan-specific restriction).

**RRULE — `EXDATE`:**

- each `EXDATE` value becomes a Decan `exception` expression whose `predicate.reference` is `@exdate:<original token text>` — an **adapter-carried marker**, not a predicate Decan's core resolver evaluates. `resolve.ts`'s generic `exception` handling is a global all-or-nothing suppress gate keyed on an externally-supplied boolean reference; it has no per-date exclusion semantics. A consumer applying `EXDATE` filtering (e.g. 5xFive's availability evaluator, subtracting excluded dates from resolved candidates) must read these markers directly from the compound and match them against candidates itself — it must not rely on `resolveExpression`'s built-in `exception` handling to do per-date subtraction, since that would suppress the *entire* result set, not just the excluded dates.

**Cron — extends the existing weekly subset with two new shapes:**

- monthly-by-day: five-field cron with numeric day-of-month, wildcard month, wildcard day-of-week → Decan `repeat(month, 1)`, anchored to the next occurrence of that day-of-month on or after `effectiveFrom`;
- yearly: five-field cron with numeric day-of-month, numeric month, wildcard day-of-week → Decan `repeat(year, 1)`, anchored similarly. A day/month combination that never occurs (e.g. day 31 with a month lookahead that never lands) fails closed.
- cron's day-of-month plus day-of-week combined (POSIX "OR" semantics) is not supported — it has no Decan equivalent and fails closed.

**Still unsupported — fails closed with a loss report naming the discarded consequence:**

- `BYSETPOS`, `BYYEARDAY`, `BYWEEKNO`, `BYMONTH`/`BYMONTHDAY` combined with `BYDAY` (e.g. "first Monday of November" `YEARLY` recurrences), and any other RFC 5545 part outside `FREQ`/`INTERVAL`/`BYDAY`/`COUNT`/`UNTIL`;
- `BYDAY` ordinals outside Decan's exact selection range (only `+1`..`+5` and `-1` are supported — `TemporalSelector`'s `ordinal` variant has no `-2`..`-5`);
- `WEEKLY` weekday sets (multiple `BYDAY` values) or a single `BYDAY` that does not match `DTSTART`'s weekday — `repeat(week, n)` has no way to represent "starts on one weekday, recurs on a different one," and `selection` is month-scoped, not week-scoped;
- `BYDAY` combined with `DAILY` or `YEARLY` frequency;
- full RFC 5545/iCalendar (`VTIMEZONE`, multiple `RRULE`/`RDATE` lines, etc.) — out of scope, unchanged from the prior release.

Unsupported or lossy shapes return capability errors. They are not silently approximated.

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
- Cron ranges, steps, lists, macros, or non-weekly schedules.
- Live dynamic observers in core.
- Natural-language parsing beyond source/authoring evidence.
- A hosted scheduler service.
- Public governance or standards-submission process.
