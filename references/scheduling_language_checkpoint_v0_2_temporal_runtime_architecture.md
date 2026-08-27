# scheduling_language_checkpoint_v0_2_temporal_runtime_architecture.md

# CANONICAL CHECKPOINT DOCUMENT
## Scheduling Language / Temporal Intent Runtime
### v0.2 — temporal_runtime_architecture: canonical syntax, algebra, resolver, and Occurrence materialization

**Status:** LOCKED — EXTENDS `scheduling_language_inception_checkpoint_v0_1_language_architecture`
**Date:** August 26, 2026
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)
**Domain prefix:** `scheduling_language` (provisional; no final product name is locked)
**Session type:** Language and native-runtime architecture checkpoint
**Relationship to prior checkpoints:** Direct continuation of `scheduling_language_inception_checkpoint_v0_1_language_architecture`, preserving the original `primitive_exploration_inception_checkpoint_v1_0` as the earliest provenance. The referenced conversation is the source of truth for all decisions recorded here since the v0.1 language-architecture checkpoint. Part/§ numbering of the prior checkpoint was not available in the retrieved source and is therefore intentionally not asserted.

> *The temporal primitive preserves what was meant; its runtime explains what currently follows from that meaning.*

This checkpoint closes the design pass that began with a scheduling-language hypothesis and made the underlying primitive more exact: a compositional language for temporal intent. The prior checkpoint established that schedules, obligations, authority, execution, verification, and fulfillment must remain distinct layers. This session turns that principle into a concrete v0.1 document grammar, typed internal model, resolver, and Occurrence materialization architecture.

It does not select a final product name, specify an action language, or turn the temporal runtime into a job runner. The next discussion begins exactly at that remaining boundary.

## HOW TO READ THIS DOCUMENT

This is the canonical continuation of the v0.1 language-architecture checkpoint. It locks the semantic and runtime model needed before implementation: what canonical temporal documents express; what the AST contains; what must be rejected; what it means for an expression to be parsed, validated, resolved, or materialized; and how a resolved candidate becomes a stable Occurrence.

The document preserves a crucial distinction throughout:

```text
Source → Interpretation → TemporalExpression → Resolution → Occurrence

Authority → Execution → Verification → Obligation / Fulfillment
```

The first chain is the temporal primitive. The second chain consumes temporal artifacts but is not encoded into them.

---

# PART I — CONTINUITY: FROM SCHEDULING SYNTAX TO TEMPORAL INTENT

## §1. The primitive remains broader than a scheduler

**Decision: the canonical primitive is a TemporalExpression, from which schedules may be derived. LOCKED.**

The initial exploration named a real gap: neither cron nor RRULE can faithfully express much of ordinary human temporal meaning while preserving provenance, context, uncertainty, and consequence-bearing layers. The v0.1 checkpoint separated the broader temporal primitive from the narrower scheduling product path. This session retains that separation.

The language can express points, windows, relations, contextual boundaries, recurrence, candidate selection, conditions, exceptions, and adjustments. A scheduler, calendar, notification system, obligation system, policy engine, or agent may consume those expressions differently. No consumer gets to redefine their meaning.

Cron and RRULE remain compilation targets, not the language’s semantic ceiling. An adapter may represent an expression exactly, represent it only with explicitly accepted loss, or declare it unsupported. Silent degradation is invalid.

## §2. Participant-optimized representations remain in force

**Decision: one temporal meaning may have several representations optimized for different participants. LOCKED.**

- The human layer is natural language, dictation, automation, and readable canonical documents.
- The canonical layer is deterministic, inspectable, indentation-structured, and losslessly serializable.
- The programmatic layer is a typed SDK/CLI/agent surface over the same semantics.
- The resolver and materializer form the native temporal runtime.
- External execution adapters include cron, RRULE, calendar systems, agents, and infrastructure runtimes only where fidelity permits.

Natural language is an authoring surface, not the stored source of semantic truth. It is retained as immutable source evidence alongside the interpretation record that explains how canonical semantics were derived.

---

# PART II — V0.1 CANONICAL DOCUMENT DIRECTION

## §3. Canonical syntax is document-shaped, semantic, and shallow

**Decision: v0.1 uses a readable indentation-structured canonical document, not JSON/YAML as its native surface. LOCKED.**

JSON remains an interchange form; it is not the language’s soul. The canonical surface should be human-legible, deterministic to parse, stable to diff, and able to preserve unresolved references rather than collapsing them into timestamps.

The primary semantic block is `time`, not `schedule`. This encodes the scope boundary: schedule is one consumer of temporal meaning.

```text
intent payroll

time
  repeat every 2 weeks
  select Friday
  boundary no-later-than noon

context
  timezone from participant
```

Ordering inside an otherwise valid `time` block is surface-permissive but semantically strict: a parser normalizes equivalent compositions to the same AST. Formatting is not meaning. Semantic compatibility, dependency validity, and evaluation order are meaning.

## §4. One line is one semantic claim; bound claims use shallow semantic blocks

**Decision: one line represents one semantic claim; closely bound claims may use shallow blocks. LOCKED.**

