# scheduling_language_checkpoint_v0_6_c1_closure.md

# CANONICAL CHECKPOINT DOCUMENT
## Scheduling Language / Temporal Primitive
### v0.6 — C1 Closure: grammar reconciliation and verified syntax–interchange reference

**Status:** LOCKED — EXTENDS `scheduling_language_checkpoint_v0_5_runtime_reference_conformance`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `scheduling_language` (provisional, pre-vault)  
**Session type:** Build verification and C1 closure checkpoint  
**Relationship to prior checkpoints:** Direct continuation of v0.5 (August 27, 2026), extending v0.4, v0.3, v0.2, v0.1, and `primitive_exploration_inception_checkpoint_v1_0`. All prior temporal, lexical, interchange, materialization, O1–O11, and E1–E10 decisions remain in force.

The prior checkpoint left no implementation behind; this session began by building the narrow C0–C1 reference boundary. The build exposed a more useful kind of gap than an ordinary defect: v0.4’s later canonical grammar made visible several semantics that v0.2’s earlier type sketch had not represented completely. This checkpoint resolves those seams without reopening the temporal model or crossing into validation, resolution, materialization, persistence, or execution.

## HOW TO READ THIS DOCUMENT

This checkpoint records the closure of the C1 parser/printer/interchange boundary and the evidence for the implementation now present in this workspace. It adds only the minimal grammar-to-AST reconciliations required to preserve v0.4’s frozen canonical forms faithfully. It does not add a locale fallback, custom-window policy, observer, cron/RRULE adapter, Binding, authority rule, execution behavior, retry, verification, fulfillment, validator, resolver, materializer, or Occurrence store.

---

# PART XV — C1 GRAMMAR RECONCILIATION

## §61. Filter-only selections mean all matching candidates

**Decision: `select Friday` normalizes to a weekday filter with the explicit selector `{ kind: "all" }`. LOCKED.**

v0.4’s frozen canonical examples include `select Friday`, while v0.2’s type sketch required a selector and listed only ordinal and ordering selectors. The later grammar is controlling for its concrete source form. The amendment does not reinterpret Friday as the first Friday; it makes the already implied plural candidate selection explicit in the AST. `all` means every candidate admitted by the accompanying filter. It is valid only as a selection operation and carries no execution meaning.

## §62. Source evidence has one canonical block shape

**Decision: the previously named `source-block` uses `kind`, `value`, `created-at`, and optional `actor` statements, mapping directly to `SourceRecord`. LOCKED.**

The v0.4 grammar named a source block but left `source-statement` mechanically unspecified. The canonical closure is:

```text
source
  kind natural_language
  value "Close payroll # on Friday."
  created-at "2026-08-27T06:00:00Z"
  actor "participant:42"
```

`kind`, `value`, and `created-at` are required; `actor` is optional. Values remain quoted source evidence, so comment punctuation inside a string remains data rather than starting a comment. This is provenance outside the temporal AST, preserving I-6 and the source → interpretation → expression distinction.

## §63. Adjustment substitution receives a deterministic canonical spelling

**Decision: the already typed substitute adjustment prints as `substitute point …`, `substitute window …`, or `substitute select …`. LOCKED.**

v0.2 already admits `AdjustmentExpression` operations of kind `substitute`; v0.4’s `adjustment-operation` nonterminal did not give it a concrete spelling. This closure introduces no operation beyond the earlier union. For example:

```text
adjust
  when @manual-close
  substitute point 17:00
```

As with move and preserve, an adjustment changes a temporal candidate only when its predicate applies. It never suppresses a candidate, establishes precedence from source order, triggers execution, or authorizes an effect.

---

# PART XVI — VERIFIED C0–C1 REFERENCE STATE

## §64. The reference now has one tested syntax–interchange surface

**Decision: the current library claims the `syntax-interchange` profile only, backed by C0/C1 evidence. LOCKED.**

The workspace now contains a strict TypeScript package with public O1 contracts, a hand-written UTF-8/LF indentation parser, authoring normalization, one canonical printer, RFC 8785 JSON canonicalization, SHA-256 algorithm-qualified identities, strict versioned envelopes, and a profile-scoped runtime adapter. Canonical parsing rejects authoring aliases; the authoring edge normalizes only the specified harmless forms. Nested semantic fields reject unknown keys, discriminators, enum values, and semantic `null` rather than silently ignoring them.

The C0 contract exposes no downstream execution verbs. The C1 harness covers canonicalization, parser strictness, lexical closures, semantic ordering, identity stability, JSON byte stability, fail-closed compatibility, runtime profile reporting, and portable fixture convergence.

