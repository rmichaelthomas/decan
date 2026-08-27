# decan_checkpoint_v0_8_build_snapshot_layers.md

# CANONICAL CHECKPOINT DOCUMENT
## Decan / Scheduling Language / Temporal Primitive
### v0.8 — Build Snapshot and Evidence Layers: a working temporal core with explicit human and observer facts

**Status:** LOCKED — EXTENDS `decan_checkpoint_v0_7_human_policy_naming_roadmap_closure`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `decan`  
**Session type:** Build verification, temporal-core hardening, durable-occurrence, and passive snapshot-provider checkpoint  
**Relationship to prior checkpoints:** Direct continuation of `decan_checkpoint_v0_7_human_policy_naming_roadmap_closure` (August 27, 2026), which extends `scheduling_language_checkpoint_v0_6_c1_closure`, `scheduling_language_checkpoint_v0_5_runtime_reference_conformance`, `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`, `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, and `scheduling_language_inception_checkpoint_v0_1_language_architecture`. It preserves provenance to `primitive_exploration_inception_checkpoint_v1_0` (August 25, 2026). All prior decisions remain in force. v0.7 continued through Part XVIII / §70; this document continues at Part XIX / §71.

v0.7 closed the human-policy and naming questions, then ordered the work as C2 semantic validation, C3–C5 temporal resolution, C6 durable Occurrences, and a real-world consumer/evidence pass before any downstream execution work. This checkpoint records that the local Decan repository has now carried that implementation path through C6 and has additionally made its human inputs concrete as caller-supplied snapshots. It also records the important negative result: completing those slices did not make every expression family exactly resolvable. Decan is a working, tested temporal core whose public capability surface truthfully distinguishes exact seams from a still-partial general resolver.

## HOW TO READ THIS DOCUMENT

This is both a build-state checkpoint and a boundary checkpoint. It records what the local repository demonstrates at commit `eaf6787` on branch `c2-c6-temporal-core`; it does not turn repository code into a claim that all temporal semantics are complete. The known partiality of general `resolve()` is preserved rather than hidden. The new locale and observer helpers are passive adapters for immutable facts supplied by a caller. They are not live integrations, devices, data collectors, or an exception to the explicit/versioned-input discipline.

All v0.7 policy locks and all earlier algebra, syntax, interchange, runtime, materialization, and execution-boundary invariants remain controlling. A future implementation may extend the seams described here only by preserving those invariants and by updating the capability evidence accordingly.

---

# PART XIX — VERIFIED BUILD STATE

## §71. C2 through C6 are implemented locally, with operation-level capability truth retained

**Decision: the verified local Decan build is the C0/C1 baseline plus C2 semantic validation, C3–C5 temporal-core work, and C6 durable Occurrences. The capability surface must continue to distinguish exact operations and feature seams from a partial general resolver. LOCKED.**

At `eaf6787` the repository contains the following completed implementation slices:

- **C2:** public semantic validation with structured diagnostics and static semantic checks.
- **C3–C5:** candidate-set resolution for the implemented expression families; pinned civil-zone rules; explicit references and offsets; business-calendar and semantic-window provider seams; resolution identity and supporting property/differential evidence.
- **C6:** materialization and append-only Occurrences, with memory and SQLite stores, `asOf` projection, and transactional `(intent_id, occurrence_key)` convergence evidence.

The evidence run at this checkpoint is `npm run typecheck`, `npm test`, and `npm run build`, all passing at the recorded commit. The test suite contains 22 test files and 61 tests. Node may emit its SQLite experimental-feature warning during the SQLite tests; that warning is logged as environment output, not a test failure.

The capability manifests make the scope legible: validation, materialization, querying, and the SQLite append-only Occurrence seam are exact where their tests and interfaces support that claim; `resolve` remains **partial**. “Partial” here means plain English, not broken: Decan can resolve its implemented expression families deterministically from supplied snapshots, but it does not yet claim that every legal temporal expression and every edge case has an exact implementation.

## §72. Exact temporal meaning remains snapshot-pinned; broad resolver promotion is not authorized

**Decision: temporal truth continues to derive only from fixed, explicit, versioned inputs. The general resolver remains partial until remaining expression-family behavior, conflict semantics, and derivation evidence justify promotion. LOCKED.**

Civil-time resolution is performed from immutable zone-transition snapshots rather than a host time-zone database. Gap and fold behavior, offsets, seconds, explicit relation direction, count/until horizons, static business-calendar inputs, and selected provider-supplied semantic-window inputs are implemented and tested within their stated interfaces. Materialization accepts only a fully resolved, unconflicted, explicitly selected candidate.

This checkpoint does **not** certify broad exactness for every legal expression combination. In particular, remaining work includes complete support or explicit capability treatment for unsupported compound members, all adjustment direction semantics, all duration-horizon semantics, opaque/reference-dependent cases, and richer structured derivation. No implementation may silently discard such semantics merely to return a concrete time. Where the core cannot prove an exact outcome, it must retain partial, needs, conflict, or unresolved state as the applicable contract requires.

---

# PART XX — EXPLICIT SNAPSHOT LAYERS

## §73. Locale and observer inputs are passive, caller-supplied, immutable snapshots

**Decision: the implemented locale and observer interfaces accept explicit, immutable, versioned facts only. They may not obtain facts from host state, a network, a device, or a live subscription. LOCKED.**

`localeSnapshot()` creates explicit locale context carrying an identity, version, locale label, and declared day-period definitions. It does not read a device locale, a host locale, a time zone, location, or any ambient setting. It operationalizes v0.7 §66 without granting a fallback: a locale-aware semantic window without the necessary locale snapshot produces typed missing-context state rather than a guessed range.

`observationReference()` turns a caller-supplied boolean observation into a versioned reference snapshot with its kind and `observedAt` evidence. The implemented kinds are availability, completion, device, and external condition. Resolution can use the supplied fact to gate a candidate; it does not observe availability, completion, a device, or an external condition itself. A false supplied observation resolves to no eligible candidate; a missing required observation remains a typed need.

The repository was inspected at this checkpoint: the implementation source contains no fetch, polling, WebSocket, EventSource, Axios, or Undici integration. The only occurrences of that vocabulary are explicit scope exclusions in the consumer-evidence document and plan. This is a verified absence at `eaf6787`, not a claim about future versions.

## §74. Custom semantic windows retain provider ownership, and snapshot evidence carries their authority

**Decision: v0.7’s decentralized semantic-window policy remains unchanged in the build. A namespaced window requires the appropriate custom-provider snapshot; an unnamespaced window is resolved only through explicit local/locale provider context. LOCKED.**

Provider data remains evidence rather than ambient authority. A namespaced identity is preferred when the meaning must travel between providers. A local spelling may be valid within a declared provider scope, but the runtime must never convert it into a global default. Missing provider input remains typed `needs`; it never causes a host lookup, universal semantic table, or substitute registry entry.

The newly concrete locale snapshot seam is deliberately narrow. It carries the declared day-period definition and its version into resolution. It does not yet authorize an independently inferred locale, a global locale registry, or a claim that every locale period is fully converted into exact civil instants by every expression family.

---

# PART XXI — THE EVIDENCE-FIRST NEXT LAYERS

## §75. The next authorized layer is a real-consumer evidence pass, not automatic live integration

**Decision: the next work is to collect and replay real consumer scenarios against pinned inputs, then use that evidence to choose hardening and adapter work. Live connectors, Binding, and execution remain unapproved. LOCKED.**

The project now has enough local temporal and durability surface to test it against actual consumer needs. The next layer is an evidence corpus: representative consumer intents; their canonical expressions; complete pinned zone, calendar, semantic-window, locale, reference, and observer snapshots; expected candidates and derivations; materialization/replay expectations; and the integration limits encountered. The corpus should be executable as regression evidence, not merely described in prose.

That pass should expose whether the highest-value next work is resolver hardening, a clearer consumer interface, an inbound adapter-port contract for versioned snapshots, a package split, or a deliberately scoped adapter profile. It must not assume that a live polling connector is the answer. Any later adapter should first define the boundary at which an external fact becomes a fixed Decan snapshot, including identity, version, observed/effective time, provenance, and failure/staleness behavior. No adapter may let external change alter a past resolved result without an explicitly different snapshot identity/version and derivation.

## §76. Downstream Binding and execution remain outside the next layer

**Decision: completion-like snapshot facts do not make Decan an executor. Binding, authority, dispatch, retry, acknowledgement, verification, fulfillment, and scheduler-service behavior remain outside the temporal product. LOCKED.**

An observer snapshot can say that a caller supplied a fact at a stated time; it cannot claim that Decan caused, authorized, verified, or completed an outcome. An Occurrence remains referential, temporal, append-only, and retrospectively observable. The SQLite store is durable temporal history, not a work queue.

The only deferred policy carried forward from v0.7 is therefore still deferred: executor-specific Binding policy belongs downstream and may be revisited only after the real-consumer/evidence pass shows a genuine need. No such design, API, service, or external authorization is implied by the code recorded here.

## CONTINUING INVARIANTS AND SCOPE BOUNDARIES

The following remain controlling without amendment:

- The primitive is compositional temporal intent: `Source → Interpretation → TemporalExpression → Resolution → Occurrence`. Parsed, validated, resolved, and materialized remain distinct truth stages; resolution is finite, pure for fixed explicit inputs, candidate-set based, and derivation-bearing.
- The thirteen-concept temporal algebra, generalized Selection, Offset/Duration distinction, suppression/Adjustment distinction, trigger/gate distinction, lifecycle-based recurrence origin, twelve materialization rules, canonical syntax, I-1–I-13 interchange, O1–O11 runtime discipline, and E1–E10 execution boundary remain locked.
- Provider inputs are immutable, explicit, versioned snapshots. No host clock, host locale/zone, network lookup, live holiday lookup, geolocation, observer, or hidden default may affect temporal truth.
- An Occurrence is referential, temporal, idempotently materialized, append-only, and retrospectively observable. It is not a job, an Action, a Binding, a Claim, an Attempt, a result, or a fulfillment record.
- The temporal core does not authorize, execute, dispatch, retry, acknowledge, claim, complete, succeed, verify, or fulfill anything. Authority, execution, verification, obligation, fulfillment, and TAOS interpretation remain outside the temporal AST and downstream of the primitive.
- Cron/RRULE are not semantic foundations. Imported cron/RRULE adapters remain unsupported until a distinct later profile can prove exactness or enumerate semantic loss. Live dynamic observation remains pending; it must not be simulated by a hidden observer.

## WHAT IS LOCKED

- All decisions from `primitive_exploration_inception_checkpoint_v1_0` and v0.1 through v0.7 remain in force.
- The local Decan build has implemented C2 through C6 at `eaf6787`, with passing typecheck, test, and build evidence; broad `resolve` remains deliberately partial.
- Immutable, versioned zone, calendar, semantic-window, locale, reference, and observer snapshots are the only sources of temporal-context authority in the implemented core.
- Locale helpers never consult ambient device/host/geographic context; missing locale information remains an explicit missing-context state.
- Observer helpers adapt caller-supplied facts and never fetch, poll, subscribe, or observe external state themselves.
- Provider ownership/versioning and namespaced portability for custom semantic windows remain as locked in v0.7 §67.
- C6 SQLite Occurrences remain append-only temporal persistence with transactional convergence, not scheduling or execution.
- The next authorized layer is executable real-consumer evidence and a resulting hardening/adapter decision; it is not automatic live integration or downstream Binding work.

## WHAT IS NOT LOCKED

- Promotion of general `resolve` from partial to exact, or the precise priority/order of its remaining expression-family work.
- Specific consumer scenarios, evidence fixtures, acceptance measures, package boundaries, or adapter-port APIs to be chosen from the evidence pass.
- Live data connectors, polling/subscription protocols, freshness/retention semantics, credentials, user authority, device access, or external-system contracts.
- Cron/RRULE interoperability, dynamic observation, a global locale/window registry, or a provider default.
- Any Binding, authority, execution, retry, backoff, acknowledgement, verification, or fulfillment policy.

## WHAT IS LOGGED

- Repository state: `/Users/rmichaelthomas/Documents/Codex/decan`, branch `c2-c6-temporal-core`, commit `eaf6787` (`feat: add explicit locale and observer snapshots`). No Git remote is configured at this checkpoint.
- Supporting build commits: C2 `fa3ead4`; C3–C6 `0368b0e`; temporal evidence/hardening `e2db9c6`, `98d39c6`, `f0d9955`, and `fe76448`; explicit locale/observer snapshots `eaf6787`.
- The local evidence run for this checkpoint reports 22 test files / 61 tests passing, plus passing TypeScript typecheck and production build.
- `docs/consumer-evidence-pass.md` records the post-C6 gate and its explicit exclusions; this checkpoint makes the build status and next-layer rationale canonical.

---

## UPDATED OPEN QUESTIONS (v0.8 status)

| # | Question | Status |
|---|---|---|
| 1 | What locale-day-period fallback applies when no named locale provider is supplied? | Resolved — v0.7 §66 and v0.8 §73: only explicit, versioned locale context; no fallback. |
| 2 | Who governs custom semantic-window registries, provenance, and human-facing names? | Resolved — v0.7 §67 and v0.8 §74: provider-owned/versioned; namespaced portability preferred; no global registry. |
| 3 | What explanation voice and localization sit above structured derivations? | Resolved — v0.7 §68: structured derivation authority with presentation-only localization. |
| 4 | What final product/package name represents this work? | Resolved — v0.7 §69: Decan is the language/runtime; Proper Time is category framing. |
| 5 | Can the general resolver claim full exact coverage? | Open — no. It remains partial pending expression-family coverage, conflict semantics, and derivation evidence described in §72. |
| 6 | Which consumer scenarios and evidence criteria should drive the next hardening/adapter decision? | Open — next authorized work under §75. |
| 7 | Which executor-specific Binding policies are eventually needed? | Deferred — remains downstream; revisit only after the §75 evidence pass. |

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `decan_checkpoint_v0_8_build_snapshot_layers.md` | Canonical checkpoint | Complete, LOCKED |

---

## RESUME PROMPT (v0.8)

*Resume from `decan_checkpoint_v0_8_build_snapshot_layers` in `/Users/rmichaelthomas/Documents/Codex/decan` at commit `eaf6787` on `c2-c6-temporal-core`. It directly extends `decan_checkpoint_v0_7_human_policy_naming_roadmap_closure`, `scheduling_language_checkpoint_v0_6_c1_closure`, `scheduling_language_checkpoint_v0_5_runtime_reference_conformance`, `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`, `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, and `scheduling_language_inception_checkpoint_v0_1_language_architecture`, preserving provenance to `primitive_exploration_inception_checkpoint_v1_0`. C0/C1 plus C2 semantic validation, C3–C5 temporal-core work, and C6 SQLite-backed durable Occurrences are implemented locally. `npm run typecheck`, `npm test` (22 files / 61 tests), and `npm run build` passed at the checkpoint. Do not call broad temporal resolution exact: `resolve` is intentionally partial, while validated feature seams and durable occurrence operations state their own capability level. Begin the next authorized layer: create an executable real-consumer evidence corpus using canonical intents and complete pinned zone, calendar, semantic-window, locale, reference, and observer snapshots; capture expected candidates, derivations, materialization/replay behavior, and failures/gaps. Use the evidence to decide whether resolver hardening, a consumer interface, an inbound snapshot-adapter port, or a package split is warranted. Preserve every prior invariant: Source → Interpretation → TemporalExpression → Resolution → Occurrence; four truth stages; finite deterministic candidate-set resolution from fixed explicit inputs; thirteen-concept algebra; lifecycle recurrence; materialization rules; canonical syntax and I-1–I-13 interchange; O1–O11 runtime discipline; and E1–E10’s non-executable Occurrence boundary. Locale context may come only from explicit, versioned caller-supplied snapshots; semantic windows remain provider-owned/versioned; explanations remain structured-derivation projections with presentation-only localization; Decan is the runtime name and Proper Time is category framing. `localeSnapshot()` and `observationReference()` are passive adapters only: do not read host/device state, infer geography, use a global default, fetch, poll, subscribe, or introduce live observation. Do not add cron/RRULE adapters, a scheduler service, Binding, authority, execution, dispatch, retry, acknowledgement, verification, fulfillment, or any downstream outcome behavior.*
