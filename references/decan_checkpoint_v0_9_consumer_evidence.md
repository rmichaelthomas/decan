# decan_checkpoint_v0_9_consumer_evidence.md

# CANONICAL CHECKPOINT DOCUMENT
## Decan / Scheduling Language / Temporal Primitive
### v0.9 — Consumer Evidence: first real consumer case executable, post-C6 endpoint reached

**Status:** LOCKED — EXTENDS `decan_checkpoint_v0_8_build_snapshot_layers`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `decan`  
**Session type:** Real-consumer evidence pass, endpoint verification, and next-sprint scoping checkpoint  
**Relationship to prior checkpoints:** Direct continuation of `decan_checkpoint_v0_8_build_snapshot_layers` (August 27, 2026), which extends `decan_checkpoint_v0_7_human_policy_naming_roadmap_closure`, `scheduling_language_checkpoint_v0_6_c1_closure`, `scheduling_language_checkpoint_v0_5_runtime_reference_conformance`, `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`, `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, and `scheduling_language_inception_checkpoint_v0_1_language_architecture`, preserving provenance to `primitive_exploration_inception_checkpoint_v1_0` (August 25, 2026).

v0.8 ended with a precise next layer: do not add Binding, execution, scheduler-service behavior, live connectors, or broad resolver exactness; instead build an executable corpus of real intents, pinned snapshots, expected candidates, derivations, materialization/replay expectations, and observed gaps. This checkpoint records that the first real consumer case now exists and passes. The speculative question at the opening of this session was whether the evidence pass was merely a later nice-to-have or the real endpoint of the current Decan sprint. The answer is now locked: for the post-C6 build, the endpoint is the first actual consumer path being executable, non-partial, replayable, and gap-classified.

## HOW TO READ THIS DOCUMENT

This checkpoint is a continuation checkpoint, not a new architecture proposal. It captures the actual repository state after the first consumer pass. It records one narrowly scoped resolver hardening made necessary by the consumer case, the executable fixture added to preserve that evidence, and the next two candidate consumer cases Rob has identified from the portfolio.

All prior boundaries remain in force. Decan remains a temporal intent runtime, not an executor. 5xFive remains the owner of trigger matching, Planes action execution, receipts, queue writes, and compliance. Decan owns only the temporal interpretation and materializable occurrence candidates for the schedule trigger.

---

# PART XXII — FIRST REAL CONSUMER EVIDENCE

## §77. The first real consumer case is 5xFive / Banneker 1 Automations

**Decision: 5xFive's Banneker 1 Automations cron-trigger path is the first real Decan consumer case. It is now represented as executable corpus evidence rather than prose. LOCKED.**

The consumer source is the local 5xFive repository at `/Users/rmichaelthomas/5xfive`, inspected read-only. Its current `main` commit at this session was `04aa2e0` (`Merge pull request #10 from rmichaelthomas/feat/automations-ui`). The working tree contained one pre-existing untracked file, `5xfive_automations_ui_mockup_v4.html`, which was not modified.

The relevant 5xFive evidence:

- `worker/lib/automation-compiler.ts` defines `trigger_type` values including `cron`, stores `trigger_config`, and compiles automations into Planes.
- `test/automation-compiler.test.ts` includes a cron case with `trigger_config: { cron: "0 9 * * 1" }`.
- `docs/plans/automations-ui-phase2.md` records the Automations UI Phase 2 verification shape.
- `automations-ui-verification.md` records that the Automations UI acceptance script passed 12 checks on August 26, 2026, including compiler round-trip, API CRUD, violation rejection, surface backward compatibility, and seed program validity.

This made 5xFive the correct first consumer because it came directly from Primitive Exploration §4's named portfolio path: 5xFive uses Cloudflare Cron Triggers, Seshat schedules scans, and the Cloudflare backward-channel package would consume the format for agent obligation scheduling.

## §78. The consumer boundary is temporal-trigger materialization, not action execution

