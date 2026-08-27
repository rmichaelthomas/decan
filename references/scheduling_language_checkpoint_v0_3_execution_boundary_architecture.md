# scheduling_language_checkpoint_v0_3_execution_boundary_architecture.md

# CANONICAL CHECKPOINT DOCUMENT
## Scheduling Language / Temporal Primitive
### v0.3 — Execution Boundary Architecture: preserving temporal truth when downstream systems act

**Status:** LOCKED — EXTENDS `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`  
**Date:** August 26, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical partner)  
**Domain prefix:** `scheduling_language` (provisional, pre-vault)  
**Session type:** Boundary-architecture checkpoint  
**Relationship to prior checkpoints:** Direct continuation of `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, which directly extends `scheduling_language_inception_checkpoint_v0_1_language_architecture` and preserves provenance to `primitive_exploration_inception_checkpoint_v1_0`. All earlier layer-separation decisions remain in force. **UNVERIFIED — the source files for the prior checkpoints are not present in this project mirror, so their exact Part/§ numbering, dates, and open-question count must be checked against the canonical documents before this file is normalized into that sequence.**

The work in this checkpoint began with a narrow question: what happens when a temporal Occurrence meets a system that may act? The danger was not that execution could never be supported; it was that an implementation would silently answer the question by treating an Occurrence as a job. The resolution is a strict referential boundary: time can produce and expose a durable temporal fact, while downstream systems create their own records, identities, and truth claims by reference.

## HOW TO READ THIS DOCUMENT

This checkpoint locks only the architecture needed to make the execution boundary safe for implementation. It does not introduce a workflow engine, execution language, authority system, retry policy, or obligation model. The temporal algebra, shallow semantic blocks, typed temporal AST, resolver, candidate sets, materializer, Occurrence model, and twelve materialization rules from v0.2 remain unchanged.

The execution-side structures here are deliberately minimal. They protect the temporal primitive from accidental job-runner semantics, then stop. Concrete language/runtime work is the next main-product focus.

---

## PART — THE BOUNDARY: OCCURRENCE IS REFERENTIAL, NEVER EXECUTABLE

**Decision: An Occurrence is a temporal fact that a downstream system may reference; it is never a unit of work. LOCKED.**

An Occurrence may be observed as temporally ready, but it contains no action, command, handler, credentials, authority, retry policy, success criterion, verification, obligation, fulfillment, or executable payload. Its meaning remains temporal:

> Time says that this occurrence exists, and—at a stated observation point—has the relevant temporal status.

It never means “run X.” Action enters only in a downstream domain.

### Two crossings, not one

The boundary is not `Occurrence → Executor`. It has two crossings:

```text
Occurrence
    │ temporal observation
    ▼
Binding / Consumer
    │ operational interpretation
    ▼
