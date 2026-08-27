# scheduling_language_checkpoint_v0_5_runtime_reference_conformance.md

# CANONICAL CHECKPOINT DOCUMENT
## Scheduling Language / Temporal Primitive
### v0.5 — Runtime Reference and Conformance: one temporal truth surface, one testable implementation boundary

**Status:** LOCKED — EXTENDS `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `scheduling_language` (provisional, pre-vault)  
**Session type:** Runtime-reference, support-matrix, and conformance checkpoint  
**Relationship to prior checkpoints:** Direct continuation of `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange` (August 27, 2026), which directly extends `scheduling_language_checkpoint_v0_3_execution_boundary_architecture` (August 26, 2026), `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture` (August 26, 2026), `scheduling_language_inception_checkpoint_v0_1_language_architecture` (August 26, 2026), and preserves provenance to `primitive_exploration_inception_checkpoint_v1_0` (August 25, 2026). All earlier decisions remain in force. v0.4 continued the numbered sequence through §41; this document continues at §42.

The remaining design risk was no longer the language itself. It was that an implementation could make the correct model unobservable, hide unresolved temporal state behind exceptions, claim support it does not possess, or turn durable Occurrences into an operational queue by accident. The resolution is a deliberately narrow reference runtime: pure temporal transformation up to an explicit, idempotent materialization seam; a small durable Occurrence store after it; provider inputs made visible and versioned; and a conformance corpus that tests the claimed truth, not merely successful code paths.

## HOW TO READ THIS DOCUMENT

This checkpoint records the already locked observable runtime API O1–O11, then completes the implementation-facing work that v0.4 deferred: the minimal reference architecture, its initial support matrix, and the conformance/testing strategy. It is a build-enabling checkpoint, not an implementation claim. No production package, service, provider integration, database, parser, or test suite exists as a result of this document.

It does **not** reopen the thirteen-concept algebra, concrete grammar, canonical interchange, candidate-set resolver, twelve materialization rules, Occurrence model, or E1–E10 execution boundary. In particular, the runtime remains unable to authorize, execute, retry, claim, acknowledge, succeed, verify, or fulfill anything.

---

# PART XI — OBSERVABLE RUNTIME API SHAPE

## §42. The public runtime is a bounded temporal observation surface

**Decision: O1 — Bounded Temporal Authority. LOCKED.**

The public surface is exactly concerned with temporal source, meaning, validation, interchange, resolution, materialization, stored temporal facts, derivation, and support. Its callable shape is:

```ts
interface TemporalRuntime {
  parse(request: ParseRequest): ParseResult
  canonicalize(request: CanonicalizeRequest): CanonicalizeResult
  print(request: PrintRequest): PrintResult
  validate(request: ValidateRequest): ValidateResult
  serialize(request: SerializeRequest): SerializeResult
  deserialize(request: DeserializeRequest): DeserializeResult
  resolve(request: ResolveRequest): ResolveResult
  materialize(request: MaterializeRequest): MaterializeResult
  queryOccurrences(request: OccurrenceQuery): OccurrenceQueryResult
  getOccurrence(request: GetOccurrenceRequest): GetOccurrenceResult
  inspect(request: InspectRequest): InspectResult
  explain(request: ExplainRequest): ExplainResult
  capabilities(request?: CapabilityRequest): CapabilityResult
}
```

There is no `run`, `execute`, `dispatch`, `retry`, `ack`, `claim`, `complete`, `succeed`, `verify`, or `fulfill` method. An operation may report what temporal information exists, means, resolves to, or has materialized as. It never implies permission, an external effect, an outcome, or fulfillment.

## §43. Operation failure and temporal state answer different questions

**Decision: O2 — Domain State Is Not Transport Failure. LOCKED.**

Every operation uses the same outer result distinction:

```ts
type OperationResult<T> =
  | { ok: true; value: T; diagnostics?: Diagnostic[] }
  | { ok: false; errors: TemporalError[]; diagnostics?: Diagnostic[] }
