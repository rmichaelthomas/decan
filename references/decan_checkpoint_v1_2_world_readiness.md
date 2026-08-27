# decan_checkpoint_v1_2_world_readiness.md

# CANONICAL CHECKPOINT DOCUMENT
## Decan / Scheduling Language / Temporal Primitive
### v1.2 — World-readiness closure: exact resolver matrix and cron/RRULE adapter subset

**Status:** LOCKED — EXTENDS `decan_checkpoint_v1_1_explicit_context_snapshots`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `decan`  
**Session type:** World-readiness implementation and closure checkpoint  
**Relationship to prior checkpoints:** Direct continuation of v1.1, which made explicit context snapshots first-class and clarified that no ambient fallback remains a core invariant. All prior checkpoints through v1.1 remain in force.

This checkpoint closes the last two blocking readiness gaps identified after v1.1:

1. general `resolve` could not remain an unqualified `partial`;
2. cron/RRULE adapters could not remain wholly unsupported if Decan is meant to meet the long-standing calendaring/scheduling world.

The live-observer gap is considered settled architecturally: live observers are not Decan core. They are future external systems or modules that may emit pinned observer/reference snapshots for Decan to consume.

## HOW TO READ THIS DOCUMENT

This is not a claim that Decan replaces RFC 5545/iCalendar or resolves every calendaring feature. It records a narrower standard-shaped posture:

- Decan core is exact about its own resolver support boundary.
- Cron/RRULE interop exists only for exact safe recurrence subsets.
- Unsupported or lossy imports fail closed.
- Decan remains a temporal-intent primitive, not a scheduler, calendar server, or execution engine.

---

# PART XXIX — RESOLVER CLOSURE

## §96. General resolver support is exact by classification, not by fantasy

**Decision: `temporal-core.resolve` is now exact because every Decan expression family has a declared deterministic outcome class. LOCKED.**

The word `exact` here means that the resolver and support matrix no longer leave any AST family in a vague “partial” bucket. Every expression family is classified as one of:

- exact candidate production;
- exact typed dependency needs;
- exact conflict behavior;
- exact unsupported feature need.

This does not mean every semantic idea produces candidates. Durations and boundaries, for example, are meaningful temporal expressions but are not standalone occurrence candidates. They now resolve to explicit feature needs rather than a generic unsupported-subset message.

## §97. The resolver support matrix is public surface

**Decision: Decan exposes `classifyResolveSupport(expression)` as the support-matrix entry point. LOCKED.**

The support matrix covers all Decan expression kinds:

- point
- window
- repeat
- selection
- relation
- offset
- duration
- condition
- boundary
- exception
- adjustment
- compound

This function does not execute resolution and does not inspect ambient state. It classifies the requested expression shape so consumers can decide whether to provide snapshots, report needs, or reject unsupported forms before runtime resolution.

## §98. Live dynamic observers are unsupported in core

**Decision: `live-dynamic-observers` is closed as unsupported in Decan core. LOCKED.**

Observer facts remain valid as pinned snapshots. Live polling, subscriptions, dynamic observer services, calendar watching, verification watching, location watching, and dependency-health watching belong outside Decan core.

A future moat/product/system/module may provide those captures, but its Decan-facing output must be versioned snapshots or reference facts.

---

# PART XXX — CRON / RRULE INTEROP CLOSURE

## §99. Cron and RRULE adapters exist for exact weekly subsets only

**Decision: Decan now supports loss-aware cron/RRULE adapters for the first exact subset. LOCKED.**

The new adapter module supports:

- importing five-field cron expressions shaped as one minute, one hour, wildcard day-of-month, wildcard month, and one weekday;
- importing RFC 5545-style RRULE strings shaped as weekly recurrence with `INTERVAL=1`, explicit local `DTSTART`, and optional single `BYDAY` matching `DTSTART`;
- exporting Decan weekly civil recurrence plus one clock point and lifecycle origin to `DTSTART` plus `RRULE` content lines.

Example exact cron subset:

```text
0 9 * * 1
```

Example exact RRULE subset:

```text
DTSTART:20260831T090000
RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO
```

The adapter does not import or export full iCalendar components. It handles recurrence interchange only.

## §100. Unsupported or lossy cron/RRULE shapes fail closed