Execution Case
```

A Binding (or Consumer) says that a particular downstream concern cares about a class or source of Occurrences. It is outside the temporal AST. The Binding is where an action-oriented concern may eventually be introduced without contaminating temporal semantics.

One Occurrence may have zero, one, or many consumers. Therefore no consumer can globally take, lock, or claim the Occurrence itself.

### Subscription is not claiming

Subscription means: “I want to observe relevant Occurrences.”

Claiming means: “I am temporarily taking processing responsibility for my downstream Execution Case arising from this Occurrence.”

Delivery acknowledgment, claim, and execution result are three separate acknowledgment families:

```text
Delivery acknowledgment  — I durably received the temporal fact for stream progress.
Claim                    — I own processing responsibility for my downstream case.
Execution result         — Here is what happened when an attempt was made.
```

A delivery acknowledgment never asserts claiming, authority, an Attempt, success, verification, or fulfillment.

---

## PART — DOWNSTREAM IDENTITY, COORDINATION, AND AUTHORITY

**Decision: Execution identity is per Occurrence × Binding, and coordination never grants authority. LOCKED.**

An Execution Case is a downstream responsibility record, not a changed form of an Occurrence. Its logical identity is derived from:

```text
Occurrence identity + Binding identity + Binding semantic version
```

Conceptually:

```text
caseId = identity(occurrenceId, bindingId, bindingVersion)
```

This supplies the first level of idempotency: repeated delivery or observation of the same ready Occurrence discovers the same logical case for that Binding rather than creating duplicate cases. Different Bindings may derive distinct cases from the same Occurrence.

### Claims are coordination, not authority

A Claim is a lease on downstream processing responsibility for an Execution Case. It may identify the claimant, claim time, lease end, and fencing token. It means only that an executor currently coordinates processing of the case.

A Claim does not mean that:

- the action is permitted;
- temporal readiness still holds;
- execution has begun or will begin; or
- the Occurrence is locked, running, claimed, or executing.

Authority is a separate downstream decision. An applicable Authority Decision is required before an Attempt may begin, but the temporal runtime neither requests nor records whether authority succeeded. This preserves the earlier trigger/gate distinction:

> Temporal readiness is a trigger condition; authority is a gate.

### Claims do not freeze temporal validity

Claiming preserves processing ownership, not temporal admissibility. If a Binding cares whether an Occurrence remains temporally valid when action begins, its executor must re-evaluate the relevant temporal facts before an Attempt. If it instead cares about readiness at observation time, that too is an explicit downstream Binding policy.

Neither interpretation belongs in the temporal AST, and a claim must never hold temporal truth static while downstream coordination is incomplete.

---

## PART — ATTEMPTS, RESULTS, RETRIES, AND BLOCKING

**Decision: An Attempt is the first truthful record of trying; operational facts remain downstream and do not manufacture temporal meaning. LOCKED.**

The following do not establish that execution was attempted:

```text
Occurrence exists
Occurrence is temporally ready
Execution Case exists
Execution Case is claimed
Authority is granted
```

Only an Attempt record truthfully means that someone tried. An Attempt references its Execution Case, has an ordinal, references the applicable Authority Decision, and carries the attempt-level idempotency key and any eventual result.

### Two-level idempotency

1. **Case idempotency:** `Occurrence + Binding + Binding version` resolves to one logical Execution Case, despite repeated delivery.
2. **Attempt idempotency:** a logical execution try has an idempotency key understood by the effect adapter where possible, so uncertain network outcomes do not needlessly duplicate the external effect.

### Retry is not recurrence

Retry creates another Attempt against the same Execution Case. It does not create, modify, suppress, reschedule, or rematerialize an Occurrence. A retry at 09:01, 09:05, and 09:20 after a 09:00 Occurrence is operational behavior, not three temporal events.

If a later time is semantically meaningful to the human declaration, it belongs in the temporal declaration and materializes as a distinct Occurrence. A flaky downstream request belongs to execution policy.

### Blocking stays downstream

Authority delays, unavailable credentials, capacity constraints, dependency failures, human approvals, or external outages may block an Execution Case. They do not make the Occurrence temporally unready. Temporal truth continues to evolve on temporal terms; downstream processing evolves on operational terms.

---

## PART — RESULTS, VERIFICATION, FULFILLMENT, AND REFERENCE DIRECTION

**Decision: Execution results report outward by reference; success, verification, and fulfillment are separate truths. LOCKED.**

The only valid direction is:

```text
Execution Result → Attempt → Execution Case → Occurrence
```

Execution results never mutate an Occurrence. An Occurrence cannot become `successful`, `completed`, `failed`, or `fulfilled`, because each would conflate a non-temporal assertion with temporal state.

Execution success is not verification. For example, a returned HTTP 200 is a result reported by an Attempt; it is not proof that the intended external state exists. Verification is a separate evidence-bearing record that may establish, disprove, or leave inconclusive the execution claim.

Fulfillment is separate again. A verified external result may contribute to an obligation system’s determination that an obligation is satisfied, but neither success nor verification automatically means fulfillment. Obligations need not originate from Occurrences; independent domains may join by reference.

```text
Occurrence → Execution Case → Attempt → Execution Result
                                      ├→ Verification
                                      └→ Obligation / Fulfillment