The earlier “one line = one AST node” instinct was refined. Surface syntax does not need to mirror AST nodes, but it must make claims inspectable. Simple composition stays flat:

```text
time
  repeat every month
  select second Tuesday
  window morning
```

When a modifying claim belongs structurally to another claim, the document uses a shallow semantic block:

```text
time
  relation
    after approval
    offset 3 business days

  condition
    everyone project-members available
    for at-least 30 minutes
```

This prevents a free-floating duration from silently changing meaning. An amount of time must be attached to a role: an offset from an anchor, a required condition/window duration, a boundary, or another explicitly declared consumer binding.

## §5. Atomic and structured statements

**Decision: v0.1 distinguishes atomic statements from structured semantic blocks. LOCKED.**

Representative atomic statements:

```text
point
window
repeat
select
offset
except
boundary
before
by
until
```

Representative structured statements:

```text
relation
condition
reference
context
adjust
```

The category is parser guidance rather than a claim that every concept has only one spelling. Human-friendly shorthands are allowed when they normalize without loss. For example, `after 3 business days` may parse as `relation: after` plus an explicit business-calendar `Offset`; it does not cause the AST to lose the distinction.

## §6. Grammar sketch

**Decision: v0.1 syntax is small, declarative, and compositional; canonical syntax is intentionally not arbitrary English. LOCKED.**

The following is an implementation-facing sketch, not a frozen lexical grammar:

```ebnf
document           = intent-decl?, source-block?, time-block,
                     reference-block*, context-block*, lifecycle-block? ;

intent-decl        = "intent" identifier ;
source-block        = "source" indented(source-statement+) ;
time-block          = "time" indented(time-statement+) ;
reference-block     = "reference" identifier indented(reference-statement+) ;
context-block       = "context" indented(context-statement+) ;
lifecycle-block     = "lifecycle" indented(lifecycle-statement+) ;

time-statement      = atomic-statement | relation-block | condition-block |
                     adjustment-block | compound-block ;
atomic-statement    = point | window | repeat | selection | offset |
                     boundary | exception ;

point               = "point" point-value ;
window              = "window" window-value ;
repeat              = "repeat every" positive-integer repeat-unit repeat-mode? ;
selection           = "select" selector selection-filter? ;
offset              = "offset" duration-value duration-mode ;
boundary            = ("boundary" boundary-kind | "before" | "by" | "until") boundary-value ;
exception           = "except" predicate-reference ;

relation-block      = "relation" indented(relation-statement+) ;
relation-statement  = ("after" | "before") anchor-reference | offset ;
condition-block     = "condition" indented(condition-statement+) ;
condition-statement = predicate-reference | "for at-least" duration-value ;
adjustment-block    = "adjust" indented("when" predicate-reference,
                                         adjustment-operation+) ;

duration-mode       = "elapsed" | "calendar" | "business" ;
selector            = ordinal | "earliest" | "latest" | "next" |
                     "previous" | "nearest" ;
```

The final lexer still needs to lock identifier syntax, date/time literal syntax, named semantic window vocabulary, duration/offset units, adjustment verbs, and exact context-reference mechanics. These are implementation-level open decisions, not a reopening of the architecture.

---

# PART III — STRESS TEST RESULTS AND ALGEBRA REFINEMENT

## §7. The stress test confirms that cron and RRULE are targets, not models

**Decision: the stress set validates the native temporal runtime requirement. LOCKED.**

| Statement family | Canonical composition | cron / RRULE consequence |
|---|---|---|
| Every Friday at 9 AM | repeat + selection + point | both can be exact |
| Every second Tuesday morning | repeat + selection + semantic window | cron lossy; RRULE partial |
| Last business day of every quarter before close | repeat + selection + contextual boundary | native runtime required |
| Three business days after approval | relation + offset + business context | native runtime required |
| 72 hours after approval | relation + elapsed offset | native runtime required |
| Tomorrow afternoon / sometime this afternoon | date selection + semantic window | native runtime required |
| After sunset while office is open | contextual anchor + gate + contexts | native runtime required |
| Everyone free for 30–45 minutes; choose earliest | condition + required duration + generalized selection | native runtime required |
| Every Friday except holidays | recurrence + suppression | adapters may be partial only |
| Every Monday; holiday means Tuesday instead | recurrence + Adjustment | native runtime required |
| Before end of my workday / two hours before my flight | relation + participant/event context + offset | native runtime required |
| First time temperature drops below freezing / once prior task completes | trigger condition | parse/validate now; dynamic observation is a runtime capability |
| Every 30 days vs monthly | explicit elapsed/calendar distinction | must not be conflated |

The result is not that existing schedulers are useless. It is that their internal model is narrower: recurrence triggers and calendar rules. They cannot be allowed to rewrite richer temporal semantics during compilation.

## §8. Offset is distinct from Duration

**Decision: `Offset` and `Duration` are distinct semantic concepts. LOCKED.**