**Decision: Decan's first 5xFive consumer pass covers the schedule trigger's temporal meaning and occurrence materialization only. It does not absorb 5xFive's Planes/action/compliance/receipt responsibilities. LOCKED.**

The 5xFive automation record has a larger shape than Decan should own: trigger, conditions, actions, Planes program, compliance result, receipt trail, and execution workflow. Decan's correct consumer seam is narrower:

- source schedule: cron expression `0 9 * * 1`
- Decan interpretation: weekly civil recurrence at 09:00
- pinned context: explicit `America/New_York` timezone snapshot
- lifecycle origin: Monday, August 31, 2026
- finite horizon: first three candidates
- materialization: selected candidate becomes an idempotent Occurrence and repeated materialization converges

The fixture deliberately does not claim Decan can dispatch the automation, execute the Planes program, write 5xFive receipts, enqueue campaigns, enforce compliance, retry, verify, or fulfill outcomes.

---

# PART XXIII — IMPLEMENTATION STATUS AFTER THE EVIDENCE PASS

## §79. The executable consumer corpus now exists and has a real case

**Decision: the post-C6 evidence corpus requirement is satisfied for the first consumer path: the case is pinned, executable, derivation-bearing, replayable, and gap-classified. LOCKED.**

The repository now contains a consumer-evidence harness and a first fixture:

- `fixtures/consumer-evidence/README.md` defines the corpus rules.
- `fixtures/consumer-evidence/5xfive-banneker1-cron-trigger/authoring.ti` records the Decan authoring representation of the 5xFive cron trigger.
- `fixtures/consumer-evidence/5xfive-banneker1-cron-trigger/case.json` pins the consumer repository commit, evidence artifacts, Decan boundary, reference time, horizon, timezone snapshot, expected candidates, derivation kinds, needs, and materialization replay expectations.
- `tests/consumer_evidence/evidence-case.ts` validates case shape.
- `tests/consumer_evidence/evidence-case-shape.test.ts` rejects weak endpoint evidence, including `partially_resolved`.
- `tests/consumer_evidence/evidence-corpus.test.ts` executes every case through canonicalization, validation, resolution, candidate comparison, derivation checks, materialization, replay, and `asOf` projection.

The first executable case expects:

- August 31, 2026 at 09:00 America/New_York → `2026-08-31T13:00:00Z[America/New_York]`
- September 7, 2026 at 09:00 America/New_York → `2026-09-07T13:00:00Z[America/New_York]`
- September 14, 2026 at 09:00 America/New_York → `2026-09-14T13:00:00Z[America/New_York]`

It requires `resolutionStatus: "resolved"`, explicit empty `needs`, `resolutionDerivationKinds: ["resolution_frame"]`, `candidateDerivationKinds: ["explicit_snapshot_evaluation"]`, and materialization replay expectations. No `partially_resolved` endpoint is accepted.

## §80. The one consumer-exposed Decan gap is fixed

**Decision: Decan now composes one civil recurrence and one local clock point into concrete candidate instants under a pinned timezone snapshot. LOCKED.**

Before this pass, Decan could resolve repeats and clock points, but a compound expression containing both produced separate candidate streams: a clock candidate for the reference date plus recurrence date candidates. That was insufficient for the 5xFive cron-trigger case, whose actual need is "weekly on Monday at 09:00" as a single materializable occurrence series.

The resolver now includes a narrow composition rule: when a compound expression contains exactly one `repeat` expression and exactly one clock `point`, it produces point candidates carrying both the civil date and the resolved instant(s) for that date under the supplied timezone snapshot. The focused regression test is `tests/c3/repeating-clock.test.ts`.

The observed gap is recorded in the fixture as:

- `decan-repeat-clock-composition` — status `fixed`

No unresolved or unexplained gap remains for the first consumer path.

## §81. Verification status is green

**Decision: the current Decan worktree verifies after the consumer pass. LOCKED.**

Verification run after the evidence pass:

- `npm run typecheck` — passed
- `npm test -- --cache=false` — passed: 25 test files, 69 tests
- `npm run build` — passed