```

`ok: false` means the requested operation could not truthfully be performed: malformed call data, syntax failure, incompatible interchange, unknown semantic fields, invalid materialization selection, or an unavailable required runtime capability.

`ok: true` may contain valid temporal states such as `invalid` from `validate`, or `unresolved`, `partially_resolved`, `ambiguous`, and `conflicted` from `resolve`. A valid declaration lacking `@approval`, a required location, or a chosen DST-fold candidate is a result to report, not an exception-shaped shadow semantics.

`TemporalError` carries the already locked category, a stable code, message, optional semantic path/source span, structured details, and an optional remediation kind. Diagnostics are non-fatal `info` or `warning` records only.

## §44. Source, canonical text, validity, and interchange remain separate stages

**Decisions: O3 — Canonical Output Is Singular; O4 — Decode Is Not Validate. LOCKED.**

`parse({ text, surface: "authoring" | "canonical" })` returns a parsed document and normalized record only when syntax succeeds. It never returns a guessed partial AST as successful output. The authoring surface may normalize specified aliases; the canonical surface accepts only v0.4 canonical syntax.

`canonicalize` accepts source and returns normalized semantics, the sole canonical document, and relevant expression/intent-version identities. `print` accepts an already normalized supported record and returns that sole document. It has no formatting switches. Therefore authoring text is canonicalized, while a semantic record is printed.

`validate` answers semantic admissibility without asking whether all declared dependencies are currently available:

```ts
type ValidateValue = {
  status: "valid" | "invalid"
  errors: TemporalError[]
  unresolvedDependencies: DeclaredDependency[]
}
```

`serialize` performs semantic normalization, the I-1–I-13 envelope, RFC 8785 canonical bytes, and algorithm-qualified identities. `deserialize` only establishes that the declared interchange version is understood and structurally safe; it does not establish semantic validity. Unknown semantic fields fail closed.

## §45. Resolution has a finite, explicit frame and stable appearance identity

**Decision: O5 — Resolution Is a Pure, Finite Temporal Evaluation. LOCKED.**

```ts
type ResolveRequest = {
  expression: TemporalExpression
  referenceTime: ZonedDateTime
  references?: ReferenceSnapshot[]
  context?: ContextSnapshot[]
  horizon: ResolutionHorizon
}

type ResolvedCandidate = {
  id: string
  value: TemporalCandidate
  derivation: DerivationStep[]
}
```

`horizon` is mandatory at the public boundary: open recurrence is never implicitly expanded forever. Inputs are snapshots, not a permission for the resolver to fetch mutable external state. Identical normalized expression, frame, snapshots, provider versions, and horizon produce the same resolution identity and candidate IDs.

`ResolvedCandidate` is the narrow candidate-identity repair. A candidate remains a temporal value; its `id` names that value's deterministic appearance in one resolution. It is neither an `occurrenceKey` nor an `Occurrence.id`, and array position is never identity.

Resolution returns `resolved`, `partially_resolved`, `unresolved`, or `conflicted`, candidates, `needs`, assumptions, context used, a derivation, and a `resolutionId`. Missing context and references remain explicit `needs`; the runtime may not invent a location, locale, reference target, calendar, or recurrence origin.

## §46. Materialization is explicit temporal persistence, never selection or execution

**Decisions: O6 — Materialization Is Temporal Persistence Only; O7 — Materialization Never Resolves Ambiguity. LOCKED.**

```ts
type MaterializeRequest = {
  intentId: string
  intentVersion: number
  resolution: TemporalResolution
  candidateId: string
  occurrenceKey?: string
}