`Three business days after approval` uses an **Offset**: it shifts an anchor-derived candidate. `Everyone is available for at least 30 minutes` uses a **Duration**: it constrains the span of a condition/window. Both contain quantity and units; they do not have the same role.

Duration is therefore not an unscoped top-level promise of event length. The temporal expression may describe the amount, but the consumer or explicit relation establishes what it qualifies. This protects the boundary between temporal semantics and action/fulfillment semantics.

## §9. Selection is generalized over candidate sets

**Decision: Selection chooses one or more temporal candidates from a set by ordinal or ordering rule. LOCKED.**

`second Tuesday` is not a special recurrence primitive. It can be modeled as “generate candidates, filter to Tuesdays, choose ordinal 2.” `earliest available slot` is “generate availability candidates, choose earliest.” The shared semantic operation is selection.

Supported conceptual selectors include:

```text
ordinal: first / second / third / fourth / fifth / last
ordering: earliest / latest / next / previous / nearest
```

This makes the algebra useful beyond calendaring and prevents the grammar from acquiring a special-purpose term for every calendar pattern.

## §10. Adjustment is not Exception

**Decision: suppression and adjustment are semantically and operationally distinct. LOCKED.**

Suppression says that a candidate should not exist:

```text
every weekday
except holidays
```

On a holiday, no occurrence is generated.

Adjustment says that a candidate survives but resolves differently:

```text
repeat every week
select Monday

adjust
  when holiday
  move next business day
```

The occurrence’s logical slot remains meaningful; its resolution moves. Adjustment is a first-class temporal operation, not merely error recovery. It describes how intent responds to context change, including holiday substitution, moved anchors, office closure, and civil-time behavior.

## §11. Conditions have trigger and gate modes

**Decision: a Condition can filter existing candidates or generate a candidate from an observed transition. LOCKED.**

- A **gate** condition filters candidates already generated by another expression: “every evening when I am home.”
- A **trigger** condition generates a candidate when an observed state transition occurs: “when the package arrives” or “when the file exists.”

The surface word may remain `when`; the AST and resolver distinguish modes. v0.1 may parse and validate trigger conditions before a dynamic observer is implemented, provided its support level states that honestly.

## §12. Phase belongs to Occurrence, not TemporalExpression

**Decision: `Phase` is removed from the temporal expression algebra and belongs to materialized Occurrence lifecycle. LOCKED.**

`due`, `late`, and `overdue` describe the temporal state of a particular occurrence against explicit boundaries; they are not eternal properties of a rule. Phase must never be used to imply that execution succeeded or an obligation was fulfilled. Participant-relative impact and responsibility remain external views, not a single overloaded occurrence phase.

---

# PART IV — INVALID STATES, VALIDATOR, AND TRUTH STAGES

## §13. Validity is stricter than parseability

**Decision: expressions can parse successfully while remaining invalid, unresolved, or unsupported at a requested capability. LOCKED.**

The validator protects meaning before resolution. Core rules include:

1. Recurrence intervals must be positive; `repeat every 0 weeks` is invalid.
2. Units must match a duration/offset mode. Elapsed mode supports stable elapsed units; calendar mode supports calendar units; business mode requires an explicit business-calendar context. A “month elapsed” cannot silently mean either a calendar month or a fixed seconds count.
3. A relation requires a valid anchor; a named unresolved reference may be valid but remains unresolved.
4. A structured condition must name a predicate/evaluator or remain explicitly unresolved. Arbitrary prose is source/interpretation evidence, not executable canonical semantics.
5. A duration must be attached to a declared role; it must not silently become action duration, availability duration, or fulfillment deadline.
6. Context-required semantics must declare or be able to request their dependencies. `sunset` without location is valid-but-unresolved, not a syntactic failure.
7. Cyclic references/relations are invalid unless an explicit bounded semantics is later defined.
8. Mutually applicable adjustments without explicit precedence produce conflict; source order is not precedence.
9. Naive point expressions may remain participant-relative or floating, but a materialized instant must declare timezone/frame or deliberate floating semantics.
10. Provenance cannot contradict source evidence. A source saying “Friday afternoon” cannot create an `explicit` 3 PM claim unless 3 PM was actually supplied.
11. Open recurrence is valid as an intent, but it must not yield an infinite serialized occurrence list; resolution and materialization use finite horizons.
12. Historical materialized state is non-erasable. An intent revision cannot rewrite a past occurrence’s derivation or resolution.
13. Compilation must fail when exact representation is unavailable unless the caller explicitly requests loss and receives a provenance-bearing loss report.

## §14. Structured error taxonomy

**Decision: errors use stable categories and explain the violated semantic contract. LOCKED.**

| Category | Meaning |
|---|---|
| `syntax` | Document shape or token form is not parseable. |
| `semantic` | Parsed concepts form an impossible or illegal temporal meaning. |
| `reference` | A required anchor/reference is absent, invalid, or cyclic. |
| `context` | Valid meaning cannot resolve because required context is unavailable. |
| `ambiguity` | Multiple legitimate interpretations/candidates remain unresolved. |
| `conflict` | Valid rules produce incompatible results without declared precedence. |
| `cycle` | References or dependencies form a prohibited temporal cycle. |
| `resolution` | Resolution encountered a temporal impossibility, such as a nonexistent local time. |
| `capability` | A requested target/runtime cannot faithfully perform the operation. |
| `provenance` | Claim origin, confidence, or evidence contradicts the record. |

