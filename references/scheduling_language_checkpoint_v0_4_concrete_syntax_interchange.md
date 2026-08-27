# scheduling_language_checkpoint_v0_4_concrete_syntax_interchange.md

# CANONICAL CHECKPOINT DOCUMENT
## Scheduling Language / Temporal Primitive
### v0.4 — Concrete Syntax and Interchange: one readable source, one normalized semantic form

**Status:** LOCKED — EXTENDS `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `scheduling_language` (provisional, pre-vault)  
**Session type:** Concrete-language and canonical-interchange checkpoint  
**Relationship to prior checkpoints:** Direct continuation of `scheduling_language_checkpoint_v0_3_execution_boundary_architecture` (August 26, 2026), which directly extends `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture` (August 26, 2026), `scheduling_language_inception_checkpoint_v0_1_language_architecture` (August 26, 2026), and preserves provenance to `primitive_exploration_inception_checkpoint_v1_0` (August 25, 2026). All earlier decisions remain in force. v0.3 used unnumbered Parts; this document continues the numbered semantic sequence from v0.2 §32 without changing any v0.3 decision.

The opening question was deliberately practical: can the temporal primitive have a human-facing source language without reintroducing ambiguity, hidden precedence, culture-specific time assumptions, or a second informal machine format? The answer is a two-surface discipline. Authors may be met with humane input; the temporal machine is met only with one normalized semantic tree, printed in one canonical document form and serialized in one explicit canonical JSON form.

## HOW TO READ THIS DOCUMENT

This checkpoint closes the concrete lexical grammar and the AST/interchange contract required before a parser and durable intent records can be implemented. It makes four future-proofing amendments: RFC 9557/IXDTF for resolved zoned instants; locale-aware day-period authoring lexemes; explicit ISO-calendar meaning for a bare date; and reserved punctuation for future syntax.

It does **not** reopen the thirteen-concept algebra, shallow semantic blocks, typed AST architecture, validator/error taxonomy, candidate-set resolver, materializer/Occurrence engine, twelve materialization rules, or v0.3's E1–E10 execution-boundary invariants. It introduces no execution syntax or workflow policy. The next design subject begins exactly at the observable runtime API shape, then proceeds to the minimal reference implementation and conformance/testing strategy.

---

# PART IX — CONCRETE HUMAN SOURCE

## §33. The surface contract has a tolerant authoring edge and one strict canonical output

**Decision: authoring input may be forgiving, but semantic output is singular. LOCKED.**

The language has two intentionally different parser-facing surfaces:

```text
authoring text
  → authoring parser (accepts specified aliases and harmless formatting variation)
  → normalized semantic AST
  → canonical printer
  → canonical document

canonical document
  → strict canonical parser
  → the same normalized semantic AST