type MaterializeValue = {
  occurrence: Occurrence
  disposition: "created" | "existing"
}
```

The materializer verifies that the identified candidate belongs to an intact supplied resolution, that the intent/version relation is coherent, and that the candidate is eligible to become an Occurrence. It rejects unresolved or conflicted materialization rather than choosing a candidate, a DST-fold side, or a hidden default. An identical logical request converges to `existing`; it is not a retry, queue action, or execution attempt.

## §47. Occurrence observation is retrospective by construction

**Decisions: O8 — Retrospective Observation Is Native; O9 — Durable Fact and Observation Projection Are Distinct. LOCKED.**

Occurrence queries accept intent identity/version, occurrence identity/key, phase, a temporal predicate, pagination, and optional `asOf`. `asOf` projects append-only temporal history at the stated observation point. A later cancellation therefore does not rewrite what was true before cancellation.

```ts
type OccurrenceView = {
  occurrence: Occurrence
  projection: { asOf: ZonedDateTime; phase: OccurrencePhase }
  history?: OccurrenceEvent[]
}
```

`getOccurrence` exists beside collection query so a caller is never forced to infer singular lookup from list filtering. Both surfaces report temporal history and phase only.

## §48. Inspection, explanation, and capability reports must expose reasons without adding meaning

**Decisions: O10 — Explanation Reports Derivation, Not Narrative Authority; O11 — Capabilities Are Granular, Expression-Aware, and Side-Effect Free. LOCKED.**

`inspect` is structural and machine-oriented: it exposes normalized structure, identities, dependencies, and feature support for an expression, resolution, or Occurrence. `explain` returns structured derivation steps, snapshots used, assumptions, and needs. A rendered explanation is optional and must be mechanically derived from that structure; it cannot say that an event was “scheduled,” action is expected, or an outcome will occur.

`capabilities` reports both operation-level support and feature-level support. It may also be asked about a particular expression and operation, because availability depends on declared provider requirements. Each feature record identifies support by operation (`exact`, `partial`, `pending`, `unsupported`), requirements, provider/version constraints, and a reason. A capability report is observation only; it never probes an external system or implies downstream executability.

---

# PART XII — MINIMAL REFERENCE IMPLEMENTATION

## §49. The reference is a deterministic library with a single durable seam

**Decision: the v0.1 reference implementation is a TypeScript library with pure core modules and an explicit Occurrence-store adapter. LOCKED.**

The reference implementation is an executable semantic oracle and conformance target, not a hosted scheduler. It ships as a library with no network listener, task runner, worker loop, binding model, or effect adapter. TypeScript remains the normative API notation and implementation language; generated declarations are part of the public contract.

```text
source / interchange
        │
        ▼
parse → normalize → validate → resolve → materialize → occurrence store
                         │          │              │             │
                         └──────────┴──────────────┴──── inspect / explain
                                             │
                                      capabilities