Errors should carry stable codes, a direct explanation, machine-readable fields, and remediation information. Examples:

```text
TEMP-SEMANTIC-004
"repeat every 0 weeks" is not valid.
Expected: a positive recurrence interval.

TEMP-CONTEXT-001
Cannot resolve "sunset" yet.
The expression is valid; location context is required by time.relation.anchor.sunset.

TEMP-CAPABILITY-002
This expression cannot compile exactly to cron.
Unsupported semantic: window "afternoon".
Native runtime: supported.
```

## §15. Four stages of truth

**Decision: Parsed → Validated → Resolved → Materialized are distinct states and must not be collapsed. LOCKED.**

| Stage | Question answered | Does not imply |
|---|---|---|
| Parsed | Can the document be structurally read? | It is meaningful or valid. |
| Validated | Is the temporal meaning internally sound? | Required context/reference exists. |
| Resolved | Given a frame and context, what candidate set currently follows? | A persistent Occurrence exists. |
| Materialized | Has a candidate been instantiated as an addressable operational occurrence? | Any action executed or fulfilled. |

Thus a statement may be parsed and valid but unresolved: “after sunset” without a location, or “after the planning meeting” while the reference remains ambiguous. That is an honest and useful state, not a failure to understand the language.

---

# PART V — TYPED INTERNAL MODEL

## §16. Semantic records retain the source-to-occurrence chain

**Decision: source, interpretation, canonical expression, resolution, and occurrence are separate typed records. LOCKED.**

```ts
type SourceKind =
  | "natural_language" | "voice" | "cli" | "api" | "agent"
  | "imported_cron" | "imported_rrule"

type SourceRecord = {
  kind: SourceKind
  value: string                 // immutable source evidence
  actor?: string
  createdAt: string
}

type ProvenanceKind =
  | "explicit" | "derived" | "inferred" | "defaulted"
  | "personalized" | "confirmed" | "imported"

type Provenance = {
  kind: ProvenanceKind
  source?: string
  confidence?: number
  evidence?: string[]
}

type InterpretationClaim = {
  path: string
  value: unknown
  provenance: Provenance
}

type UnresolvedClaim = {
  sourceText: string
  kind: "reference" | "context" | "ambiguity" | "condition"
  candidates?: unknown[]
  confidence?: number
}

type InterpretationRecord = {
  claims: InterpretationClaim[]
  unresolved: UnresolvedClaim[]
}

type IntentLifecycle = {
  status: "active" | "suspended" | "superseded" | "retired"
  effectiveFrom?: string
  effectiveUntil?: string
  version: number
  supersedes?: string
}

type TemporalIntent = {
  id: string
  source: SourceRecord
  interpretation: InterpretationRecord
  expression: TemporalExpression
  references?: ReferenceRecord[]
  context?: ContextBinding[]
  lifecycle: IntentLifecycle
}
```

Source is never normalized away. Interpretation keeps explicit, inferred, and unresolved claims visible. The expression is the canonical temporal semantics. Lifecycle versioning preserves change rather than erasing the prior rule.

## §17. TemporalExpression is a discriminated union

**Decision: the AST is explicit and compositional; surface convenience never reduces semantic specificity. LOCKED.**

```ts
type TemporalExpression =
  | PointExpression
  | WindowExpression
  | RepeatExpression
  | SelectionExpression
  | RelationExpression
  | OffsetExpression
  | DurationExpression
  | ConditionExpression
  | BoundaryExpression
  | ExceptionExpression
  | AdjustmentExpression
  | CompoundExpression

type CompoundExpression = {
  kind: "compound"
  expressions: TemporalExpression[]
}

type PointExpression = {
  kind: "point"
  value: ClockValue | DateValue | SemanticPoint
}

type SemanticPoint = {
  kind: "semantic_point"
  name: "noon" | "midnight" | "sunrise" | "sunset" | string
}

type WindowExpression = {
  kind: "window"
  value: SemanticWindow | ExplicitWindow
}

type SemanticWindow = {
  kind: "semantic_window"
  name: "morning" | "afternoon" | "evening" | "night" | string
}

type ExplicitWindow = {
  kind: "explicit_window"
  start: ClockValue
  end: ClockValue
}

type RepeatExpression = {
  kind: "repeat"
  every: number
  unit: "day" | "week" | "month" | "quarter" | "year"
  mode?: "civil" | "elapsed"
}

type SelectionExpression = {
  kind: "selection"
  filter?: TemporalFilter
  selector: TemporalSelector
}

type TemporalSelector =
  | { kind: "ordinal"; value: 1 | 2 | 3 | 4 | 5 | -1 }
  | { kind: "earliest" } | { kind: "latest" }
  | { kind: "next" } | { kind: "previous" } | { kind: "nearest" }

type TemporalFilter =
  | { kind: "weekday"; value: Weekday }
  | { kind: "business_day" }
  | { kind: "date"; value: DateValue }
  | { kind: "available_slot" }
  | { kind: "custom"; reference: string }
```