## §65. Later temporal stages remain absent by design

**Decision: validation, resolution, materialization, durable occurrence storage, and all downstream execution concerns remain unimplemented until their ordered stage begins. LOCKED.**

This is a boundary decision rather than a claim that the types do not exist. The public contract retains the O1 type shapes so consumers cannot mistake C0/C1 scope for a different runtime architecture. The only runtime value supplied is explicitly a `Pick` limited to parse, canonicalize, print, serialize, deserialize, and capabilities. Its manifest identifies the `syntax-interchange` profile and marks later operations pending.

## WHAT IS LOCKED

- All decisions from v0.1 through v0.5 remain in force.
- `select Friday` is a filter-only selection with explicit AST selector `all`; it does not mean first Friday.
- The canonical source-evidence block maps losslessly to `SourceRecord` through required `kind`, `value`, and `created-at`, with optional `actor`.
- `AdjustmentExpression` substitution has canonical point/window/selection spellings derived from its pre-existing v0.2 union.
- C0 public API contracts and the C1 syntax/interchange implementation are present and evidenced for the `syntax-interchange` profile.
- Canonical JSON performs semantic ordering before RFC 8785 bytes and SHA-256 identities; nested known semantics fail closed.
- Later temporal stages remain type-defined but runtime-unimplemented, with no downstream execution capability.

## WHAT IS NOT LOCKED

- C2 semantic validation, C3–C5 exact resolution, C6 materialization/SQLite, and their conformance corpora.
- Locale-day-period fallback policy.
- Governance, provenance, and human-facing naming for custom semantic-window registries.
- Product-facing explanation wording and localization.
- Final product/package name.
- Any Binding, authority, execution, retry, verification, or fulfillment policy.

## WHAT IS LOGGED

- Verified implementation evidence: strict type-check passed; production build passed; Vitest reported 18 passing tests in 10 files on August 27, 2026.
- Verified absence: `src/` contains no validation, resolution, materialization, occurrences, provider, or downstream-execution module; only C0/C1 modules and type contracts are present.
- The earlier C1 grammar gaps were root-caused as omissions between v0.2’s early model sketch and v0.4’s later concrete grammar, not as a reason to introduce hidden runtime behavior.

---

## UPDATED OPEN QUESTIONS (v0.6 status)

| # | Question | Status |
|---|---|---|
| 1 | What locale-day-period fallback applies when no named locale provider is supplied? | Open — human semantic policy required before C3–C5. |
| 2 | Who governs custom semantic-window registries, their provenance, and their human-facing names? | Open — human policy required before custom-window resolution. |
| 3 | What explanation voice and localization sit above structured derivations? | Open — product-language decision. |
| 4 | What final product/package name represents this work? | Open — naming decision; the current package is private and provisional. |

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `scheduling_language_checkpoint_v0_6_c1_closure.md` | Canonical checkpoint | Complete, LOCKED |
| `docs/superpowers/plans/2026-08-27-syntax-interchange-reference.md` | Implementation plan | Active; C0/C1 slice completed |

## RESUME PROMPT (v0.6)

*Resume from `scheduling_language_checkpoint_v0_6_c1_closure`, which directly extends `scheduling_language_checkpoint_v0_5_runtime_reference_conformance`, `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`, `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, `scheduling_language_inception_checkpoint_v0_1_language_architecture`, and preserves provenance to `primitive_exploration_inception_checkpoint_v1_0`. All prior temporal, lexical, interchange, materialization, O1–O11, and E1–E10 decisions remain in force. v0.6 closes the C1 seams exposed by implementation: `select Friday` normalizes to an explicit `all` selector over a weekday filter; canonical source evidence uses required `kind`, `value`, and `created-at` plus optional `actor`; and substitute adjustments use canonical point/window/selection spellings. A private TypeScript reference package now implements and verifies C0/C1 only: public O1 types, authoring/canonical parser behavior, normalization, canonical printer, RFC 8785 bytes, SHA-256 identities, versioned fail-closed interchange, a syntax-interchange runtime adapter, and 18 passing tests (verified August 27, 2026). Validation, resolution, materialization, providers, SQLite occurrence storage, and all downstream Binding/authority/execution/retry/verification/fulfillment code remain absent by deliberate verified scope. Next implement C2 semantic validation in support-matrix order, without adding locale fallback, custom-window governance, dynamic observers, cron/RRULE adapters, product-facing explanation language, or downstream execution behavior. Four human-side questions remain open: locale fallback, custom-window registry governance/naming, explanation voice/localization, and final package name.*