```

The first durable seam is materialization. Everything before it is referentially transparent for a fixed request and pinned provider inputs. Everything after it concerns only Occurrence persistence and temporal-history projection. No module depends on a downstream consumer.

## §50. Each reference module has one truth-preserving responsibility

**Decision: the reference package is partitioned by semantic stage, never by a generic “scheduler” service. LOCKED.**

| Module | Responsibility | Must not do |
|---|---|---|
| `syntax` | UTF-8/LF lexer, authoring normalizer, strict canonical parser, source spans | resolve or validate meaning |
| `model` | typed AST, normalized records, errors, identity shapes | fetch context or persist data |
| `canonical` | printer, semantic ordering, RFC 8785 bytes, hashes | preserve author formatting or guess fields |
| `validation` | structural and semantic admissibility | require current external dependencies |
| `resolution` | candidate transforms, finite horizons, derivation, `needs`, conflicts | fetch live data or materialize |
| `providers` | immutable snapshot interfaces and declared requirement checks | silently choose defaults |
| `materialization` | candidate verification, occurrence construction, idempotent append | choose a candidate or execute work |
| `occurrences` | append-only store and `asOf` projections | rewrite history or expose downstream state |
| `introspection` | inspect/explain projections | invent prose facts |
| `capabilities` | static and expression-aware support declarations | probe or mutate providers |

The source parser is a small hand-written lexer and recursive-descent parser. The grammar is intentionally shallow and indentation-structured; an opaque parser generator would make canonical spans, recovery behavior, and source/canonical distinctions harder to audit without buying semantic leverage.

## §51. Providers are versioned inputs, not hidden runtime authority

**Decision: resolution receives immutable provider snapshots through narrow ports; it never reads the network, host locale, host timezone, or host clock implicitly. LOCKED.**

The reference core depends on these ports:

```ts
interface ZoneRulesProvider { version: string; rulesFor(zone: string): ZoneRules }
interface BusinessCalendarProvider { version: string; calendar(id: string): BusinessCalendar }
interface LocaleDayPeriodProvider { version: string; periods(locale: string): LocaleDayPeriods }
interface SemanticWindowProvider { version: string; window(id: string, locale?: string): SemanticWindow }
interface ReferenceSnapshotProvider { version: string; snapshot(id: string): ReferenceSnapshot | undefined }
```

Provider data is passed in or selected by explicit IDs and versions in the resolution frame. `referenceTime` is a required request field, not an implicit call to `now`. The reference uses `Temporal` semantics and RFC 9557/IXDTF for zoned instants; its zone-rules fixture version is pinned with every conformance run. A business calendar is likewise an explicit, versioned input, never an inferred regional holiday policy.

The implementation may include fixture providers for tests and demonstrations. It does not ship a live holiday, geolocation, astronomical, availability, or dynamic-condition observer. Their absence is expressed through capabilities and resolution `needs`, never by a guessed answer.

## §52. Durable Occurrences use a small append-only storage contract

**Decision: the reference supports a process-local in-memory store and a SQLite conformance adapter implementing the same `OccurrenceStore` contract. LOCKED.**

```ts
interface OccurrenceStore {
  find(intentId: string, occurrenceKey: string): Occurrence | undefined
  appendMaterialized(occurrence: Occurrence): "created" | "existing"
  appendEvent(occurrenceId: string, event: OccurrenceEvent): void
  get(id: string): StoredOccurrence | undefined
  query(query: OccurrenceQuery): Page<StoredOccurrence>
}
```

The SQLite adapter has a uniqueness constraint equivalent to `(intent_id, occurrence_key)`, an append-only event table, and transactionally resolves concurrent equivalent materialization to one durable Occurrence. The in-memory adapter is sufficient for pure integration tests; SQLite is the durable/concurrency conformance target. No store contains Actions, Bindings, Claims, Attempts, Results, Authority Decisions, or fulfillment information.

## §53. The package reports support before it attempts work

**Decision: capability declarations are versioned data owned by the runtime, and every runtime path consults the same support registry. LOCKED.**

The support registry is a typed, versioned manifest rather than scattered conditional behavior. `parse`, `validate`, `resolve`, `materialize`, `inspect`, and `explain` all use it. A capability-pending feature is allowed to parse and validate where its source is semantically well-formed, but resolution/materialization returns an honest `capability` failure or a successful unresolved result with an explicit need, according to the request that was made.

This prevents a feature from being described as pending in `capabilities` but accidentally approximated in resolution.

---

# PART XIII — INITIAL SUPPORT MATRIX

## §54. Support is stated per feature and operation, not as a single product adjective

**Decision: the following v0.1 matrix is the reference implementation’s authoritative support claim. LOCKED.**

“Exact” means the reference preserves the locked semantics for the stated feature when all listed declared inputs are present. “Pending” means the source and semantic model may be recognized, but the reference intentionally does not produce a substituted temporal answer. “Unsupported” is reserved for an interface/version the reference does not claim to understand. The reference makes no unqualified “partial” temporal-resolution claim; any future partial adapter must enumerate its exact loss.

| Feature family | Parse / canonicalize | Validate / interchange | Resolve | Materialize / query / explain | Conditions |
|---|---|---|---|---|---|
| Canonical syntax, normalized AST, canonical JSON, identities | Exact | Exact | N/A | Inspect/explain exact | v0.4 grammar and I-1–I-13 |
| Explicit ISO date, clock, RFC 9557 zoned point, explicit interval/window | Exact | Exact | Exact | Exact | named zone rules/version supplied |
| Civil and elapsed recurrence with lifecycle origin | Exact | Exact | Exact | Exact | finite horizon and `effectiveFrom` supplied |
| Generalized selection over deterministic generated candidates | Exact | Exact | Exact | Exact | candidate set is resolvable |
| Elapsed/calendar offset from explicit or snapshot reference | Exact | Exact | Exact | Exact | reference snapshot supplied |
| Business-day offset and business recurrence | Exact | Exact | Exact | Exact | named, versioned business calendar supplied |
| Exceptions / suppression from resolved predicates or calendar snapshot | Exact | Exact | Exact | Exact | predicate result/snapshot supplied |
| Adjustment with exactly one applicable adjustment | Exact | Exact | Exact | Exact | adjustment condition resolvable |
| Competing adjustments | Exact | Exact | Exact `conflicted` result | Not materializable until conflict is resolved in declared meaning | no hidden precedence |
| Explicit named/custom window with registered versioned definition | Exact | Exact | Exact | Exact | registry entry supplied |
| Locale-aware day-period authoring and semantic window | Exact | Exact | Pending | Pending | locale provider/fallback policy is intentionally not chosen |
| Reference/context not supplied | Exact | Exact | Exact `unresolved` or `partially_resolved` result | Not materializable | includes declared `needs` |
| Dynamic trigger observation: weather, completion, free/busy, sunset, device/file transitions | Exact | Exact | Pending | Pending | no observer is included |
| Post-materialization cancellation, rescheduling, blocking, `asOf` history projection | N/A | Exact records | N/A | Exact | temporal events only |
| Imported cron/RRULE compilation adapters | Unsupported in v0.1 reference surface | Unsupported | Unsupported | Unsupported | future adapter, with loss report required |

The matrix deliberately calls out a useful asymmetry: grammar recognition and semantic validity can be exact before live resolution support exists. This is not a lesser kind of truth; it is the earlier locked staged model applied honestly.

## §55. Materialization has a narrower admissibility gate than resolution

**Decision: only a fully resolved, unconflicted, explicitly identified candidate may materialize in the v0.1 reference. LOCKED.**

Materialization does not turn pending feature support into a choice. It requires a `resolved` resolution, a matching `ResolvedCandidate.id`, all materialization invariants from §32, and a store capable of enforcing its idempotency key. `partially_resolved`, `unresolved`, and `conflicted` results remain useful for display, inspection, capability analysis, and eventual re-resolution; they do not create a durable Occurrence.

---

# PART XIV — CONFORMANCE AND TESTING STRATEGY

## §56. Conformance verifies temporal claims as a pipeline of observable evidence

**Decision: conformance is fixture-based, provider-version-pinned, and stage-aware. LOCKED.**

Each corpus case is a directory containing only portable evidence:

```text
case/
  authoring.ti                 # optional accepted authoring source
  canonical.ti                 # required canonical source where parse succeeds
  interchange.json             # required canonical interchange where portable
  frame.json                   # reference time, horizon, provider IDs/versions
  snapshots.json               # reference/context/calendar/window inputs
  expected-parse.json
  expected-validation.json
  expected-resolution.json
  expected-explanation.json
  materialization.json         # optional candidate and expected event history
  capability.json