`Point` preserves semantic points such as sunset; `Window` preserves semantic windows such as morning; `Repeat` deliberately avoids cron-shaped weekday fields; `Selection` composes filters and selectors over candidate sets.

## §18. Relations, modes, conditions, boundaries, exceptions, and adjustments

```ts
type Anchor = {
  kind: "event" | "state" | "participant" | "context" | "expression"
  reference: string
}

type DurationMode = "elapsed" | "calendar" | "business"

type TemporalAmount = {
  value: number
  unit: "second" | "minute" | "hour" | "day" | "week" |
        "month" | "quarter" | "year" | "business_day" | "business_hour"
  mode: DurationMode
}

type OffsetExpression = {
  kind: "offset"
  amount: TemporalAmount
}

type DurationExpression = {
  kind: "duration"
  amount: TemporalAmount
  role?: "condition_minimum" | "window_span" | "validity_span"
}

type RelationExpression = {
  kind: "relation"
  relation: "before" | "after"
  anchor: Anchor
  offset?: OffsetExpression
}

type ConditionExpression = {
  kind: "condition"
  mode: "gate" | "trigger"
  predicate: PredicateReference
  minimumDuration?: DurationExpression
}

type BoundaryExpression = {
  kind: "boundary"
  operator: "before" | "by" | "until" | "within"
  value: ClockValue | DateValue | Anchor | TemporalAmount
}

type ExceptionExpression = {
  kind: "exception"
  predicate: PredicateReference
  effect: "suppress"
}

type AdjustmentExpression = {
  kind: "adjustment"
  when: PredicateReference
  operation:
    | { kind: "move"; direction: "forward" | "backward"; target: TemporalExpression }
    | { kind: "substitute"; target: TemporalExpression }
    | { kind: "preserve"; aspect: "local_civil_time" | "anchor_relation" }
  precedence?: number
}

type ContextBinding = {
  name: string
  reference: string
  kind: "timezone" | "locale" | "calendar" | "location" |
        "participant" | "availability" | "astronomical" | "custom"
}

type ReferenceRecord = {
  id: string
  kind: "event" | "state" | "participant" | "context" | "custom"
  source?: string
  status: "unresolved" | "resolved" | "ambiguous"
  target?: string
  provenance?: Provenance
}
```

The pure AST excludes action verbs and their authorization/outcome semantics. A `BoundaryExpression` says only that a temporal boundary exists. Whether it bounds an execution attempt or fulfillment is a decision for a consuming schedule/obligation layer.

## §19. Resolution, capabilities, and occurrence types

```ts
type ResolutionNeed = {
  kind: ContextBinding["kind"] | "reference" | "adjustment_policy"
  id?: string
  requiredBy: string
  reason: string
}

type ResolutionHorizon =
  | { kind: "count"; value: number }
  | { kind: "until"; value: ZonedDateTime }
  | { kind: "duration"; value: TemporalAmount }

type TemporalCandidate =
  | PointCandidate
  | WindowCandidate
  | ConditionalCandidate

type PointCandidate = {
  kind: "point_candidate"
  instant: ZonedDateTime | FloatingDateTime
}

type WindowCandidate = {
  kind: "window_candidate"
  semantic?: SemanticWindow
  bounds: { start: ZonedDateTime; end: ZonedDateTime }
  preferredPoint?: ZonedDateTime
}

type ConditionalCandidate = {
  kind: "conditional_candidate"
  condition: PredicateReference
  state: "awaiting_observation" | "satisfied" | "blocked"
}

type TemporalResolution = {
  id: string
  status: "resolved" | "partially_resolved" | "unresolved" | "conflicted"
  candidates: TemporalCandidate[]
  needs: ResolutionNeed[]
  assumptions: Provenance[]
  contextUsed: ContextSnapshot[]
  horizon: ResolutionHorizon
  derivation: DerivationStep[]
}

type SupportLevel = "exact" | "partial" | "pending" | "unsupported"
type CapabilityModel = {
  parse: SupportLevel
  validate: SupportLevel
  resolveStatically: SupportLevel
  resolveWithContext: SupportLevel
  observeDynamically: SupportLevel
  materialize: SupportLevel
  native: SupportLevel
  cron: SupportLevel
  rrule: SupportLevel
}
```

The support model applies the honest-compilation invariant internally. A feature may be recognized and valid before the current runtime can observe or materialize it. That status is exposed, never implied away.

---

# PART VI — EXCLUSIONS AND LAYER BOUNDARIES

## §20. What the temporal AST explicitly does not contain

**Decision: Action, Authority, Execution, Verification, Obligation, Fulfillment, and TAOS interpretation are excluded from the temporal AST. LOCKED.**

The AST may state `Friday morning`, `after approval`, `within ten minutes`, or `by noon`. It does not state what should be done, who is permitted to do it, whether it was attempted, whether the intended effect happened, who was harmed by lateness, or whether a temporal arrangement is fair or extractive.