```

The authoring parser may accept an unambiguous convenience spelling. The canonical parser accepts only the canonical grammar. The printer never reproduces incidental author formatting, aliases, casing, comments, blank lines, or source order where order has no semantic meaning.

Examples:

```text
authoring input                 canonical document
-------------                   ------------------
point 9am                       point 09:00
point 9 AM                      point 09:00
repeat every 1 week             repeat every week
repeat every 2 week             repeat every 2 weeks
boundary no later than noon     boundary by noon
```

This is not a lossy semantic transformation. It is normalization of equivalent surface spellings. Natural-language interpretation remains a separate source-and-interpretation concern; the authoring parser is not licensed to silently choose between meanings.

The invariant is:

> Equivalent accepted source forms produce the same normalized AST, canonical document, canonical JSON, and semantic expression identity.

### Canonical document mechanics

```text
encoding       UTF-8
line endings   LF canonically; CRLF accepted and normalized at the authoring edge
indentation    exactly two ASCII spaces per level
tabs           invalid
keywords       lowercase
comments       # through end of line; semantically insignificant
blank lines    semantically insignificant
strings        double-quoted, with standard escapes
```

Weekday names are canonicalized for document readability (`Monday`, `Tuesday`); machine interchange uses lower-case ASCII enum values. Canonical semantic-window tokens are lower-case (`morning`, `afternoon`, `evening`, `night`).

## §34. References have stable visible syntax; identity is deliberately ASCII-stable

**Decision: an external temporal reference is written with `@`, and its identity is ASCII-stable kebab/dotted text. LOCKED.**

Canonical reference syntax is:

```text
@[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*
```

Examples:

```text
@approval
@planning-meeting
@project.members
@participant.timezone
@company.business-calendar
```

`@` separates an externally named reference from an unqualified semantic term. Thus `after sunset` is a semantic-point reading only where that grammar permits it, while `after @sunset` unambiguously names an external event or state. Machine identity does not use Unicode identifiers, mixed scripts, invisible characters, or localized display labels. Human labels may be localized separately; identity and presentation are not the same string.

Reference declarations use the identifier without the sigil; temporal use always includes the sigil:

```text
reference approval
  kind event
  source "workflow:approval"

time
  relation
    after @approval
    offset 3 business days
```

An undeclared reference is syntactically valid. It may remain semantically unresolved and must surface as such through the already locked truth stages; declaration is not a prerequisite for honest reference-bearing source.

## §35. Literals retain their temporal type instead of collapsing to timestamps

**Decision: dates, clocks, semantic points, windows, and resolved zoned instants remain distinct literal categories. LOCKED.**

### Dates

```text
2026-08-28
```

A bare `YYYY-MM-DD` means an ISO-calendar date (`iso8601`), not a locale-shaped date and not a floating timestamp. Forms such as `8/28/26` do not belong in canonical source; they may be interpreted upstream as natural language with evidence preserved. Other calendar systems remain extensible through typed context and future explicit syntax rather than being guessed from a bare date.

### Clock times and semantic points

Canonical clock forms are 24-hour local civil clocks:

```text
00:00
09:00
09:30
23:59
09:30:15
```

The authoring edge may accept `9am` or `9 AM`; the printer emits `09:00`. A clock is not a fixed instant.

Semantic points stay semantic:

```text
point noon
point midnight
point sunrise
point sunset
```

`noon`, `sunrise`, and similar terms are not replaced by their current numeric resolution. Their type, required context, and derivation remain visible.

### Windows and day periods

Explicit windows retain their stated bounds:

```text
window 08:00 to 12:00
```

Semantic windows retain a semantic token:

```text
window morning
window afternoon
window evening
window night
window @school-hours
```

The standard day-period tokens are **semantic categories, not globally fixed clock ranges or an assertion that English is the universal authoring vocabulary**. An authoring implementation may accept locale-aware day-period lexemes and normalize them to the canonical semantic token or an explicitly referenced custom window. Resolution obtains concrete bounds from the relevant locale/context and records that dependency. No implementation may bake a universal “morning = 08:00–12:00” rule into the language.

### Resolved zoned instants

When resolution yields a concrete zoned date-time, its portable serialized value uses RFC 9557 / IXDTF:

```text
2026-08-28T09:00:00-07:00[America/Los_Angeles]
```

The offset alone is insufficient for future civil-time reasoning; the named zone preserves the applicable timezone rules. IXDTF is an interchange/runtime representation of a resolved zoned instant, **not** a replacement for authoring a local clock, a semantic point, a floating civil time, or an unresolved future rule.

## §36. Amounts make elapsed, calendar, and business meaning visible

**Decision: duration mode is explicit whenever it changes meaning; ambiguous plain amounts are invalid where a mode is required. LOCKED.**

Canonical amount families are:

```text
elapsed:   second, minute, hour, day, week
calendar:  day, week, month, quarter, year
business:  business hour, business day
```

Canonical examples:

```text
offset 72 hours elapsed
offset 3 days calendar
offset 3 business days
```

`3 months elapsed` is invalid. `3 days` is not silently interpreted where elapsed-versus-calendar meaning matters. The business units carry business mode directly and therefore do not need a redundant mode word.

Recurrence is the precise exception already supported by the temporal model:

```text
repeat every day
point 09:00
```

means civil recurrence at local 09:00, while:

```text
repeat every 24 hours elapsed
```

means elapsed recurrence. `repeat every week` and `repeat every 1 week` normalize to the former; interval values greater than one retain their numeric form and normal pluralization.

## §37. The canonical statement shapes expose all locked concepts without inventing execution

**Decision: v0.1 canonical source is a small indentation-structured document whose statement shapes directly expose the locked semantic roles. LOCKED.**

The grammar below is the frozen lexical/structural contract. It is intentionally a document language rather than arbitrary English and intentionally excludes operational verbs such as `run`, `send`, `execute`, `retry`, `notify`, `webhook`, `command`, `job`, and `handler`.

```ebnf
document          = intent-decl?, source-block?, time-block,
                    reference-block*, context-block*, lifecycle-block? ;

intent-decl       = "intent" identifier ;
source-block       = "source" indented(source-statement+) ;
time-block         = "time" indented(time-statement+) ;
reference-block    = "reference" identifier indented(reference-statement+) ;
context-block      = "context" indented(context-statement+) ;
lifecycle-block    = "lifecycle" indented(lifecycle-statement+) ;

time-statement     = point | window | repeat | selection | boundary |
                    exception | relation-block | condition-block | adjustment-block ;
point              = "point" point-value ;
window             = "window" window-value ;
repeat             = "repeat every" interval? repeat-unit repeat-mode? ;
selection          = "select" selector selection-filter? ;
boundary           = "boundary" ("before" | "by" | "until") boundary-value
                  | "boundary within" temporal-amount ;
exception          = "except" predicate-reference ;

relation-block     = "relation" indented(relation-statement+) ;
relation-statement = ("after" | "before") anchor-reference | offset ;
offset             = "offset" temporal-amount ;

condition-block    = "condition" ("gate" | "trigger")
                    indented("when" predicate-reference,
                             ("for at-least" temporal-amount)?) ;
adjustment-block   = "adjust" indented("when" predicate-reference,
                                        ("precedence" positive-integer)?,
                                        adjustment-operation) ;

context-statement  = context-kind local-name? reference ;
lifecycle-statement = "status" lifecycle-status
                  | "effective-from" date-value
                  | "effective-until" date-value ;
```

The implementation grammar may make the ordinary lexical token definitions mechanically precise, but it may not alter these semantic shapes without a future checkpoint. `identifier` follows the same ASCII-safe segment rules as a reference without `@`; `reference` includes `@`; `point-value`, `window-value`, `temporal-amount`, and related nonterminals are constrained by §§34–36.

Canonical statement examples:

```text
point 09:00
point noon
point 2026-08-28

window morning
window 08:00 to 12:00
window @office-hours

repeat every day
repeat every 2 weeks
repeat every month
repeat every 24 hours elapsed

select Friday
select second Tuesday
select last business day
select earliest available slot
select latest available slot
select next business day
select previous business day

relation
  after @approval
  offset 3 business days

condition gate
  when @office-open

condition gate
  when @everyone-available
  for at-least 30 minutes elapsed

condition trigger
  when @package-arrived

boundary before 17:00
boundary by noon
boundary until 2026-09-30
boundary within 10 minutes elapsed

except @holidays

adjust
  when @holiday
  move forward to next business day

adjust
  when @timezone-change
  preserve local-civil-time
```

`relation` supplies direction; its offset is unsigned. `except` always means candidate suppression. `adjust` transforms an applicable candidate and never means suppression. Competing incompatible adjustments without explicit precedence are a temporal conflict; source order never becomes precedence. Higher numeric precedence wins where precedence is supplied.

Context bindings are intentionally plain:

```text
context
  timezone @participant.timezone
  calendar @company.business-calendar
  location @participant.location
```

Where more than one binding of the same kind is needed, a local name makes the distinction explicit:

```text
context
  calendar payroll @company.payroll-calendar
  calendar holidays @us.federal-holidays
```

## §38. Lifecycle supplies recurrence phase origin without adding a new algebra concept

**Decision: an interval recurrence whose result depends on phase takes its origin from `IntentLifecycle.effectiveFrom`; it is never silently epoch- or invocation-anchored. LOCKED.**

For example:

```text
repeat every 2 weeks
select Friday
```

does not say which alternating Friday applies until phase origin is known. The canonical source expresses it through the existing lifecycle object:

```text
lifecycle
  status active
  effective-from 2026-08-28
```

This is an implementation refinement of already locked lifecycle semantics, not a thirteenth-plus-one temporal algebra concept. If a phase-dependent interval greater than one lacks an establishable effective origin, the intent can be parsed and valid but must resolve as unresolved or ambiguous. It must never be silently anchored to Unix epoch, January 1, document creation time, or resolver invocation time.

## §39. Unassigned punctuation remains available for future meaning

**Decision: `[`, `]`, `{`, `}`, `?`, `~`, and `!` are reserved in v0.1 and have no user-inventable semantic meaning. LOCKED.**

```text
[ ] { } ? ~ !
```

These characters are held for future standards-compatible annotations, uncertainty/approximation, alternatives, sets, extension metadata, and critical semantics. In particular, brackets and exclamation have established relevance in IXDTF/RFC 9557 annotation syntax. Reserving them now avoids a later collision between ad hoc source punctuation and deliberate language evolution.

---

# PART X — CANONICAL AST SERIALIZATION AND INTERCHANGE

## §40. Canonical human source and canonical JSON describe the same meaning

**Decision: the readable document is canonical human source; the versioned JSON record is canonical machine interchange. Neither may smuggle in meaning absent from the other. LOCKED.**

The convergent model is:

```text
authoring source ────────→ normalized AST ────────→ canonical document
                                 │
                                 └────────────────→ canonical JSON
```

Both canonical forms are semantically round-trippable through the normalized AST. They are not required to preserve author formatting, authoring aliases, comments, blank-line choices, or incidental source order. Original source evidence remains separately available in `SourceRecord` where provenance requires it.

The resulting machine interchange lock has thirteen parts.

### I-1. One versioned envelope

Every portable record carries a versioned envelope rather than serializing a naked `TemporalExpression`:

```json
{
  "format": "temporal-intent",
  "version": "0.1",
  "type": "intent",
  "intent": {}
}
```

`format` identifies the interchange family. `version` identifies the semantic/schema contract, not an implementation release. `type` identifies the carried record family. The recognized record-family vocabulary is `intent`, `expression`, `interpretation`, `resolution`, and `occurrence`; v0.1 primarily interchanges complete `intent` records and permits bare `expression` records where tooling genuinely requires them. Runtime package or compiler versions do not enter this envelope.

### I-2. Explicit discriminated-union JSON

Interchange represents every semantic variant with explicit `kind` discriminants and fields. It does not create a second shorthand notation:

```json
{
  "kind": "compound",
  "expressions": [
    { "kind": "repeat", "every": 1, "unit": "month", "mode": "civil" },
    {
      "kind": "selection",
      "filter": { "kind": "weekday", "value": "tuesday" },
      "selector": { "kind": "ordinal", "value": 2 }
    },
    {
      "kind": "window",
      "value": { "kind": "semantic_window", "name": "morning" }
    }
  ]
}
```

The rejected shape is RRULE-like shorthand such as `{"repeat":"monthly","on":"2TU"}`. Verbosity at the machine boundary protects semantic specificity.

### I-3. Normalize before serializing

Parser normalization precedes serialization. Therefore these canonicalize to the same AST:

```text
repeat every month
repeat every 1 month
```

Authoring aliases disappear before the AST boundary. Equivalent temporal meaning yields the same canonical expression representation, not merely equivalent observed behavior.

### I-4. Canonical expression ordering is semantic

An accepted document may list independent claims in a convenient source order. The canonical printer and serialized `CompoundExpression.expressions` array use semantic order:

```text
anchors/context dependencies
repeat/base generation
relations and offsets
selection
windows and boundaries
conditions
exceptions
adjustments
```

This refines presentation to the resolver's locked evaluation order; it does not change that order. Where order genuinely carries meaning, a semantic field controls it—for example `AdjustmentExpression.precedence`—rather than textual position.

### I-5. References and context remain external dependencies

An expression preserves references, not their current targets. For example:

```json
{
  "kind": "relation",
  "relation": "after",
  "anchor": { "kind": "event", "reference": "@approval" },
  "offset": {
    "kind": "offset",
    "amount": { "value": 3, "unit": "business_day", "mode": "business" }
  }
}
```

The current resolution of `@approval` belongs in a separate reference record, not the expression:

```json
{
  "id": "@approval",
  "kind": "event",
  "status": "resolved",
  "target": "event:42"
}
```

Likewise context bindings say where a dependency may be obtained, while a resolution records the concrete context versions actually used. Neither current reference targets nor context snapshots may be copied into semantic AST nodes.

### I-6. Provenance stays outside semantic AST nodes

Explicit, inferred, defaulted, imported, and other provenance belongs to `InterpretationRecord` claims (or resolution derivation), not in every semantic node. Two intents can therefore have the same semantic window AST while retaining distinct evidentiary histories. Semantic identity remains about temporal meaning, not who supplied it or with what confidence.

### I-7. Identities and hashes are separate by question

There is no universal `intentHash`.

| Identity | Question answered | Includes | Excludes |
|---|---|---|---|
| Expression hash | Is canonical temporal meaning identical? | `TemporalExpression` only | Intent ID, source, interpretation/provenance, lifecycle, current reference/context resolution, resolutions, Occurrences |
| Intent-version hash | Is this durable intent version identical? | Expression, reference declarations, context bindings, lifecycle-effective semantics | Transient resolution output and Occurrences |
| Resolution identity | Is this deterministic resolution input set identical? | Expression + reference/context versions + reference frame + horizon | A claim that a materialized occurrence is the same thing |

The default digest is `sha256`, written with its algorithm prefix (for example `sha256:…`) so a future migration remains possible.

### I-8. RFC 8785 supplies deterministic JSON bytes after semantic normalization

JSON hashing uses RFC 8785 JSON Canonicalization Scheme after the semantic model has been normalized. The sequence is:

```text
semantic normalization
  → canonical AST / record
  → RFC 8785 canonical JSON bytes
  → algorithm-qualified hash
```

RFC 8785 gives deterministic byte representation, including sorted object properties while preserving significant array order. It does not define the temporal language's meaning, AST normalization, or resolver order.

### I-9. Omission and `null` have different policy

Absent optional properties are omitted in canonical interchange. `null` does not mean unknown, unresolved, absent, or not supplied. Typed state carries those meanings:

```json
{ "status": "unresolved" }
```

not:

```json
{ "target": null }
```

Similarly, omitted `confidence` means no confidence was supplied; a typed unresolved claim explains an unresolved reading. This policy keeps canonicalization and schema reasoning unambiguous.

### I-10. Unknown semantic fields fail closed

An unknown field in a known semantic node is rejected. A v0.1 implementation may not silently ignore a field that could change temporal meaning. An extension/metadata namespace may be reserved for future compatibility rules, but v0.1 does not ship arbitrary semantic extensions. The governing rule is:

> Unknown semantics fail closed. Future designated non-semantic metadata may fail open under its explicit extension contract.

### I-11. Machine enums are ASCII-stable and presentation-independent

Interchange enum values are lower-case ASCII machine tokens:

```text
business_day
local_civil_time
partially_resolved
tuesday
```

They are not localized display strings such as `Business Day` or `Tuesday`. The canonical document and user interface may present localized human language without changing semantic storage or hashes.

### I-12. Temporal values use typed structures until resolution yields an IXDTF zoned instant

Unresolved temporal primitives do not become untyped strings:

```json
{ "kind": "clock", "hour": 9, "minute": 0 }
```

```json
{
  "kind": "date",
  "calendar": "iso8601",
  "year": 2026,
  "month": 8,
  "day": 28
}
```

Once a concrete zoned date-time is resolved, it uses the standardized IXDTF representation:

```json
{
  "kind": "zoned_datetime",
  "value": "2026-08-28T09:00:00-07:00[America/Los_Angeles]"
}
```

This preserves the difference between a semantic/local temporal primitive and a concrete instant.

### I-13. Canonical document and canonical JSON round-trip semantically

Parsing canonical document text, printing it, serializing it, deserializing it, and printing again must converge on the same semantic AST and canonical source. Formatting preservation is explicitly out of scope; semantic preservation is mandatory.

For example, an author may write:

```text
time
  window morning
  select second Tuesday
  repeat every month
```

and receive:

```text
time
  repeat every month
  select second Tuesday
  window morning
```

The normalized expression and canonical JSON are the same in both cases. The original source may still be retained as immutable evidence in `SourceRecord`.

## §41. Complete intent interchange carries source, interpretation, semantics, dependencies, and lifecycle without confusing their roles

**Decision: a complete durable intent record preserves the source-to-occurrence chain while keeping each truth type separate. LOCKED.**

Representative intent interchange is:

```json
{
  "format": "temporal-intent",
  "version": "0.1",
  "type": "intent",
  "intent": {
    "id": "quarter-close",
    "source": {
      "kind": "natural_language",
      "value": "Last business day of every quarter before close.",
      "createdAt": "2026-08-27T06:00:00Z"
    },
    "interpretation": {
      "claims": [],
      "unresolved": []
    },
    "expression": {
      "kind": "compound",
      "expressions": []
    },
    "context": [],
    "references": [],
    "lifecycle": {
      "status": "active",
      "version": 1
    }
  }
}
```

The earlier `SourceKind` union gains `canonical_document`. This is an implementation refinement: a canonical document can now be immutable source evidence in the same manner as natural language, voice, CLI, API, agent, imported cron, and imported RRULE sources. It does not alter the source → interpretation → expression → resolution → occurrence separation.

---

## WHAT IS LOCKED

- The two-tier surface contract: tolerant specified authoring input, strict canonical parser, normalized AST, and one canonical printer output.
- UTF-8, LF, two-space indentation, no tabs, lowercase keywords, comments, strings, and canonical whitespace/casing behavior.
- ASCII-stable `@` reference syntax and its identifier grammar; localized display labels remain separate from machine identity.
- ISO-calendar meaning of bare `YYYY-MM-DD`; 24-hour canonical clocks; semantic points; explicit and semantic/custom windows.
- Locale-aware authoring treatment for semantic day-period lexemes: semantic tokens are not global fixed ranges or universal English vocabulary.
- Duration families/modes, civil recurrence default, explicit elapsed recurrence, and rejection of mode-changing ambiguity.
- Canonical statement shapes for Point, Window, Repeat, Selection, Relation/Offset, Condition, Boundary, Exception, Adjustment, Context, Reference, and Lifecycle.
- Recurrence phase origin derives from `IntentLifecycle.effectiveFrom`; no hidden epoch or resolver-time origin is permitted.
- `[ ] { } ? ~ !` are reserved and cannot acquire user-defined semantics in v0.1.
- RFC 9557/IXDTF is the canonical interchange representation for a resolved zoned instant.
- The full I-1–I-13 interchange contract: versioned envelope; explicit discriminated unions; normalization; semantic ordering; external references/context; provenance outside semantic nodes; separate identities; RFC 8785 canonicalization; omission rather than semantic `null`; fail-closed unknown semantics; ASCII-stable enums; typed temporal literals; semantic round-tripping.
- `canonical_document` is added as a `SourceKind` implementation refinement.
- No direct implementation contradiction was found with prior algebra, resolver, materialization, Occurrence, or execution-boundary decisions.

## WHAT IS NOT LOCKED

- The observable runtime API shape: operation names, request/response types, capability discovery, inspection/explanation surface, error delivery, and Occurrence query API.
- The exact implementation language, package layout, persistence strategy, parser technology, timezone/locale provider, and schema-validation library for a first reference implementation.
- The concrete locale data source, fallback policy, and custom semantic-window registry; only the semantic/non-global treatment of day periods is locked here.
- The v0.1 support matrix identifying which valid grammar nodes are initially resolvable, observable, materializable, or capability-pending.
- Arbitrary extension namespaces and their future metadata compatibility policy.
- Downstream Binding/executor policies—retry, backoff, leasing, authority, temporal recheck, deadlines, abandonment, and effects—which remain beyond the temporal primitive.
- Final product/package name.

## WHAT IS LOGGED

- Recent standards direction reinforces, rather than displaces, the existing decomposition of civil time, exact instants, named zones, calendars, locale day periods, elapsed duration, recurrence, and uncertainty into typed meaning.
- IXDTF brackets and critical annotation punctuation informed the conservative punctuation reservation; they do not authorize IXDTF syntax as ordinary v0.1 authoring source.
- Canonical text is the human source form and canonical JSON is the machine interchange form. Neither is superior semantic truth; both converge through the normalized AST.

---

## UPDATED OPEN QUESTIONS (v0.4 status)

| # | Question | Status |
|---|---|---|
| 1 | What exact lexical grammar lets humans express the locked temporal semantics naturally? | Resolved — v0.4 §§33–39, including future-proofing amendments. |
| 2 | What canonical serialization/interchange represents the typed temporal AST? | Resolved — v0.4 §§40–41, I-1 through I-13. |
| 3 | What stable runtime API exposes parsing, validation, resolution, materialization, inspection, explanation, capabilities, and Occurrence queries without crossing the execution boundary? | Open — next required session opening. |
| 4 | What minimal reference implementation and conformance corpus prove the model against real temporal cases? | Open — follows runtime API shape. |
| 5 | Which valid grammar-recognized features are initially exact, partial, pending, or unsupported at each runtime capability? | Open — implementation support matrix. |
| 6 | What locale and custom-window providers, fallbacks, and versioning rules should a reference implementation adopt? | Open — implementation dependency choice; no semantic default may be silently assumed. |
| 7 | What executor-specific Binding policies are eventually needed? | Deferred — explicitly downstream of the temporal product. |
| 8 | What final product/package name should represent the work? | Open — no name is locked. |

## DOCUMENTS PRODUCED THIS SESSION

| Document | Type | Status |
|---|---|---|
| `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange.md` | Checkpoint | Complete, LOCKED |

---

## RESUME PROMPT (v0.4)

*Resume from `scheduling_language_checkpoint_v0_4_concrete_syntax_interchange`, which directly extends `scheduling_language_checkpoint_v0_3_execution_boundary_architecture`, `scheduling_language_checkpoint_v0_2_temporal_runtime_architecture`, `scheduling_language_inception_checkpoint_v0_1_language_architecture`, and preserves provenance to `primitive_exploration_inception_checkpoint_v1_0`. All earlier temporal decisions and v0.3’s E1–E10 execution-boundary invariants remain in force. The temporal primitive is architecture late-stage and implementation pre-start: the thirteen-concept algebra, shallow semantic blocks, typed AST architecture, validator/error taxonomy, candidate-set resolver, materializer/Occurrence engine, twelve materialization rules, strict non-executable Occurrence boundary, v0.4 concrete lexical grammar, and I-1–I-13 canonical interchange contract are locked. v0.4 also locks RFC 9557/IXDTF for resolved zoned instants, locale-aware semantic day-period authoring lexemes, bare `YYYY-MM-DD` as an ISO-calendar date, reserved `[ ] { } ? ~ !` punctuation, canonical `@` references, visible duration modes, lifecycle-based recurrence origin, semantic canonical ordering, and `canonical_document` as a SourceKind refinement. Do not reopen the algebra, resolver, candidate-set, materialization, Occurrence, execution-boundary, lexical, or interchange decisions unless a direct implementation contradiction appears. Begin **exactly at observable runtime API shape**: define the caller-visible operations and request/result/error contracts for parse, canonicalize/print, validate, serialize/deserialize, resolve, materialize, query Occurrences, inspect/explain derivations, and report capabilities—without claiming authority, execution, retry, success, verification, or fulfillment. After that API is locked, define the minimal reference implementation and then a conformance/testing strategy against business days, exclusions, offsets from selected events, DST gaps and folds, semantic/explicit windows, suppression, adjustments and conflicts, overlapping rules, retrospective queries, unresolved references/context, locale-aware periods, recurrence origin, canonical round trips, hash stability, and fail-closed compatibility. Keep execution policies downstream and do not drift into a workflow engine.*