```

This is not a single state machine. It is a set of truth domains joined by references.

---

## PART — EXECUTION-BOUNDARY INVARIANTS

**Decision: E1–E10 are the complete v0.x boundary invariants. LOCKED.**

### E1 — Referential Boundary

An Occurrence may be referenced by downstream execution systems but never contains or acquires executable behavior.

### E2 — Independent Truth

Temporal readiness states only that an Occurrence is temporally eligible. It makes no claim about authority, attempt, success, verification, or fulfillment.

### E3 — Per-Binding Execution Identity

Execution is instantiated per Occurrence × downstream Binding, not per Occurrence globally. Therefore an Occurrence itself is never claimed.

### E4 — Coordination Is Not Authority

A Claim establishes temporary processing responsibility for an Execution Case. It conveys no authority to act.

### E5 — Retry Does Not Create Time

Retries create additional Attempts against the same Execution Case. They do not create, modify, suppress, reschedule, or rematerialize Occurrences.

### E6 — Results Never Rewrite Temporal Truth

Execution, verification, and fulfillment records reference Occurrences transitively or directly but cannot mutate an Occurrence’s temporal meaning.

### E7 — Execution Case Minimality

An Execution Case records the existence of a downstream responsibility associated with an Occurrence and Binding. It does not absorb coordination, authority, attempt, or verification state.

### E8 — Attached-Fact Lifecycle

Claims, Authority Decisions, Blocking records, and Attempts are independently recorded facts attached to an Execution Case rather than phases that mutate its semantic identity.

### E9 — Disposition Is Not Outcome

Disposing an Execution Case means downstream processing has ended for that case. It does not assert that execution succeeded, verification passed, or an obligation was fulfilled.

### E10 — Open Does Not Mean Runnable

An open Execution Case may be unauthorized, blocked, temporally inadmissible under its Binding policy, capacity-constrained, or otherwise unable to produce an Attempt.

---

## PART — MINIMAL EXECUTION CASE LIFECYCLE

**Decision: An Execution Case has only the durable lifecycle OPEN → DISPOSED; all other operational information attaches as facts. LOCKED.**

The rejected alternative was a large mutable lifecycle such as `created → available → claimed → awaiting_authority → ready_to_attempt → attempting → succeeded/failed/...`. That model would overload the Case with facts that belong to separate domains.

The minimal durable model is:

```text
OPEN
  │
  ├── Claim records may come and go
  ├── Authority Decisions may be pending, denied, or granted
  ├── Blocking records may appear or clear
  └── Attempts may be recorded
  │
  ▼
DISPOSED
```

The disposition carries only the reason downstream processing ended:

```ts
type ExecutionCaseDisposition =
  | { kind: "completed" }
  | { kind: "exhausted" }
  | { kind: "expired" }
  | { kind: "cancelled" }
  | { kind: "superseded" }
  | { kind: "declined" };
```

This is an attached-fact model:

```text
Execution Case
    ├── Claim records
    ├── Authority Decisions
    ├── Blocking records
    ├── Attempt records
    └── eventual Disposition