| External layer | What it owns |
|---|---|
| Action | What operation a consumer proposes to take. |
| Authority | Who may take which action under what constraints. |
| Execution | The attempt, adapter/tool call, and its operational result. |
| Verification | Whether the claimed result actually occurred. |
| Obligation | What must become true, for whom, and its consequence semantics. |
| Fulfillment | Whether an obligation’s required state is satisfied. |
| TAOS interpretation | Experienced time, burden, protection, extraction, fairness, and participant-relative impact. |

These are not being dismissed. They are intentionally protected from conflation. A temporal occurrence can be due, late, blocked, cancelled, or closed without claiming that an action ran or an obligation was fulfilled.

---

# PART VII — RESOLVER ARCHITECTURE

## §21. The resolver produces candidates and provenance, not replacement meaning

**Decision: given a valid expression, reference frame, and available context, the resolver returns candidate temporal resolutions plus provenance without mutating the expression. LOCKED.**

```ts
type ResolveRequest = {
  expression: TemporalExpression
  referenceTime: ZonedDateTime
  context: ContextSnapshot[]
  horizon?: ResolutionHorizon
}

type ResolveResult = TemporalResolution
```

A candidate need not be a timestamp. `Friday at 9` can yield a point; `Friday morning` a window; `when everyone is available` may yield multiple discovered windows; an event-trigger condition may remain conditional until observation. The resolver must not flatten these to one forced shape.

## §22. Candidate sets and transforms

**Decision: the internal evaluation model is candidate-set transformation. LOCKED.**

```text
repeat every month
→ generate monthly candidate regions
→ select second Tuesday
→ apply morning window
```

```text
after approval
→ resolve approval anchor
→ offset 3 business days
```

```text
every Friday
→ generate Fridays
→ suppress candidates matching holiday predicate
```

This model makes the algebra compositional and explains generalized Selection. It is also the boundary at which context-dependent or trigger-producing nodes can introduce new candidates.

## §23. Resolver frame, lazy context, determinism, and horizons

**Decision: context is requested lazily, recorded by version, and produces deterministic resolution for the same complete inputs. LOCKED.**

The resolver first establishes its frame: reference time, timezone/floating-time semantics, participant, locale, and calendar system. It asks only for dependencies required by active nodes:

- `every Friday at 9 AM` may require timezone only.
- `last business day before close` requires business calendar and office hours.
- `after sunset` requires location and an astronomical provider.

If a required dependency is missing, the result returns a typed `ResolutionNeed`; it does not invent an answer.

The reproducibility rule is:

> Same expression + same context versions + same reference frame + same horizon = same resolution.

Open recurrence is never expanded infinitely. Each request specifies a finite horizon: next occurrence, next N occurrences, until a date, or a duration window.

## §24. Resolution order

**Decision: evaluation ordering is semantic and must be explicit. LOCKED.**

Current locked ordering:

```text
1. resolve anchors and required context
2. generate base candidates
3. apply relations and offsets
4. apply selection
5. apply windows and boundaries
6. apply gate conditions
7. suppress exceptions
8. apply adjustments
9. detect conflicts
10. rank/select final candidates
11. materialize only when requested
```

Ordering may receive implementation refinements, but not an unreviewed semantic reversal. For example, selecting second Tuesday and then adjusting a holiday differs from adjusting all candidates before selection.

## §25. Civil time, elapsed time, and DST

**Decision: civil/calendar semantics and elapsed semantics are distinct, and DST conflicts surface rather than being hidden. LOCKED.**

`repeat every day` plus `point 9 AM` preserves local civil time by default: it remains 9 AM local as the UTC instant changes. `repeat every 24 hours elapsed` preserves elapsed time instead. The distinction belongs in the AST and resolver.

For a nonexistent local time during a forward DST shift, the resolver returns conflict with the requested local time, date, and need for an adjustment policy. Potential policies such as move-forward, move-backward, skip, or require-confirmation are not silently chosen.

For a duplicated local time during a backward shift, the resolver returns two valid candidate instants or an explicit ambiguity. Again, selection/adjustment policy resolves ambiguity; the runtime does not fabricate certainty.

## §26. Re-resolution and derivation trails

**Decision: unmaterialized future meaning may re-resolve; materialized history remains explainable and non-erasing. LOCKED.**

If “30 minutes after the planning meeting” refers to a meeting that moves before materialization, the derived candidate moves. The expression remains identical; its current resolution changes because reference/context changed.

Every resolution carries a derivation trail sufficient for machine or human explanation:

```text
Resolved to Tuesday, September 8, 08:00–12:00 local
because repeat every month
→ selected second Tuesday
→ applied semantic window "morning"
→ resolved the window with participant locale

context used: participant-context v14, timezone America/Los_Angeles
```

The derivation is not “blockchain theater.” It is the evidence needed to explain why a candidate existed when later context changes.

---

# PART VIII — MATERIALIZER AND OCCURRENCE ENGINE

## §27. Materialization is explicit