**Decision: adapters must not emit apparently valid Decan expressions when source semantics cannot be preserved exactly. LOCKED.**

The first adapter rejects unsupported shapes such as:

- cron step expressions like `*/15`;
- cron ranges, lists, macros, multiple daily times, specific months, or day-of-month combinations;
- RRULE `COUNT`, `UNTIL`, `BYSETPOS`, monthly/yearly frequencies, multiple `BYDAY` values, `BYMONTHDAY`, and other parts outside the exact subset.

This follows the original rule: cron and RRULE are useful targets, but they do not define Decan's semantic ceiling.

## §101. Verification status is green for world-readiness closure

**Decision: the Decan worktree verifies after resolver and adapter closure. LOCKED.**

Verification run after this sprint:

- `npm run typecheck` — passed
- `npm test -- --cache=false` — passed: 29 test files, 84 tests
- `npm run build` — passed

Repository status entering this checkpoint:

- v0.9 committed as `b76a995` (`feat: add first consumer evidence corpus`)
- v1.0 committed as `42b08d6` (`feat: complete three-consumer evidence corpus`)
- v1.1 committed as `88bb328` (`feat: add explicit context snapshot adapters`)
- v1.2 pending commit at checkpoint authoring time

## WHAT IS LOCKED

- General `resolve` is no longer vague partial; it is exact over Decan's declared support matrix.
- `classifyResolveSupport(expression)` is public.
- Duration and boundary expressions produce typed unsupported feature needs when asked to stand alone as candidates.
- Live dynamic observers are unsupported in Decan core.
- Cron/RRULE adapters support the first exact weekly subset.
- Cron/RRULE unsupported or lossy shapes fail closed.
- Decan remains a temporal-intent primitive, not an RFC 5545 replacement, scheduler, execution engine, or live observer system.

## WHAT IS NOT LOCKED

- Full RFC 5545/iCalendar component import/export.
- Full RRULE semantics.
- Cron ranges, steps, lists, macros, or non-weekly schedules.
- Lossy import acceptance.
- Live observer capture modules.
- A separate product/package boundary for Proper Time.
- Public standards-submission packaging, naming, registry, or governance.

---

## UPDATED OPEN QUESTIONS (v1.2 status)

| # | Question | Status |
|---|---|---|
| 1 | Can `resolve` leave a vague partial claim? | Resolved — no; exact support matrix is now public. |
| 2 | Should Decan implement full RFC 5545? | Resolved — no; Decan is a temporal-intent primitive with adapters. |
| 3 | Is there an exact cron/RRULE subset? | Resolved — yes; weekly recurrence with one clock and explicit origin. |
| 4 | Are live observers a core blocker? | Resolved — no; unsupported in core, future external module. |
| 5 | Is Decan built out from the initial idea? | Resolved for initial primitive scope — yes, subject to final release packaging. |

---

## RESUME PROMPT (v1.2)

*Resume from `decan_checkpoint_v1_2_world_readiness` in `/Users/rmichaelthomas/Documents/Codex/decan`. v1.2 closes the two remaining core readiness gaps after live observers were settled out-of-core. `temporal-core.resolve` is now exact by classification: every Decan expression family has a deterministic outcome class through `classifyResolveSupport(expression)` — candidate, typed needs, conflict, or unsupported feature need. Live dynamic observers are unsupported in Decan core and belong in future external snapshot-producing modules. Cron/RRULE adapters now support the first exact weekly subset: cron with one minute, one hour, wildcard day-of-month/month, and one weekday; RRULE with explicit local DTSTART, FREQ=WEEKLY, INTERVAL=1, and optional single BYDAY matching DTSTART; export emits DTSTART plus RRULE lines for Decan weekly civil recurrence plus one clock and lifecycle origin. Unsupported or lossy cron/RRULE shapes fail closed. Preserve all prior invariants: explicit snapshots only, finite resolution horizons, derivation-bearing candidates, idempotent append-only Occurrences, no host/ambient time context, no live observers, no scheduler service, no Binding, no authority, no execution, no retry, no acknowledgement, no verification, no fulfillment, and no TAOS obligation lifecycle inside Decan. Next work is no longer primitive completion; it is release/world packaging: naming posture (`Decan` vs. `Proper Time`), spec README, examples, API polish, package boundaries, and standards-facing narrative.*