```

For example, the following can all be true without a state-machine contortion:

```text
Case: OPEN
Latest claim: active
Authority: pending
Attempts: 2
Latest attempt: failed, retryable
Temporal occurrence: no longer ready
```

Executor-specific decisions—maximum attempts, backoff, lease duration, authority refresh, temporal recheck, deadlines, and abandonment conditions—are execution policies attached to a Binding or executor. They are intentionally not part of the temporal language or this boundary architecture.

---

## ALTITUDE CHECK: WHERE THE PRODUCT NOW STANDS

**Decision: The architecture is late-stage and implementation has not started; the immediate boundary work is now sufficient to pivot inward. LOCKED.**

The original product remains a temporal primitive and language/runtime architecture that expresses time truthfully without quietly inheriting cron, calendar, workflow-engine, or job-runner assumptions.

What is substantially defined:

- The thirteen-concept temporal algebra, including Offset, generalized Selection, Adjustment, suppression/adjustment distinction, trigger/gate distinction, and four truth stages.
- Shallow semantic blocks and the typed temporal AST, with exact lexical grammar deliberately open.
- Validator/error taxonomy, candidate-set resolution, materialization, Occurrence, and the twelve materialization rules.
- The execution boundary necessary to ensure Occurrence can become temporally ready without becoming a job.

What has not begun:

- The reference implementation and its parser, validator, resolver, materializer, Occurrence storage/query surface, and test corpus.

The operating principle is now explicit:

> Finish only enough boundary architecture to make implementation safe, then return to the concrete language/runtime. Do not drift into designing a generalized workflow engine.

Further confidence should increasingly come from implementing and testing the temporal machine, not from continuing abstract decomposition outward.

## WHAT IS LOCKED

- All v0.2 temporal decisions remain in force and are not reopened by this checkpoint.
- Occurrence is referential and non-executable.
- The execution boundary has two crossings: Occurrence observation to Binding/Consumer, then Binding/Consumer to Execution Case.
- Subscription, delivery acknowledgment, claim, authority, Attempt, result, verification, and fulfillment are separate facts and truth domains.
- E1–E10 and the minimal attached-fact Execution Case lifecycle are locked.
- The boundary is sufficiently specified for v0.x; execution-policy elaboration is deferred.
- The project is architecture late-stage and implementation pre-start.

## WHAT IS NOT LOCKED

- Exact lexical grammar and concrete human syntax.
- Runtime API shape, canonical serialization/interchange, and reference implementation details.
- Test corpus and conformance cases for real temporal edge conditions.
- Binding/executor policies such as retry, backoff, leasing, temporal recheck, deadlines, and abandonment.
- Exact prior-checkpoint Part/§ continuity and open-question count; **UNVERIFIED — canonical predecessor files are absent from this project mirror.**

## WHAT IS LOGGED

- No direct contradiction was found between the execution boundary and the existing temporal algebra, resolver, candidate-set, materialization, or Occurrence decisions.
- This checkpoint intentionally avoids defining a generalized workflow/execution platform.

---

## UPDATED OPEN QUESTIONS (v0.3 status)

| # | Question | Status |
|---|---|---|
| 1 | What exact lexical grammar lets humans express the locked temporal semantics naturally? | Open — main-product pivot |
| 2 | What canonical serialization/interchange represents the typed temporal AST? | Open — build-enabling |
| 3 | What stable runtime API exposes validation, resolution, materialization, inspection, explanation, and Occurrence queries? | Open — build-enabling |
| 4 | What minimal reference implementation and conformance corpus should prove the model against real temporal cases? | Open — build-enabling |
| 5 | What executor-specific Binding policies are eventually needed? | Deferred — downstream of the temporal product |

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `scheduling_language_checkpoint_v0_3_execution_boundary_architecture.md` | Checkpoint | Complete, LOCKED |

---

## RESUME PROMPT (v0.3)

*Resume from `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, which directly extends `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, `scheduling_language_inception_checkpoint_v0_1_language_architecture`, and preserves provenance to `primitive_exploration_inception_checkpoint_v1_0`. All earlier temporal decisions and v0.3’s E1–E10 execution-boundary invariants are in force. The temporal primitive is architecture late-stage and implementation pre-start: its thirteen-concept algebra, shallow semantic blocks, typed temporal AST, validator/error taxonomy, candidate-set resolver, materializer/Occurrence engine, twelve materialization rules, and strict non-executable Occurrence boundary are locked. Do not reopen the algebra, resolver, candidate-set, materialization, or Occurrence decisions unless a direct implementation contradiction appears. Pivot now to the main product: concrete language/runtime work. Exact lexical grammar remains open. Resolve the build-enabling questions in order of practical leverage: a human-facing concrete syntax, canonical AST serialization/interchange, observable runtime API shape, then the minimal reference implementation and conformance/testing strategy. Test against substantive temporal cases—business days, exclusions, offsets from selected events, DST boundaries, windows, suppression, adjustments, overlapping rules, retrospective queries, and ambiguous human expectations. Keep execution policies downstream and do not drift into a generalized workflow engine.*