**Decision: resolution does not imply materialization. A materializer creates an immutable, addressable Occurrence from an explicitly selected resolved candidate. LOCKED.**

```ts
type MaterializeRequest = {
  intentId: string
  resolution: TemporalResolution
  candidateId: string
  occurrenceKey?: string
}
```

The materializer commits a temporal possibility into operational state. It does not execute anything. A system may resolve candidates for display or planning without creating persistent future instances.

Materialization occurs within a finite operational horizon, such as next occurrence, next 10 occurrences, next 30 days, or when a trigger becomes active. Consumers can select their own horizon: a calendar may need ninety days; an infrastructure consumer may want twenty-four hours. The same intent remains shared.

## §28. Stable identity and derivation snapshot

**Decision: Occurrence identity is distinct from current resolution, and each materialization preserves a derivation snapshot. LOCKED.**

```ts
type Occurrence = {
  id: string
  occurrenceKey: string
  intentId: string
  intentVersion: number

  expression: TemporalExpression
  candidate: TemporalCandidate
  resolution: TemporalResolution
  expected: ExpectedTemporalState
  phase: OccurrencePhase

  derivationSnapshot: {
    expressionHash: string
    resolutionId: string
    contextUsed: ContextSnapshot[]
  }
  createdAt: string
}
```

For recurring intent, the stable key derives from parent intent plus logical recurrence slot, for example `intent:payroll / cycle:2026-W35`. If an unmaterialized future Friday changes from 3 PM to 4 PM because context changes, it remains the same logical occurrence when materialized, not a new duplicate.

An Occurrence retains both semantic expectation and current concrete answer:

```text
expected: Friday morning
resolved: 2026-08-28, 08:00–12:00, preferred 09:30
```

Downstream consumers therefore never need to reverse-engineer original meaning from a timestamp.

## §29. Occurrence phases are temporal state only

**Decision: occurrence phase describes temporal lifecycle, not action success or fulfillment. LOCKED.**

```ts
type OccurrencePhase =
  | "pending" | "ready" | "due" | "late" | "overdue"
  | "blocked" | "cancelled" | "closed"
```

`due`, `late`, and `overdue` derive from explicit temporal boundaries. The runtime must not hardcode domain policies such as “late one second after deadline” or “overdue one hour later.” A consumer/obligation layer may define those boundaries and participant-specific impact views.

`blocked` means the occurrence exists and is temporally actionable, but a currently valid external constraint prevents downstream action. It is not cancellation. Example: an externally constrained send may be blocked while traveling; the Thursday occurrence remains historically real.

`fulfilled` is intentionally absent. Whether the required outcome happened belongs to an obligation/verification layer.

## §30. Suppression, cancellation, adjustment, and rescheduling

**Decision: pre-materialization suppression/adjustment and post-materialization cancellation/rescheduling are distinct operations. LOCKED.**

- **Suppression:** an exception prevents candidate materialization. A holiday in “every weekday except holidays” produces no occurrence.
- **Cancellation:** an already existing Occurrence is terminated. “Do not do this Friday after all” records cancellation in occurrence history.
- **Adjustment:** an expression-level rule changes candidate resolution before materialization. “If holiday, move to next business day.”
- **Rescheduling:** a post-materialization occurrence revision changes one occurrence’s operational resolution while preserving logical identity and history.

```ts
type OccurrenceRevision = {
  occurrenceId: string
  priorResolutionId: string
  newResolutionId: string
  reason: string
  changedAt: string
  actor?: string
}
```

Intent revision changes the rule for future cycles: “from now on, Thursdays instead of Fridays.” Occurrence revision changes one instance: “this Friday only, move it to Monday.” They must never be merged.

## §31. Event log, idempotency, and concurrency

**Decision: occurrence history is event-based and non-erasing; materialization is idempotent and convergent. LOCKED.**

```ts
type OccurrenceEvent =
  | { kind: "materialized"; at: string }
  | { kind: "re_resolved"; at: string; resolutionId: string }
  | { kind: "ready"; at: string }
  | { kind: "due"; at: string }
  | { kind: "late"; at: string }
  | { kind: "overdue"; at: string }
  | { kind: "blocked"; at: string; reason: string }
  | { kind: "unblocked"; at: string }
  | { kind: "cancelled"; at: string; reason?: string }
  | { kind: "closed"; at: string }
```

Current phase is a projection of append-only lifecycle history. Re-running materialization for the same intent/candidate/occurrence key returns the same logical Occurrence. Persistence must enforce a uniqueness constraint equivalent to `intent_id + occurrence_key`, so concurrent retries or multiple agents converge rather than creating duplicates.

Conditional occurrences materialize only after their trigger condition yields a candidate. The event record retains what was observed and when, such as `file-exists transition observed 14:32:08`.

## §32. The twelve locked materialization rules

**Decision: the following materialization rules are locked as a single invariant set. LOCKED.**

