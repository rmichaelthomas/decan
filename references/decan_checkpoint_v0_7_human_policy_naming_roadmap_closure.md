# decan_checkpoint_v0_7_human_policy_naming_roadmap_closure.md

# CANONICAL CHECKPOINT DOCUMENT
## Decan / Scheduling Language / Temporal Primitive
### v0.7 — Human Policy, Naming, and Roadmap Closure: explicit human context without hidden temporal authority

**Status:** LOCKED — EXTENDS `scheduling_language_checkpoint_v0_6_c1_closure`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `decan` (formerly `scheduling_language`, provisional, pre-vault)  
**Session type:** Human-policy, naming, and implementation-roadmap closure checkpoint  
**Relationship to prior checkpoints:** Direct continuation of `scheduling_language_checkpoint_v0_6_c1_closure` (August 27, 2026), which extends `scheduling_language_checkpoint_v0_5_runtime_reference_conformance`, `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`, `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, and `scheduling_language_inception_checkpoint_v0_1_language_architecture`. It preserves provenance to `primitive_exploration_inception_checkpoint_v1_0` (August 25, 2026). All prior decisions remain in force. v0.6 continued through Part XVI / §65; this document continues at Part XVII / §66.

The prior implementation checkpoint deliberately left four human-side decisions open rather than allowing a default to enter the temporal core unnoticed: what locale may ground semantic day periods, who owns custom semantic windows, how structured temporal truth becomes human explanation, and what the language/runtime is called. This session resolves all four without changing the temporal algebra, canonical syntax, interchange, staged runtime model, or execution boundary. The result is a named temporal primitive with explicit human context, not a scheduler that guesses where, how, or for whom time should mean something.

## HOW TO READ THIS DOCUMENT

This checkpoint is the policy and naming closure above the C0/C1 reference. It locks the conditions under which human context may enter a resolution, the ownership and portability model for semantic windows, the one-way relationship from structured derivation to presentation, the name **Decan**, and the implementation sequence following C1. It does not add a default locale, a global custom-window registry, a narrative semantic layer, a dynamic observer, a cron/RRULE adapter, a Binding, or any authority or execution behavior.

---

# PART XVII — EXPLICIT HUMAN CONTEXT

## §66. Participant or device locale is valid only when explicit and versioned

**Decision: a participant- or device-associated locale may supply locale context only when it is explicitly available in the resolution frame and recorded with its source and version. No ambient, geographic, or universal fallback is permitted. LOCKED.**

Locale-aware day periods are participant-relative semantic input, not a universal English table and not an opportunity for the runtime to infer geography. A resolver may use a locale carried by an explicit participant or device context snapshot, together with the selected locale-day-period provider and version. The derivation must identify the context used and the provider/version that interpreted it.

If no such explicit locale context is present, or if the declared provider/version cannot supply the needed definition, the result remains an explicit `needs` or pending capability state according to the existing support matrix. The runtime may not consult host settings, an IP address, device geolocation, a system timezone, a nearest region, or a universal fallback range. This is a closure of the policy gap in v0.5 §51 and §54, not permission for any implicit I/O.

## §67. Custom semantic windows are decentralized, provider-owned, and versioned

**Decision: custom semantic-window definitions are owned and versioned by their providers; portable identities should be namespaced, while local unnamespaced identities remain valid within a provider’s declared scope. LOCKED.**

Decan does not create a central authority that governs every human semantic window. A provider owns the definition it exposes, its provenance, its version, and the scope in which it can be resolved. For interchange, sharing, and cross-provider portability, identities should be namespaced so the intended provider-owned meaning is visible. A local provider may use an unnamespaced identity when its own declared scope makes that identity unambiguous; that local spelling does not assert a global meaning.

Resolution remains exact only when the required provider snapshot and version are supplied. The provider/version and the resolved window definition remain derivation evidence. Missing, mismatched, or unknown provider data remains a typed `needs`, capability state, or compatibility failure as already prescribed; it never authorizes a substitute global registry entry.

## §68. Human explanations are layered projections over structured derivation

**Decision: Decan explanations are generated from structured derivation; their default is concise plain language, technical detail is inspectable, and localization changes presentation only. LOCKED.**

The structured derivation, snapshots, assumptions, needs, identities, and provider versions remain the authoritative explanation substrate under O10. A default explanation should make the temporal result legible in plain human language without concealing uncertainty, conflict, missing context, or the distinction between temporal state and an external outcome. An inspectable technical layer may expose the supporting derivation and exact inputs.

Localization selects wording, formatting, and display conventions for a presentation. It does not alter the normalized expression, provider-selected semantic meaning, derivation, identities, resolution, or Occurrence history. A localized explanation therefore cannot become a second semantic parser, a hidden locale fallback, or narrative authority that claims an event is scheduled, authorized, completed, verified, or fulfilled.

---

# PART XVIII — NAME AND ORDERED IMPLEMENTATION

## §69. Decan is the language and runtime name; Proper Time names the category

**Decision: Decan is the final name of the language and runtime. “Proper Time” remains the intellectual and category framing, not the package name. LOCKED.**

**Decan** names the concrete work: the readable temporal language, reference runtime, conformance profiles, and future public package surface. It carries the project forward from the provisional Scheduling Language / Temporal Primitive label without reopening any semantic distinction.

**Proper Time** remains useful for the larger intellectual claim: temporal meaning should be participant-aware, explicit, derivable, and not reduced to UTC or time-zone conversion. It is category language and conceptual framing, not the runtime/package identity.

## §70. Implementation resumes at C2, then moves through exact temporal evidence before downstream work

**Decision: the approved roadmap is C2 semantic validation; C3–C5 exact temporal-core resolution in support-matrix order; C6 durable Occurrences with SQLite; then a real-world consumer and evidence pass before choosing any hardening, adapters, consumer work, or downstream Binding work. Favor hardening plus real consumers before downstream execution. LOCKED.**

The completed C0/C1 syntax–interchange profile remains the base. The next implementation slice is C2 semantic validation: stable semantic errors and diagnostics; AST combination and mode compatibility; declared references and dependencies without requiring their current resolution; statically detectable cycles/conflicts; and recurrence/lifecycle invariants. It must preserve the distinction between semantic invalidity and valid unresolved temporal state.

After C2, implement C3–C5 only for feature families marked **Exact** in the v0.5 support matrix, in that matrix’s dependency order: explicit points/windows and named zone rules; civil and elapsed recurrence with lifecycle origin; deterministic selection; explicit or snapshot references and offsets; versioned business calendars; resolved predicates/exceptions; one applicable adjustment and explicit adjustment conflicts; and registered, versioned named/custom windows. Build golden scenarios, metamorphic properties, and civil-time differential evidence as those features become exact. Locale-aware day periods remain pending unless their explicit participant/device context and versioned provider inputs are supplied under §66; dynamic observers remain pending; cron/RRULE remain unsupported.

Then implement C6: materialization against a fully resolved, unconflicted, explicitly selected candidate; the append-only Occurrence history; `asOf` projection; and the SQLite conformance adapter with transactional `(intent_id, occurrence_key)` convergence. This remains temporal persistence, never a queue or an execution engine.

Only after C6 should Decan be exercised with real-world consumers and collected evidence. That pass decides which hardening, adapters, consumer integrations, or downstream Binding questions genuinely merit work. The present preference is to harden the temporal core and build real consumers before any downstream execution path; no Binding/authority/execution design is thereby authorized in advance.

## CONTINUING INVARIANTS AND SCOPE BOUNDARIES

The following remain controlling without amendment:

- The primitive is compositional temporal intent: `Source → Interpretation → TemporalExpression → Resolution → Occurrence`. Parsed, validated, resolved, and materialized remain distinct truth stages; resolution is finite, pure for fixed explicit inputs, candidate-set based, and derivation-bearing.
- The thirteen-concept temporal algebra, generalized Selection, Offset/Duration distinction, suppression/Adjustment distinction, trigger/gate distinction, lifecycle-based recurrence origin, twelve materialization rules, canonical syntax, I-1–I-13 interchange, O1–O11 runtime discipline, and E1–E10 execution boundary remain locked.
- Provider inputs are immutable, explicit, versioned snapshots. No host clock, host locale/zone, network lookup, live holiday lookup, geolocation, observer, or hidden default may affect temporal truth.
- An Occurrence is referential, temporal, idempotently materialized, append-only, and retrospectively observable. It is not a job, an Action, a Binding, a Claim, an Attempt, a result, or a fulfillment record.
- The temporal core does not authorize, execute, dispatch, retry, acknowledge, claim, complete, succeed, verify, or fulfill anything. Authority, execution, verification, obligation, fulfillment, and TAOS interpretation remain outside the temporal AST and downstream of the primitive.
- Cron/RRULE are not semantic foundations. Imported cron/RRULE adapters remain unsupported until a distinct later profile can prove exactness or enumerate semantic loss. Dynamic trigger observation remains pending; it must not be simulated by a hidden observer.

## WHAT IS LOCKED

- All decisions from `primitive_exploration_inception_checkpoint_v1_0` and v0.1 through v0.6 remain in force.
- An explicit participant/device locale context, source, and version may ground locale-aware interpretation; no ambient, geographic, host, or universal fallback may do so.
- Custom semantic-window providers own, version, and evidence their definitions; namespaced identities are preferred for portable interchange, and local unnamespaced identities are allowed only within their declared provider scope.
- Structured derivation is the explanation authority; concise plain language is the default projection, technical detail is inspectable, and localization is presentation-only.
- Decan is the final language/runtime name. Proper Time is retained as intellectual/category framing, not the package name.
- The implementation sequence is C2, then C3–C5 exact temporal core in support-matrix order, then C6 durable SQLite-backed Occurrences, then real-world consumer/evidence work before any choice about hardening, adapters, consumers, or downstream Binding work.
- Hardening and real consumers are favored before downstream execution work.

## WHAT IS NOT LOCKED

- Specific participant/device context schemas, locale datasets, provider implementations, or the wording of any localized explanation, provided they preserve §§66–68 and the existing explicit/versioned-input discipline.
- New adapter profiles, dynamic observers, or any cron/RRULE import/compilation work.
- The consumer set and evidence criteria to be selected after C6, or the precise hardening and adapter work that evidence may justify.
- Any Binding, authority, execution, retry, backoff, deadline, verification, or fulfillment policy. These remain downstream and require a future explicit decision.

## WHAT IS LOGGED

- v0.6’s C0/C1 reference evidence remains the current implementation baseline: the `syntax-interchange` profile only, with later temporal stages deliberately runtime-unimplemented at that checkpoint.
- The four human-side questions carried by v0.6 are resolved here without converting human context into implicit runtime authority.
- The transition from `scheduling_language` to `decan` is a naming closure and domain-prefix update; it does not erase the historical document lineage.

---

## UPDATED OPEN QUESTIONS (v0.7 status)

| # | Question | Status |
|---|---|---|
| 1 | What locale-day-period fallback applies when no named locale provider is supplied? | Resolved — v0.7 §66: only explicit participant/device locale context with source and version is valid; no ambient/geographic/universal fallback. |
| 2 | Who governs custom semantic-window registries, provenance, and human-facing names? | Resolved — v0.7 §67: decentralized provider ownership/versioning; namespaced identities preferred for portability, local unnamespaced identities allowed in declared scope. |
| 3 | What explanation voice and localization sit above structured derivations? | Resolved — v0.7 §68: concise plain projection by default, technical detail inspectable, localization presentation-only. |
| 4 | What final product/package name represents this work? | Resolved — v0.7 §69: Decan is the language/runtime name; Proper Time is category framing. |
| 5 | Which executor-specific Binding policies are eventually needed? | Deferred — remains downstream of the temporal product; revisit only after the C6 real-world consumer/evidence pass. |

No active open human-policy question blocks C2 semantic validation.

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `decan_checkpoint_v0_7_human_policy_naming_roadmap_closure.md` | Canonical checkpoint | Complete, LOCKED |

---

## RESUME PROMPT (v0.7)

*Begin at C2 semantic validation. Resume from `decan_checkpoint_v0_7_human_policy_naming_roadmap_closure`, which directly extends `scheduling_language_checkpoint_v0_6_c1_closure`, `scheduling_language_checkpoint_v0_5_runtime_reference_conformance`, `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`, `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, and `scheduling_language_inception_checkpoint_v0_1_language_architecture`, preserving provenance to `primitive_exploration_inception_checkpoint_v1_0`. All prior invariants remain in force: temporal intent and the Source → Interpretation → TemporalExpression → Resolution → Occurrence chain; the thirteen-concept algebra; four truth stages; deterministic finite candidate-set resolution; lifecycle-based recurrence; the twelve materialization rules; strict canonical syntax and I-1–I-13 interchange; O1–O11 bounded temporal observation; and E1–E10’s strict non-executable Occurrence boundary. C0/C1 are the verified syntax–interchange baseline; validation, resolution, materialization, and durable occurrences are still deliberately unimplemented in that baseline. Implement C2’s semantic validator and public `validate()` behavior: stable semantic error codes and structured diagnostics; AST combination and mode compatibility; declared references/dependencies without requiring them to resolve now; statically detectable cycles/conflicts; and recurrence/lifecycle invariants. Preserve the distinction between `ok: false` operation failure and `ok: true` invalid/unresolved/partially-resolved/conflicted temporal state. §66 now permits locale-aware resolution only from explicit, source-recorded, versioned participant/device locale context and an explicit provider snapshot; never use host locale/zone/clock, geography, IP, geolocation, a universal day-period range, or any ambient fallback. §67 makes semantic windows provider-owned and versioned, with namespaced portable identities preferred and local unnamespaced identities valid only in declared provider scope. §68 makes structured derivation authoritative, plain language the default projection, technical detail inspectable, and localization presentation-only. The final name is Decan; Proper Time is category framing, not package identity. After C2, implement C3–C5 only for support-matrix Exact features in dependency order, then C6 materialization and append-only Occurrences with real SQLite concurrency/as-of evidence. After C6, conduct a real-world consumer/evidence pass; favor hardening plus real consumers before deciding any adapter, consumer, Binding, authority, execution, retry, verification, or fulfillment work. Do not add dynamic observers, cron/RRULE adapters, hidden provider defaults, global window governance, a scheduler service, or downstream execution behavior.*