```

Expected values are semantic records, canonical bytes/hashes, structured derivations, and typed state—not only human prose. Fixtures pin the zone-rule, calendar, locale, semantic-window, and reference-snapshot versions used to derive them. A change in any provider’s temporal data creates a new fixture version; it cannot silently reinterpret a passing historical corpus.

## §57. Seven complementary test layers prevent one kind of success from masking another

**Decision: the reference must pass all applicable layers before claiming a conformance profile. LOCKED.**

| Layer | What it proves | Representative assertions |
|---|---|---|
| C0 — API shape | public types and operation envelopes are stable | TypeScript compile checks; no forbidden public verbs |
| C1 — syntax/interchange | source and bytes are singular and fail closed | authoring→canonical; canonical parse→print; unknown semantic field rejection; RFC 8785/hash stability |
| C2 — semantic rules | individual transforms preserve locked distinctions | Offset ≠ Duration; suppression ≠ cancellation; adjustment ≠ rescheduling; horizon required |
| C3 — golden scenarios | composed declarations yield declared temporal results | fixture AST, validation, candidates, needs/conflicts, derivation |
| C4 — metamorphic properties | invariant-preserving changes do not change meaning | whitespace/alias normalization; reordered semantic-insignificant declarations; idempotent materialization |
| C5 — civil-time differential checks | zone/calendar arithmetic matches independent pinned expectations | DST gap/fold fixtures; elapsed versus calendar offsets; recurrence crossing transitions |
| C6 — durable-history checks | persistence preserves identity and prior truth | concurrent materialization convergence; event append-only behavior; `asOf` projection |

An implementation may add performance tests, fuzzing, or adapter-specific tests, but those do not replace C0–C6.

## §58. The canonical corpus covers the temporal cases that motivated the primitive

**Decision: the initial corpus includes the following required scenario families and their negative counterparts. LOCKED.**

| Scenario family | Required conformance cases |
|---|---|
| Business days | weekend crossing; named holiday crossing; calendar-version change as a new resolution input; missing calendar returns `needs` |
| Exclusions | recurring candidate suppressed before materialization; already materialized occurrence later cancelled; no conflation |
| Offsets from selected events | choose second Tuesday then apply elapsed/calendar/business offset; source-order variations print identically |
| DST gaps and folds | nonexistent local time produces declared ambiguity/error policy rather than coercion; fold exposes distinct candidates; explicit selected fold materializes exactly once |
| Windows | explicit interval; registered named/custom window; locale semantic day period pending without provider; provider version shown in explanation |
| Suppression, adjustment, conflict | exception removes candidate; one adjustment changes candidate before materialization; multiple applicable adjustments return `conflicted`, never implicit precedence |
| Overlapping rules | overlapping candidate values retain deterministic `ResolvedCandidate.id`s and derivations; duplicates do not become duplicate Occurrences |
| Retrospective queries | materialized → ready → cancelled timeline gives correct views at each `asOf` point; history is not erased |
| References/context | resolved snapshot, unresolved reference, stale/mismatched provider version, cycle, and missing location/locale all remain typed outputs |
| Recurrence origin | lifecycle `effectiveFrom` determines civil/elapsed cycle origin; no resolver-time or epoch fallback |
| Canonical round trips | authoring→canonical→parse→print; serialize→deserialize→serialize byte stability; expected distinct hashes remain distinct |
| Compatibility | unknown semantic field, unknown node discriminator, unknown enum, unsupported format version, and semantic `null` all fail closed |

For every positive fixture, the corpus supplies a nearby case that would expose the common illegal shortcut: a missing provider, alternative time mode, removed selection, reordered input, DST edge, or repeat materialization.

## §59. Property and persistence tests enforce the non-obvious invariants

**Decision: generated tests supplement, but never replace, named semantic fixtures. LOCKED.**

The property suite generates bounded horizons, dates around transition boundaries, recurrence intervals, candidate ordering permutations, and materialization races. It asserts at least:

- canonical printing is idempotent;
- deserialize/serialize preserves canonical bytes for understood records;
- identical resolution inputs produce the same resolution/candidate identities;
- a different calendar, context, reference, or provider version never silently reuses a prior resolution identity;
- materializing the same `(intentId, occurrenceKey)` repeatedly or concurrently yields one Occurrence;
- materialized history remains observable after later temporal events;
- unresolved/conflicted resolution never calls the store append path; and
- no public result contains a downstream execution-state term.

The durable adapter is tested with real SQLite transactions, including two simultaneous equivalent materialization attempts. A test that only calls the in-memory adapter cannot establish the uniqueness/concurrency half of Rule 4.

## §60. Conformance profiles make an honest smaller implementation possible

**Decision: conformance is profile-based and capability-checked, rather than all-or-nothing. LOCKED.**

| Profile | Required evidence |
|---|---|
| `syntax-interchange` | C0–C1; all canonical parser/printer/interchange cases; fail-closed compatibility |
| `temporal-core` | `syntax-interchange` plus C2–C5 for every feature marked Exact in §54 |
| `durable-occurrences` | `temporal-core` plus C6 and the SQLite concurrency suite |

A conforming implementation declares its profile and machine-readable capability manifest. It may claim only `exact` coverage demonstrated by the corresponding corpus. Features marked pending stay pending even if they can be parsed. Any later cron/RRULE or live-provider adapter must add a distinct profile and fixtures proving exactness or enumerating loss.

---

## WHAT IS LOCKED

- O1–O11: bounded temporal authority; operation failure distinct from temporal state; singular canonical output; decode distinct from validation; pure finite resolution with `ResolvedCandidate` identity; materialization as temporal persistence only; no implicit ambiguity choice; native retrospective Occurrence observation; durable fact distinct from observation projection; structured derivation-only explanation; and granular, expression-aware, side-effect-free capabilities.
- The v0.1 reference is a TypeScript library, not a scheduler service: pure stage modules terminate at an explicit idempotent materialization seam, followed by a narrow Occurrence store.
- A hand-written lexer/recursive-descent parser, normalized model, canonicalizer, validator, resolver, provider ports, materializer, store, introspection, and capability registry are the minimal reference module boundaries.
- Resolver inputs are explicit, immutable, versioned snapshots. No host clock, host locale/zone, network lookup, live holiday lookup, observer, or defaulted context may affect a result implicitly.
- An in-memory store and SQLite conformance adapter share an append-only `OccurrenceStore`; SQLite enforces `(intent_id, occurrence_key)` convergence.
- The v0.1 support matrix, including exact core features, pending locale/dynamic-observer features, conflict behavior, and out-of-scope cron/RRULE adapters.
- Fixture layout, C0–C6 test layers, required scenario families, provider-version pinning, property assertions, SQLite concurrency test, and the three conformance profiles.

## WHAT IS NOT LOCKED

- The human semantic policy for locale-day-period fallback when no named locale provider is available.
- Governance, provenance, and human-facing naming for custom semantic-window registries.
- Product-facing explanation wording, localization, and presentation beyond the structured derivation contract.
- Final product/package name.
- Any downstream Binding/executor policy—authority, claims, effects, retries, backoff, deadlines, verification, and fulfillment—which remains outside this primitive.

## WHAT IS LOGGED

- No implementation has been created, and no runtime behavior, provider, persistence database, or test result is claimed by this checkpoint.
- The support matrix deliberately narrows the first implementation rather than letting semantic features acquire unreviewed defaults. Pending means “understood but not substituted,” not “invalid.”
- Provider fixtures are part of conformance evidence because calendar, zone, locale, and custom-window data can affect temporal truth even when the code does not change.

---

## UPDATED OPEN QUESTIONS (v0.5 status)

| # | Question | Status |
|---|---|---|
| 1 | What exact lexical grammar lets humans express the locked temporal semantics naturally? | Resolved — v0.4 §§33–39. |
| 2 | What canonical serialization/interchange represents the typed temporal AST? | Resolved — v0.4 §§40–41, I-1 through I-13. |
| 3 | What stable runtime API exposes temporal work without crossing the execution boundary? | Resolved — v0.5 §§42–48, O1–O11. |
| 4 | What minimal reference implementation and conformance corpus prove the model against real temporal cases? | Resolved — v0.5 §§49–60. No implementation is built. |
| 5 | Which valid grammar-recognized features are initially exact, pending, or unsupported at each runtime capability? | Resolved — v0.5 §§54–55. |
| 6 | What locale and custom-window providers, fallbacks, and versioning rules should a reference implementation adopt? | Open — human semantic policy required before any default or live provider is introduced. |
| 7 | What executor-specific Binding policies are eventually needed? | Deferred — explicitly downstream of the temporal product. |
| 8 | What final product/package name should represent the work? | Open — naming decision. |
| 9 | What human-facing explanation voice and localization policy should sit above structured derivations? | Open — product-language decision; no effect on semantic explanation structure. |

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `scheduling_language_checkpoint_v0_5_runtime_reference_conformance.md` | Canonical checkpoint | Complete, LOCKED |

---

## RESUME PROMPT (v0.5)

*Resume from `scheduling_language_checkpoint_v0_5_runtime_reference_conformance`, which directly extends `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`, `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, `scheduling_language_inception_checkpoint_v0_1_language_architecture`, and preserves provenance to `primitive_exploration_inception_checkpoint_v1_0`. All prior temporal, lexical, interchange, materialization, and E1–E10 execution-boundary decisions remain in force. v0.5 additionally locks O1–O11 observable-runtime discipline, including the `ResolvedCandidate` identity refinement; the v0.1 TypeScript library reference architecture; explicit, versioned snapshot providers; SQLite-backed idempotent Occurrence conformance storage; the feature/operation support matrix; C0–C6 conformance layers; and the `syntax-interchange`, `temporal-core`, and `durable-occurrences` profiles. No implementation exists yet (verified: this project mirror contains only checkpoint/reference documents, no runtime package, source tree, provider implementation, store, or tests). Begin implementation from the public TypeScript types and canonical parser/printer/interchange C0–C1 harness, then build validation and exact resolver features in support-matrix order, then materialization/SQLite C6. Do not implement locale-day-period fallback, custom-window governance, dynamic observers, imported cron/RRULE adapters, downstream bindings, authority, execution, retry, verification, or fulfillment; those are pending, human-policy, or external-domain work. Before any product-facing language is added, present the remaining human-side questions: locale fallback, custom-window registry governance/naming, explanation voice/localization, and final package name.*