Repository status at this checkpoint:

- Base commit: `2d405f8`
- Working tree contains the consumer-evidence implementation and checkpoint work as uncommitted local changes.
- The 5xFive repository was not modified.

---

# PART XXIV — NEXT SPRINT CONSUMER CORPUS

## §82. The next sprint should extend the corpus across the three original portfolio consumers

**Decision: the next sprint push goal is a portfolio-backed consumer expansion, not more abstract resolver work. LOCKED.**

Rob identified the right next arc: the first case came from 5xFive's Cloudflare-cron-shaped Banneker 1 Automations path; the next two consumer cases should come from Seshat scan scheduling and the Cloudflare backward-channel package named in Primitive Exploration §4.

The next sprint goal should be:

> Build a three-consumer executable corpus for Decan: 5xFive Automations, Seshat scan scheduling, and Cloudflare backward-channel obligation scheduling. Each case must pin source evidence, snapshots, expected candidates, derivations, materialization/replay expectations, and observed gaps; any Decan gap exposed must be either fixed, explicitly unsupported, or deferred with a reason.

This is the right push because it tests Decan against the original portfolio promise without prematurely building a generic cron/RRULE adapter, live connector, scheduler, or execution boundary. The corpus should decide what adapter work is real.

## §83. Seshat and Cloudflare backward-channel are identified but not yet inspected

**Decision: Seshat scan scheduling and the Cloudflare backward-channel package are logged as next candidate cases; their exact fixtures are not locked until their repositories/documents are inspected. LOCKED.**

The next sprint starts with evidence discovery, not assumption:

1. Inspect Seshat's scan scheduling source, tests, and docs.
2. Identify the actual schedule expressions it uses and whether they include cron, intervals, windows, retry windows, stale-data thresholds, or scan obligations.
3. Inspect the Cloudflare backward-channel package/design from the Primitive Exploration / Cloudflare Contribution thread.
4. Determine whether backward-channel needs plain temporal candidates, obligation-context metadata around temporal candidates, or a new adapter boundary.
5. Add only the smallest Decan changes required to make real cases executable and honest.

If either case requires authority, execution, retry, verification, or fulfillment semantics, that requirement must be logged as downstream and out of Decan scope unless a later checkpoint explicitly reopens the boundary.

## §84. The likely next technical seam is imported schedule adapters, but they remain evidence-gated

**Decision: cron/RRULE import is now a likely next sprint seam, but it is not automatically authorized as a full adapter until the Seshat and backward-channel cases are inspected. LOCKED.**

The 5xFive case was represented manually as Decan authoring source while pinning the original cron string as source evidence. That is enough for the first consumer endpoint. It is not enough to claim cron import coverage.

The next sprint may authorize a narrow imported-cron adapter if the second and third cases show repeatable need. Such an adapter must be loss-aware and fail closed. It may translate exact cron subsets into Decan expressions only when semantics are fully preserved; otherwise it must emit unsupported/lossy diagnostics rather than guessing.

RRULE remains in the same category: likely, not yet authorized.

## WHAT IS LOCKED

- The post-C6 endpoint is the first executable real-consumer evidence case with pinned source, snapshots, expected candidates, derivations, materialization/replay expectations, and observed gap classification.
- 5xFive / Banneker 1 Automations is the first real consumer case.
- The 5xFive case is scoped to temporal trigger interpretation and materializable occurrence candidates only.
- The first case passes as resolved, with empty needs and no accepted partial state.
- The Decan repeat-plus-clock composition gap exposed by 5xFive is fixed and regression-tested.
- `npm run typecheck`, `npm test -- --cache=false`, and `npm run build` pass after the evidence pass.
- The next sprint should extend the executable corpus to Seshat scan scheduling and the Cloudflare backward-channel package before authorizing broader adapter work.

## WHAT IS NOT LOCKED

