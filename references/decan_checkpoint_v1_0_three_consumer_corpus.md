# decan_checkpoint_v1_0_three_consumer_corpus.md

# CANONICAL CHECKPOINT DOCUMENT
## Decan / Scheduling Language / Temporal Primitive
### v1.0 — Three Consumer Corpus: portfolio evidence pass completed

**Status:** LOCKED — EXTENDS `decan_checkpoint_v0_9_consumer_evidence`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `decan`  
**Session type:** Next-sprint consumer-corpus implementation and verification checkpoint  
**Relationship to prior checkpoints:** Direct continuation of `decan_checkpoint_v0_9_consumer_evidence` (August 27, 2026), which locked 5xFive / Banneker 1 Automations as the first real consumer evidence case and identified Seshat scan scheduling plus the Cloudflare backward-channel package as the next two portfolio consumers. All prior checkpoints through v0.9 remain in force.

v0.9 locked the post-C6 endpoint for the first real consumer case. This checkpoint records the next sprint being completed in the same evidence-first style: the corpus now covers the three original portfolio consumers named in Primitive Exploration §4. The session's key untangling was that the two new cases were not asking Decan to become an executor. They exposed a narrower temporal gap: elapsed instant offsets and elapsed sub-day recurrence were promised by the language checkpoints but underbuilt in the local implementation.

## HOW TO READ THIS DOCUMENT

This is a build/status checkpoint. It records completed repository work and its verification evidence. It does not add live connectors, a scheduler service, Cloudflare integration, Binding, authority, execution, retry, verification, fulfillment, or TAOS obligation interpretation to Decan.

The important rule is unchanged: Decan may produce temporal candidates and materialized Occurrences from explicit inputs. The consuming systems own their own execution and obligation layers.

---

# PART XXV — THREE CONSUMER CORPUS

## §85. The original portfolio trio now has executable evidence coverage

**Decision: Decan's consumer evidence corpus now covers 5xFive, Seshat, and Cloudflare backward-channel as executable cases. LOCKED.**

Primitive Exploration §4 named three direct portfolio connections for the scheduling primitive:

- 5xFive uses Cloudflare Cron Triggers.
- Seshat schedules scans.
- The Cloudflare backward-channel package would consume this format for agent obligation scheduling.

The corpus now includes all three:

- `5xfive-banneker1-cron-trigger` — cron `0 9 * * 1`, interpreted as weekly Monday at 09:00 America/New_York, materialized from pinned timezone context.
- `seshat-dep-checker` — a Seshat dependency checker that waits 10 seconds after process start, then repeats every 30 seconds.
- `cloudflare-backward-channel-obligation-expiration` — an agent obligation expiration candidate 24 hours after a resource-touch event while verification remains pending.

Each case pins source evidence, input snapshots/references, finite horizon, expected candidates, derivation expectations, materialization/replay expectations, and observed gap classification.

## §86. Seshat exposed elapsed sub-day recurrence from an event-derived instant

**Decision: Seshat's dependency checker is represented as elapsed recurrence anchored to an explicit process-start event, not as a scheduler loop owned by Decan. LOCKED.**

The Seshat source evidence is `/Users/rmichaelthomas/seshat-app` at commit `056c859` / tag `v2.2.0`. The relevant source is `seshat.py`, whose dependency checker thread has a 10-second warm-up and a 30-second recurring sweep while managed projects are running.

The Decan case pins `@process-started` as an explicit instant-valued reference:

- process started: `2026-08-27T17:00:00Z`
- first candidate after warm-up: `2026-08-27T17:00:10Z`
- second candidate: `2026-08-27T17:00:40Z`
- third candidate: `2026-08-27T17:01:10Z`

Seshat retains ownership of daemon lifecycle, project registry scanning, dependency checks, process state, and execution. Decan owns only the temporal cadence candidates.

## §87. Cloudflare backward-channel exposed elapsed instant offsets for obligation expiration

**Decision: the Cloudflare backward-channel Build 1 case is represented as a temporal expiration candidate, not as obligation lifecycle implementation inside Decan. LOCKED.**

The source evidence is `cloudflare_contribution_inception_checkpoint_v1_0.md`, specifically Build 1: the backward-channel package. That document defines a package for Cloudflare Agents with obligation lifecycle, receipt chain, beneficiary field, post-action verification, and declared effect surface. It says an obligation is created when an agent touches a resource and terminates when the condition is met or the claim expires.

The Decan case pins:

- resource touch: `2026-08-27T18:00:00Z`
- verification pending: `true`
- expiration candidate: `2026-08-28T18:00:00Z`

The backward-channel package retains ownership of obligation lifecycle, receipts, beneficiary fields, post-action verification, declared effect surfaces, and Cloudflare Agents integration. Decan owns only the temporal expiration candidate.

---

# PART XXVI — IMPLEMENTATION DELTA

## §88. Elapsed instant offsets and elapsed sub-day recurrence are now exact seams

**Decision: Decan now supports exact elapsed offsets from explicit instant-valued references and exact elapsed second/minute/hour recurrence from a resolved instant origin. LOCKED.**

The next-sprint cases exposed two closely related implementation gaps:

- relation offsets from references whose value is an explicit instant;
- repeat expressions such as `repeat every 30 seconds elapsed`.

The implementation now:

- accepts `second`, `minute`, and `hour` repeat units only when the repeat mode is `elapsed`;
- keeps civil repeat units separate from elapsed repeat units;
- resolves elapsed offsets from instant candidates;
- expands elapsed sub-day recurrence from an explicit origin instant under a finite horizon;
- reports the new seams in the capability manifest without promoting the whole resolver from partial to exact.

The capability surface now includes:

- `elapsed-instant-offsets` — exact for `resolve`;
- `elapsed-subday-recurrence` — exact for `resolve`;
- `cron-rrule-adapters` — still unsupported.

## §89. General cron/RRULE import remains evidence-gated

**Decision: the three-consumer corpus does not authorize a general cron/RRULE adapter yet. LOCKED.**

The 5xFive case still uses a manually authored Decan representation while pinning the original cron string. Seshat and backward-channel do not require cron import. Therefore the current sprint strengthens the runtime's temporal core but does not prove a full import adapter.

A future cron/RRULE adapter remains likely, but must be designed as a loss-aware import profile. It may translate only exact subsets and must fail closed when source semantics cannot be preserved.

## §90. Verification status is green after the three-consumer sprint

**Decision: the Decan worktree verifies after adding the second and third consumer cases. LOCKED.**

Verification run after this sprint:

- `npm run typecheck` — passed
- `npm test -- --cache=false` — passed: 26 test files, 73 tests
- `npm run build` — passed

Repository status entering this checkpoint:

- v0.9 committed as `b76a995` (`feat: add first consumer evidence corpus`)
- current sprint changes are local pending commit at checkpoint authoring time
- Seshat and 5xFive were inspected read-only

## WHAT IS LOCKED

- The consumer corpus now covers all three portfolio consumers named in Primitive Exploration §4: 5xFive, Seshat, and Cloudflare backward-channel.
- Seshat's scan scheduling case is an elapsed sub-day recurrence from an explicit event-derived instant.
- Cloudflare backward-channel's obligation expiration case is an elapsed offset from an explicit instant-valued event, gated by an explicit verification-pending snapshot.
- Decan's new exact seams are elapsed instant offsets and elapsed sub-day recurrence.
- General `resolve` remains partial; the new seams are exact feature slices only.
- Cron/RRULE adapters remain unsupported and evidence-gated.
- No execution, Binding, authority, retry, verification, fulfillment, or obligation lifecycle moved into Decan.

## WHAT IS NOT LOCKED

- A general imported-cron or RRULE adapter.
- Any Cloudflare Agents extension API, package name, or backward-channel implementation design.
- Any Seshat runtime change, daemon lifecycle change, or dependency-check execution behavior.
- Promotion of all compound expression behavior to exact.
- Dynamic observers or live connector behavior.

## WHAT IS LOGGED

- The Seshat repo inspected was `/Users/rmichaelthomas/seshat-app`, clean at `056c859` / `v2.2.0`.
- The backward-channel evidence came from `/Users/rmichaelthomas/BusinessBackup/Business/CIA Workspace/cloudflare_contribution_inception_checkpoint_v1_0.md`.
- The exact Cloudflare backward-channel package has not yet been built; this Decan case covers the temporal expiration need from its inception checkpoint.
- The three-consumer corpus is now a better next-sprint decision tool than building adapters speculatively.

---

## UPDATED OPEN QUESTIONS (v1.0 status)

| # | Question | Status |
|---|---|---|
| 1 | Can the original portfolio trio be represented as executable Decan consumer evidence? | Resolved — v1.0 §85. |
| 2 | Does Seshat require Decan to own scan execution? | Resolved — no; Decan owns only temporal cadence candidates. |
| 3 | Does backward-channel require Decan to own obligation lifecycle? | Resolved — no; Decan owns only temporal expiration candidates. |
| 4 | Are elapsed instant offsets and elapsed sub-day recurrence implemented? | Resolved — v1.0 §88. |
| 5 | Should Decan now build a cron/RRULE adapter? | Open — still evidence-gated. |
| 6 | Can general `resolve` be promoted from partial to exact? | Open — no promotion authorized. |
| 7 | Should Decan include Binding/execution/verification behavior? | Deferred — remains downstream and outside Decan. |

---

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `decan_checkpoint_v1_0_three_consumer_corpus.md` (this document) | Canonical checkpoint | Complete, LOCKED |

---

## RESUME PROMPT (v1.0)

*Resume from `decan_checkpoint_v1_0_three_consumer_corpus` in `/Users/rmichaelthomas/Documents/Codex/decan`. v0.9 was committed as `b76a995` and established 5xFive / Banneker 1 Automations as the first real consumer evidence case. v1.0 completes the next sprint: the executable corpus now covers the three portfolio consumers named in Primitive Exploration §4 — 5xFive Cloudflare-cron-shaped automation scheduling, Seshat dependency scan scheduling, and the Cloudflare backward-channel package's obligation-expiration need. The new Seshat case pins a process-start instant, 10-second elapsed warm-up, and 30-second elapsed recurrence. The Cloudflare backward-channel case pins a resource-touch instant, verification-pending snapshot, and a 24-hour elapsed expiration candidate. Decan now supports exact elapsed offsets from explicit instant-valued references and exact elapsed second/minute/hour recurrence from a resolved instant origin; capability reporting lists `elapsed-instant-offsets` and `elapsed-subday-recurrence` as exact while keeping general `resolve` partial and `cron-rrule-adapters` unsupported. Verification after the sprint: `npm run typecheck`, `npm test -- --cache=false` (26 files / 73 tests), and `npm run build` passed. Preserve all prior invariants: explicit snapshots only, finite resolution horizons, derivation-bearing candidates, idempotent append-only Occurrences, no host/ambient time context, no live observers, no scheduler service, no Binding, no authority, no execution, no retry, no acknowledgement, no verification, no fulfillment, and no TAOS obligation lifecycle inside Decan. Next useful work is not obvious feature expansion; use the three-consumer corpus to decide whether to design a loss-aware cron/RRULE import profile, richer derivation evidence, or additional consumer cases.*