1. Resolution does not imply materialization.
2. Materialization creates a stable logical Occurrence.
3. Occurrence identity is distinct from its current resolution.
4. Materialization is idempotent.
5. Future unmaterialized candidates may freely re-resolve.
6. Materialized resolution history is preserved.
7. Intent revisions and occurrence revisions are distinct operations.
8. Suppression prevents occurrence creation; cancellation terminates an existing occurrence.
9. Adjustment acts before materialization; rescheduling acts on an Occurrence.
10. Occurrence phase describes temporal state, not execution success or fulfillment.
11. Occurrence history is event-based and non-erasing.
12. Materialization happens against a finite operational horizon.

---

## WHAT IS LOCKED

- The primitive is a compositional `TemporalExpression`; schedule is one consumer, not the semantic container.
- Canonical documents are readable, indentation-structured, semantic rather than timestamp-first, and separate source, interpretation, expression, resolution, and occurrence.
- One line represents one semantic claim; shallow blocks carry closely bound semantics.
- The temporal algebra includes Point, Window, Repeat, Selection, Anchor, Relation, Offset, Duration, Condition, Boundary, Exception, Adjustment, and Context bindings; `Phase` belongs to Occurrence.
- Offset and Duration are distinct; generalized Selection operates on candidate sets.
- Suppression differs from Adjustment; trigger conditions differ from gate conditions.
- Parsed, Validated, Resolved, and Materialized are distinct stages of truth.
- Validator rules, structured error taxonomy, provenance constraints, explicit capability reporting, and honest loss policy are required.
- The AST excludes Action, Authority, Execution, Verification, Obligation, Fulfillment, and TAOS interpretation.
- Resolution preserves meaning and produces candidate sets, lazy context needs, deterministic output for identical inputs, finite horizons, DST conflicts, support levels, and derivation trails.
- Unmaterialized future expressions may re-resolve; materialized history remains stable and explainable.
- The materializer creates stable, idempotent, event-sourced Occurrences with separate identity, resolution, phase, revision, cancellation, and blocking semantics.
- The twelve materialization rules in §32 are locked.

## WHAT IS NOT LOCKED

- Final product/package name.
- Exact lexical grammar, identifiers, literal syntax, named semantic-window vocabulary, and adjustment-verb catalog.
- Exact v0.1 implementation sequence and which parse-valid features receive immediate dynamic-observer support.
- Adjustment policies for nonexistent/ambiguous DST local times, beyond the rule that they must be explicit.
- Precedence syntax and policy model for multiple applicable adjustments.
- The design of downstream execution interaction with an Occurrence.

## WHAT IS LOGGED

- Cron is exact only for a narrow subset; RRULE is broader but not a semantic foundation. Both remain adapters with explicit support/loss reports.
- A condition may be syntactically and semantically supported before dynamic observation exists; capability status must expose this honestly.
- Participant-relative time, impact, and responsibility remain important, but the latter two belong outside the temporal core.
- No repository implementation has been asserted or inferred in this checkpoint; this is a language/runtime architecture record.

---

## UPDATED OPEN QUESTIONS (v0.2 status)

| # | Question | Status |
|---|---|---|
| 1 | What exact lexical grammar, literals, identifier rules, and semantic-window vocabulary ship in v0.1? | Open — implementation specification. |
| 2 | Which initially grammar-recognized features resolve/materialize in v0.1 versus report runtime support pending? | Open — implementation scoping. |
| 3 | What explicit adjustment/precedence syntax resolves competing valid adjustments? | Open — resolver policy design. |
| 4 | How do downstream executors consume an Occurrence without becoming part of the temporal primitive? | Open — next session’s required opening seam. |
| 5 | What final product/package name, if any, should represent the work? | Open — no name is locked. |

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture.md` | Canonical checkpoint | Complete, LOCKED |

---

## RESUME PROMPT (v0.2)

*Resume from `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, which directly extends `scheduling_language_inception_checkpoint_v0_1_language_architecture` and preserves provenance to `primitive_exploration_inception_checkpoint_v1_0`. All earlier layer-separation decisions remain in force. v0.2 locks the canonical document direction, shallow semantic blocks, thirteen-concept temporal algebra with Offset, generalized Selection, Adjustment, suppression/adjustment and trigger/gate distinctions, validator/error taxonomy, four truth stages, a typed TypeScript temporal AST, candidate-set resolver architecture, and the materializer/Occurrence engine with twelve materialization rules. The temporal AST explicitly excludes Action, Authority, Execution, Verification, Obligation, Fulfillment, and TAOS interpretation. No implementation has been asserted in this checkpoint; the final product name and exact lexical grammar remain open. Begin exactly at the execution-boundary question: define how downstream execution interacts with an Occurrence without collapsing the temporal primitive into a job runner. Establish the contract between Occurrence and executor—subscription/claiming, authority handoff, attempt records, idempotency across the boundary, execution-result reporting, blocking/retry interaction, and verification/obligation handoff—while preserving the rule that the temporal runtime can state that an occurrence exists and is temporally ready without claiming an action was authorized, attempted, successful, verified, or fulfilled. Do not reopen the grammar, resolver, or materialization decisions unless this execution boundary exposes a direct contradiction.*