- The exact Seshat scan-scheduling fixture or its expected candidates.
- The exact Cloudflare backward-channel fixture or whether it needs pure temporal candidates, obligation-context metadata, or a new adapter seam.
- A general cron importer, RRULE importer, scheduler service, or live Cloudflare integration.
- Any downstream Binding, authority, execution, dispatch, retry, acknowledgement, verification, fulfillment, or TAOS obligation interpretation inside Decan.
- Promotion of general `resolve` from partial to exact.

## WHAT IS LOGGED

- Primitive Exploration §4 named the same portfolio path Rob identified here: 5xFive uses Cloudflare Cron Triggers; Seshat schedules scans; the Cloudflare backward-channel package would consume this format for agent obligation scheduling.
- The first case used 5xFive commit `04aa2e0`; Decan's local base remained `2d405f8`.
- The 5xFive worktree was not modified; its pre-existing untracked `5xfive_automations_ui_mockup_v4.html` remained untouched.
- The Decan worktree contains uncommitted local changes from the consumer-evidence pass and this checkpoint.

---

## UPDATED OPEN QUESTIONS (v0.9 status)

| # | Question | Status |
|---|---|---|
| 1 | Can the first real consumer path be represented as executable Decan evidence rather than prose? | Resolved — v0.9 §§77–81. |
| 2 | Does the 5xFive cron-trigger case expose a Decan gap? | Resolved — yes; repeat-plus-clock composition, fixed in v0.9 §80. |
| 3 | Is `partially_resolved` acceptable as the endpoint for the consumer evidence pass? | Resolved — no; the corpus rejects partial endpoints for resolved happy paths. |
| 4 | What are the next consumer cases? | Partially resolved — Seshat scan scheduling and Cloudflare backward-channel are identified; exact fixtures await inspection. |
| 5 | Should Decan now build a cron/RRULE adapter? | Open — likely next seam, but evidence-gated by the next two consumer cases. |
| 6 | Can general `resolve` be promoted from partial to exact? | Open — no promotion authorized by this checkpoint. |
| 7 | Should Decan include Binding/execution/verification behavior? | Deferred — remains downstream and outside Decan. |

---

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `decan_checkpoint_v0_9_consumer_evidence.md` (this document) | Canonical checkpoint | Complete, LOCKED |

---

## RESUME PROMPT (v0.9)

*Resume from `decan_checkpoint_v0_9_consumer_evidence` in `/Users/rmichaelthomas/Documents/Codex/decan`. It extends v0.8 and all prior Decan/scheduling-language checkpoints, preserving provenance to `primitive_exploration_inception_checkpoint_v1_0` §4. The post-C6 endpoint has been reached for the first real consumer: 5xFive / Banneker 1 Automations at local 5xFive commit `04aa2e0`, represented by an executable corpus fixture for cron `0 9 * * 1`. The fixture pins source evidence, Decan boundary, reference time, finite horizon, lifecycle origin, timezone snapshot, expected candidates, derivation kinds, explicit empty needs, and materialization/replay expectations. The one exposed Decan gap — composing one civil recurrence with one local clock point into materializable instants — is fixed and regression-tested. Verification after the pass: `npm run typecheck`, `npm test -- --cache=false` (25 files / 69 tests), and `npm run build` all pass. Decan's base commit remains `2d405f8`; the consumer-evidence changes and this checkpoint are uncommitted local work. Do not modify 5xFive; it was inspected read-only and has one pre-existing untracked mockup file. Next sprint: expand the executable corpus to the two identified portfolio consumers, Seshat scan scheduling and the Cloudflare backward-channel package from Primitive Exploration §4 / Cloudflare Contribution Build 1. First inspect their repositories/docs/vault records, then create pinned evidence cases. Add only the smallest Decan changes required to make those real cases executable and honest. Keep cron/RRULE import evidence-gated; do not add a general importer, scheduler service, live connector, Binding, authority, execution, retry, acknowledgement, verification, fulfillment, or TAOS obligation behavior unless a later checkpoint explicitly reopens that boundary. General `resolve` remains partial.*
