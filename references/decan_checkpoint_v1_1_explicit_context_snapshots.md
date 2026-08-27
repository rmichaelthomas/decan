# decan_checkpoint_v1_1_explicit_context_snapshots.md

# CANONICAL CHECKPOINT DOCUMENT
## Decan / Scheduling Language / Temporal Primitive
### v1.1 — Explicit context snapshots: no ambient fallback roadmap seam

**Status:** LOCKED — EXTENDS `decan_checkpoint_v1_0_three_consumer_corpus`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `decan`  
**Session type:** Roadmap clarification, context snapshot implementation, and boundary checkpoint  
**Relationship to prior checkpoints:** Direct continuation of `decan_checkpoint_v1_0_three_consumer_corpus`, which completed the three-consumer evidence corpus for 5xFive, Seshat, and the Cloudflare backward-channel package. All prior checkpoints through v1.0 remain in force.

This checkpoint answers the README question: when Decan says it has no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback, that is not a missing-feature confession. It is the primitive's determinism boundary. The roadmap seam is not hidden fallback; the roadmap seam is explicit context evidence.

## HOW TO READ THIS DOCUMENT

This is a small implementation checkpoint. It records that Decan now exposes first-class helpers for caller-supplied context and reference snapshots. These helpers adapt evidence into Decan's existing resolution frame. They do not capture evidence themselves.

No live connector, host clock read, host timezone read, browser/device geolocation read, network fetch, calendar poll, observer subscription, scheduler service, Binding, authority, execution, retry, verification, fulfillment, or obligation lifecycle is added by this checkpoint.

---

# PART XXVII — ROADMAP CLARIFICATION

## §91. No ambient fallback remains a core invariant

**Decision: Decan must not silently choose host locale, timezone, clock, location, network facts, or live observer state. LOCKED.**

The README boundary is intentionally strong. A Decan resolution must be replayable from the expression, explicit `referenceTime`, finite horizon, supplied references, supplied context snapshots, and lifecycle inputs. If a required input is absent, Decan returns a typed `need` instead of reaching outward.

This keeps the primitive deterministic, inspectable, and safe to use under downstream systems that may have authority, execution, or verification responsibilities.

## §92. Explicit context snapshots are the correct roadmap seam

**Decision: Decan may standardize how consumers hand it pinned context evidence. LOCKED.**

The approved roadmap shape is:

- timezone rules as immutable zone snapshots;
- business calendars as immutable closed-date snapshots;
- locale day periods as explicit locale snapshots;
- observer/reference facts as explicit snapshots;
- location, participant, availability, astronomical, and custom context as inert versioned evidence records.

These are evidence adapters, not providers with authority to observe the world. The consumer decides when and how evidence was captured; Decan records and consumes what was supplied.

---

# PART XXVIII — IMPLEMENTATION DELTA

## §93. Decan now exports explicit context snapshot constructors

**Decision: the public package surface includes first-class snapshot constructors for context evidence. LOCKED.**

The new provider module exposes:

- `timezoneSnapshot`
- `businessCalendarSnapshot`
- `locationSnapshot`
- `participantSnapshot`
- `availabilitySnapshot`
- `astronomicalSnapshot`
- `customContextSnapshot`
- `explicitReference`

Existing helpers remain:

- `localeSnapshot`
- `observationReference`

The constructors are pure object adapters. They do not read `Date.now`, `Intl`, host timezone data, host locale data, account/profile state, filesystem state, browser/device location, network data, calendars, or observers.

## §94. Capability reporting names the seam without overclaiming live support

**Decision: Decan advertises `explicit-context-snapshot-adapters` as exact for resolution while keeping live observers pending and general resolve partial. LOCKED.**

The temporal-core capability manifest now includes:

- `explicit-context-snapshot-adapters` — exact for `resolve`;
- `explicit-locale-snapshots` — exact for `resolve`;
- `explicit-observer-snapshots` — exact for `resolve`;
- `live-dynamic-observers` — pending for `resolve`;
- `cron-rrule-adapters` — unsupported for `resolve`;
- general `resolve` — partial.

The new exact claim is narrow: Decan can consume explicit snapshots at the resolution boundary. It does not claim live capture, dynamic observation, or complete resolver coverage.

## §95. Verification status is green for the explicit-context sprint

**Decision: the Decan worktree verifies after adding explicit context snapshot adapters. LOCKED.**

Verification run after this sprint:

- `npm run typecheck` — passed
- `npm test -- --cache=false` — passed: 27 test files, 76 tests
- `npm run build` — passed

Repository status entering this checkpoint:

- v0.9 committed as `b76a995` (`feat: add first consumer evidence corpus`)
- v1.0 committed as `42b08d6` (`feat: complete three-consumer evidence corpus`)
- v1.1 pending commit at checkpoint authoring time

## WHAT IS LOCKED

- The README boundary means “no hidden fallback,” not “Decan can never receive context.”
- Explicit context evidence is now a first-class Decan roadmap seam.
- Context snapshot constructors are pure adapters from caller-supplied data into Decan snapshot records.
- Missing context remains a typed `need`.
- General `resolve` remains partial.
- Live observers remain pending.
- Cron/RRULE adapters remain unsupported.
- No execution, authority, verification, fulfillment, or scheduler behavior moved into Decan.

## WHAT IS NOT LOCKED

- Live context capture providers.
- Browser/device geolocation capture.
- Network-backed holiday/calendar adapters.
- Dynamic observer subscriptions.
- A context-provider plugin protocol.
- Promotion of all context kinds to resolver-consumed semantics.
- Any downstream consumer policy for when evidence should be captured.

---

## UPDATED OPEN QUESTIONS (v1.1 status)

| # | Question | Status |
|---|---|---|
| 1 | Should Decan have ambient locale/timezone/clock/geolocation/network/dynamic-observer fallback? | Resolved — no. |
| 2 | Should Decan standardize explicit snapshot handoff from consumers? | Resolved — yes, v1.1. |
| 3 | Are live capture providers part of Decan core? | Resolved — no. |
| 4 | Should a future adapter package capture context from real systems? | Open — possible outside core, must produce pinned snapshots and receipts. |
| 5 | Should location, participant, availability, astronomical, and custom context gain resolver semantics? | Deferred — carryable as evidence now; semantics remain evidence-gated. |

---

## RESUME PROMPT (v1.1)

*Resume from `decan_checkpoint_v1_1_explicit_context_snapshots` in `/Users/rmichaelthomas/Documents/Codex/decan`. v1.0 completed the three-consumer corpus for 5xFive, Seshat, and Cloudflare backward-channel. v1.1 clarifies the README boundary: no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback is a core invariant, not a missing feature. The correct roadmap seam is explicit context evidence. Decan now exports pure constructors for timezone, business calendar, location, participant, availability, astronomical, custom context, and explicit reference snapshots, while retaining locale and observer helpers. The temporal-core capability manifest advertises `explicit-context-snapshot-adapters` as exact for `resolve`, while keeping general `resolve` partial, live dynamic observers pending, and cron/RRULE adapters unsupported. Preserve all prior invariants: explicit snapshots only, finite resolution horizons, derivation-bearing candidates, idempotent append-only Occurrences, no host/ambient time context, no live observers, no scheduler service, no Binding, no authority, no execution, no retry, no acknowledgement, no verification, no fulfillment, and no TAOS obligation lifecycle inside Decan. Future work, if any, should be evidence-gated: either a loss-aware cron/RRULE import profile, richer derivation/explain evidence, or an external context-capture adapter package that emits pinned Decan-compatible snapshots and receipts.*
