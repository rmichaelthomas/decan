# scheduling_language_inception_checkpoint_v0_1_language_architecture.md

# CANONICAL CHECKPOINT DOCUMENT
## Temporal Intent / Scheduling-Language Branch
### v0.1 — Language Architecture: a temporal-intent primitive from which scheduling is derived

**Date:** August 26, 2026  
**Status:** LOCKED — LANGUAGE ARCHITECTURE; GRAMMAR AND IMPLEMENTATION NOT YET STARTED  
**Author:** Rob Thomas / R. Michael Thomas (architect) and Codex (analytical partner)  
**Domain prefix:** `scheduling_language` (provisional, pre-vault)  
**Session type:** Leading interview and language-architecture pass  
**Relationship to prior checkpoints:** Direct continuation of the supplied `primitive_exploration_inception_checkpoint_v1_0.md` (August 25, 2026), specifically Primitive 1: The Scheduling Language. Its ancestry, format-as-language thesis, portfolio connections, and decisions remain in force. This document records the scheduling-language branch's first locked architecture.  
**Product name:** No final product or language name is locked.

---

## HOW TO READ THIS DOCUMENT

Primitive Exploration identified a human-readable scheduling language as the most buildable and personally useful of three candidate primitives. It named a gap: cron and RRULE can describe selected recurrence patterns, but neither preserves purpose, beneficiary, consequence, or the meaning of a missed run.

This checkpoint resolves the architecture beneath that initial framing. The discovery is not that a schedule needs more fields. It is that a schedule is one consumer of a broader **temporal-intent** primitive. The canonical system must let a person speak naturally, let a machine reason precisely, and keep those representations distinct enough that neither silently overwrites the other.

This is not a final language specification, grammar, API, parser, runtime, or product plan. It locks the semantic layers, object boundaries, invariants, and canonical-syntax direction that the v0.1 grammar must obey.

---

## PART I — FROM TRIGGER LANGUAGE TO TEMPORAL INTENT

### §1. The original gap was real, but too narrow to be the primitive

Cron and RRULE are useful target formats, but their worldview is recurrence and triggering. Human time is also a point, a window, a relationship, a condition, a boundary, an exception, and a participant-relative experience.

Statements such as the following cannot be honestly reduced to a timestamp without losing meaning:

- “Every Friday morning.”
- “Three business days after approval.”
- “After sunset, but only while the office is open.”
- “Whenever everyone on the project is available for at least 30 minutes.”
- “Never send external reports while I’m traveling.”

**Decision: the semantic primitive is a language for expressing temporal intent; a schedule is a derived application of that primitive. LOCKED.**

The immediate product path can still be a scheduling language and scheduler. The broader primitive is not a license to make v0.1 unbounded. It is the boundary that prevents the first implementation from inheriting cron’s limitations as its own semantics.

### §2. One human experience, participant-optimized layers underneath

The system is designed around the principle that humans should not have to learn the machine’s representation in order to express time. A participant may dictate, type, or automate natural temporal language. A power user, CLI, or agent may use a canonical form. An implementation may use a runtime or compiler representation.

**Decision: temporal information is represented in participant-optimized layers rather than forced into one universal surface. LOCKED.**

The minimum surfaces are:

1. **Human surface** — natural language, dictation, and approachable authoring.
2. **Canonical document surface** — deterministic, readable, indentation-structured semantic documents.
3. **Programmatic surface** — JSON interchange plus SDK/CLI objects that correspond to the canonical semantics.
4. **Runtime/compiler surface** — native resolution and execution, or an explicitly qualified translation to cron, RRULE, Cloudflare, a calendar, or another target.

The canonical layer does not pretend to be ordinary English, and the runtime does not become the canonical meaning.

---

## PART II — LAYER SEPARATION

### §3. Time, responsibility, policy, authority, and action are separate concerns

The original checkpoint correctly identified obligation context as the missing dimension of ordinary scheduling. The interview clarified that the answer is not to place all of that context inside a `Schedule` object.

**Decision: schedule, obligation, policy, authority, execution, verification, and fulfillment remain distinct layers. LOCKED.**

| Layer | Question it answers | Boundary |
|---|---|---|
| Temporal expression | What temporal meaning was expressed? | The semantic primitive. |
| Schedule | When should an attempt or occurrence be considered? | A consumer/application of temporal expression. |
| Obligation | What must become true, for whom, and with what consequence if it does not? | External consumer of time; not time itself. |
| Policy | What temporal arrangements are prohibited, protected, or constrained? | May block or constrain a schedule without redefining its meaning. |
| Authority | Who may take which consequential action, under which conditions? | Permission is never inferred from understanding time. |
| Execution | What action was attempted or performed? | A trigger or tool call is an event, not proof of success. |
| Verification | What evidence establishes the outcome? | May succeed or fail independently of execution. |
| Fulfillment | Has the relevant obligation actually been satisfied? | The human-facing completion state may depend on verification. |

An obligation can wrap or reference an occurrence. A policy can block a scheduled action. Authority can permit a reminder but prohibit an external message. None of these facts alter the TemporalExpression itself.

### §4. Completion is not merely triggering

**Decision: execution is distinct from verification, and neither alone implies fulfillment. LOCKED.**

For “Back up the project every Friday afternoon,” a scheduler can report that an attempt fired; an executor can report that it ran; a verifier can report that the backup exists and is usable; only the obligation layer can declare the promised outcome fulfilled. The system may present one coherent human story, but its records must not lie by collapsing these states.

### §5. Experienced time belongs around the primitive, not inside a timestamp

Time is not experienced identically by every participant. Lateness, urgency, waiting, burden, flexibility, and the distribution of responsibility may differ across people even when the clock value is the same. This supports the TAOS-aligned observation from Primitive Exploration: infrastructure should not treat the system’s view of time as the only relevant view.

**Decision: participant impact, responsibility changes, and fairness/policy interpretation may consume temporal state, but v0.1 keeps them separate from the temporal algebra. LOCKED.**

---

## PART III — HUMAN TEMPORAL MEANING

### §6. Ambiguity and semantic windows are valid meaning

“Morning,” “afternoon,” “before close,” “after sunset,” “the next business day,” and “when everyone is available” are real temporal concepts. They are not malformed timestamps.

**Decision: time is not always a point; semantic windows, relations, and conditions remain representable until precision is actually required. LOCKED.**

For example, `window morning` is canonical meaning. A resolver may later determine a locale-specific window or a participant-preferred point inside it, but neither result retroactively changes the meaning to `09:00`.

### §7. Context is participant-relative and dynamically resolved

“At 5 PM” and “at the end of my workday” may coincide today while remaining different statements. The latter depends on an addressable temporal context: participant, timezone, calendar, location, holiday rules, office hours, accessibility needs, or organization policy.

**Decision: canonical expressions reference context rather than copy mutable contextual facts; resolution is dynamic and records the versions of context consulted. LOCKED.**

The durable semantic rule is therefore distinct from its current answer. A future office-calendar change may produce a different next occurrence without mutating the intent that referenced that calendar.

### §8. Personalization may influence resolution, never rewrite meaning

If a participant typically chooses 3 PM for “afternoon,” that preference may guide a proposed or authorized execution point. The canonical expression still says `afternoon`.

**Decision: participant preferences are resolution inputs, not semantic rewrites. LOCKED.**

The same expression may resolve differently for different participants or in different context versions, while retaining one intact semantic identity and provenance chain.

---

## PART IV — THE TEMPORAL EXPRESSION ALGEBRA

### §9. A compact, compositional semantic vocabulary

**Decision: the v0.1 TemporalExpression algebra begins with twelve composable concepts. LOCKED.**

| Concept | Role | Example |
|---|---|---|
| **Point** | A specific temporal moment | `at 9 AM` |
| **Window** | A bounded or semantic span | `Friday morning` |
| **Duration** | Elapsed, calendar, or business duration | `3 business days` |
| **Anchor** | A thing to which time may relate | `approval`, `sunset`, `the meeting tomorrow` |
| **Relation** | Directional temporal relationship | `after approval` |
| **Condition** | State that gates temporal satisfaction or eligibility | `when everyone is available` |
| **Boundary** | Deadline, limit, or temporal edge | `by noon`, `before close` |
| **Repeat** | Repetition interval or cadence | `every 2 weeks` |
| **Selection** | Choosing a qualifying candidate time | `last business day`, `second Tuesday` |
| **Exception** | Suppression, shift, or alternate behavior | `except holidays` |
| **Context** | External reference frame needed for resolution | `office calendar`, `participant location` |
| **Phase** | Temporal lifecycle state of an occurrence | `upcoming`, `due`, `late`, `overdue` |

These are algebraic components, not a catalog of special-case phrases. For example, “last business day of every quarter before close” composes Repeat + Selection + Boundary + Context; “two hours after sunset whenever I’m home” composes Anchor + Relation + Duration + Condition + Context.

### §10. Duration has explicit semantics

“Tomorrow,” “in one day,” and “24 hours from now” are not necessarily equivalent. Calendar arithmetic, elapsed time, business time, daylight-saving transitions, and incomplete months produce real differences.

**Decision: Duration carries an explicit mode such as elapsed, calendar, or business, with the required context where applicable. LOCKED.**

### §11. Recurrence does not define the worldview

Cron begins with recurrence. This architecture does not. “Every other Friday” can be represented as a composition of Repeat and Selection; other temporal intents need no recurrence at all.

**Decision: recurrence is modeled through `Repeat` and `Selection` composition, not treated as the semantic ceiling of the language. LOCKED.**

---

## PART V — CANONICAL OBJECT MODEL

### §12. The source-to-occurrence chain

**Decision: the temporal primitive carries a chain that preserves meaning from source through materialized occurrence. LOCKED.**

```text
Source → Interpretation → TemporalExpression → Resolution → Occurrence
```

External consumers then act around it:

```text
Authority → Execution → Verification → Obligation fulfillment
```

### §13. TemporalIntent is deliberately lightweight

`TemporalIntent` is the durable record of what was meant over time. Its mandatory core is:

```text
TemporalIntent
  source
  expression
  provenance
```

Everything else is optional or attached only when the case requires it: identifier, context references, uncertainty, lifecycle/versioning, resolution snapshots, policy references, or authority references.

**Decision: source is immutable evidence, not normalized meaning; TemporalExpression is durable; Resolution is derived and disposable. LOCKED.**

### §14. Interpretation preserves the machine’s reading of human language

`Interpretation` is a first-class artifact between source and expression. It distinguishes:

- what was explicit in the source;
- what was derived or inferred from context;
- what remains unresolved;
- candidate references and confidence where relevant.

It enables an inspectable human-facing diff: “I understood Friday and afternoon; I inferred your timezone and preferred time; I did not infer a deadline or recurrence.”

### §15. Resolution is explainable, contextual, and non-canonical

`Resolution` converts a TemporalExpression into context-specific values useful for planning or execution. It records the context versions and preferences that produced its result.

```text
resolution
  next
    start 2026-08-28T13:00:00-07:00
    end   2026-08-28T17:00:00-07:00
  preferred
    point 2026-08-28T15:00:00-07:00
  context_used
    participant:rob@v12
    calendar:rob-work@v7
```

The timestamps are answers, not replacements for the rule that produced them.

### §16. Occurrence materializes one instance without altering the intent

`Occurrence` represents one manifestation of a recurring, conditional, or otherwise continuing TemporalIntent. It holds a parent reference, expected temporal meaning, current resolution, and phase. Lateness belongs primarily to an occurrence, not to an eternal rule.

### §17. Obligation is an external consumer

`Obligation` references an occurrence and records expected outcome, beneficiary, fulfillment criteria, escalation, and consequence. It is not part of the core temporal primitive.

**Decision: obligation consumes time; it is not time. LOCKED.**

---

## PART VI — UNCERTAINTY, AUTHORITY, HISTORY, AND CONFLICT

### §18. Uncertainty has lifecycle and policy

An unresolved anchor may have candidates, a preferred candidate, a confidence measure, evidence, and an execution policy. Ambiguity may transition through states such as unresolved, inferred, confirmed, overridden, and executable.

**Decision: uncertainty is first-class state and cannot silently become certainty. LOCKED.**

Interpretation can proceed under uncertainty. Execution may still require resolution, an explicit confidence threshold, or appropriate authority.

### §19. Understanding does not authorize action

**Decision: authority attaches to actions, not to temporal meaning. LOCKED.**

An agent may understand “Friday afternoon,” resolve it, and be allowed to create an internal reminder, while lacking permission to send an external message. Delegated authority may be scoped by domain, action, conditions, and expiry. Interpretation and execution remain separate permissions.

### §20. Temporal continuity is versioned, effective-dated, and explainable

When “every Friday afternoon” changes to Thursday, the system must retain the prior rule, the effective date, provenance of the change, recalculated future occurrences, and any remaining old obligations.

**Decision: temporal changes create history rather than erasing it; the human-facing experience is a continuous commitment with effective-dated evolution. LOCKED.**

### §21. Conflict is visible, not silently overridden

A scheduled report may conflict with a travel policy that prohibits external sending. The precedence model may establish that policy constraints override schedules, but runtime state still records the fact: scheduled + blocked by policy, with reason and next permitted action.

**Decision: conflict handling uses explicit precedence rules and first-class runtime conflict states, never silent overrides. LOCKED.**

---

## PART VII — APPROVED INVARIANTS

These are implementation constraints. A parser, resolver, runtime, UI, compiler, or adapter that violates one is not conformant with this architecture.

1. **Original intent is never overwritten by interpretation.**
2. **Semantic expressions are never replaced by resolved timestamps.**
3. **Every inferred semantic claim carries provenance.**
4. **Uncertainty cannot silently become certainty.**
5. **Understanding an instruction never implies authority to execute it.**
6. **A trigger firing never implies fulfillment.**
7. **Changes create temporal history rather than erasing it.**
8. **Context-dependent resolution records the context that produced it.**
9. **Participant preferences may influence resolution but never rewrite meaning.**
10. **Unsupported compilation must fail honestly rather than degrade semantics silently.**

The following architectural corollaries are also locked by this checkpoint:

- Time may be a point, window, relation, condition, boundary, or participant-relative context—not only a timestamp or recurrence.
- Canonical temporal semantics remain distinct from obligation, policy, authority, execution, verification, and fulfillment.
- Context references and resolution snapshots preserve both adaptability and explainability.
- Conflict visibility is required even where precedence produces a determinate runtime outcome.

---

## PART VIII — CANONICAL SYNTAX DIRECTION

### §22. The native document is semantic and legible

**Decision: the canonical native form is deterministic, indentation-structured, human-readable, compositional, and semantic rather than timestamp-first. LOCKED.**

It is not YAML or JSON as its primary authoring identity, though it must serialize losslessly to JSON. It is separate from natural-language authoring and from SDK/runtime syntax.

The core canonical block is `time`, not `schedule`:

```text
intent compliance-check

source
  "Every second Tuesday morning.
   If it hasn't happened by noon, try once more and tell operations."

time
  repeat every month
  select second Tuesday
  window morning
  deadline noon

context
  timezone participant

resolution
  preserve morning
```

`time` encodes the key architectural discovery: a scheduler may consume it, an obligation may reference it, and a policy may constrain it. The temporal primitive itself is not reduced to a schedule.

### §23. Surface syntax is a projection, not the model

The grammar may allow readable conveniences such as `after 3 business days`, even if the internal tree decomposes them into Relation + Duration. Surface syntax need not mirror AST nodes one-for-one, but it may not hide or discard semantic distinctions.

The next pass must define the v0.1 legal keywords, allowed compositions, normalization rules, reference syntax, and parser behavior while keeping the vocabulary as small as the algebra permits.

---

## PART IX — CRON, RRULE, AND NATIVE EXECUTION

### §24. Existing formats are targets, not the semantic ceiling

**Decision: cron and RRULE are compilation/interchange targets when faithful; they do not define what the canonical language is allowed to mean. LOCKED.**

A capability query may report each target as `exact`, `lossy`, `unsupported`, or `native-required`. Examples depending on semantic windows, participant context, live calendars, availability, unresolved anchors, policy, or verification commonly require a native/context-aware runtime.

### §25. Loss must be explicit and opt-in

**Decision: compilation fails honestly by default when a target cannot preserve semantics; lossy compilation is explicit and reports every discarded meaning and assumption. LOCKED.**

For example, a request to compile a semantic morning window to cron may require an explicit allowance and return a report:

```text
lost semantics
  window morning

compiled assumption
  morning -> 09:00
```

No adapter may emit an apparently valid cron expression and imply equivalence where none exists.

---

## WHAT IS LOCKED

- The primitive is **temporal intent**, from which schedules are derived.
- The system uses participant-optimized human, canonical, programmatic, and runtime/compiler layers.
- Temporal semantics are separate from schedule, obligation, policy, authority, execution, verification, and fulfillment.
- Human ambiguity, semantic windows, participant-relative context, dynamic resolution, and provenance are first-class.
- Personalization influences resolution without rewriting the participant’s meaning.
- The authority boundary: understanding never grants permission to act.
- The completion boundary: triggering or execution never alone proves fulfillment.
- Uncertainty has explicit structure, lifecycle, evidence, and execution policy.
- Temporal intent evolves through effective-dated, provenance-preserving history.
- Conflicts are visible first-class states governed by explicit precedence.
- The v0.1 TemporalExpression algebra: Point, Window, Duration, Anchor, Relation, Condition, Boundary, Repeat, Selection, Exception, Context, and Phase.
- The object model: TemporalIntent, Interpretation, TemporalExpression, Resolution, Occurrence, with Obligation as an external consumer.
- The ten approved invariants in Part VII.
- Canonical syntax is semantic, deterministic, indentation-structured, JSON-serializable, and centered on a `time` block.
- Cron and RRULE are honest compilation targets; unsupported or lossy translations must say so.

## WHAT IS NOT LOCKED

- Final product/language name.
- Exact v0.1 grammar, keywords, normalization rules, parser behavior, or error format.
- Public API, SDK syntax, package layout, storage model, or runtime architecture.
- Which adapters ship first beyond the principle of honest capability reporting.
- The exact policy and precedence taxonomy, default semantic-window definitions, context-provider protocols, or confidence thresholds.
- The full Obligation, policy, authority, execution, verification, and fulfillment schemas.
- Whether and when the language becomes a daemon, hosted control surface, Cloudflare library, or standalone package.

## WHAT IS LOGGED

- Primitive Exploration’s format-as-language thesis remains a design ancestor: the canonical temporal document is intended to be both readable artifact and executable semantic source.
- Liminate remains an authoring and provenance influence, not a locked runtime dependency for this language.
- 5xFive, Seshat, Cloudflare scheduled triggers, and the Cloudflare backward-channel work remain likely future consumers and test cases; no repository inspection or implementation decision was made in this checkpoint.
- The v0.1 implementation should remain deliberately small even though the primitive has wider implications for calendars, agents, workflows, infrastructure, availability, deadlines, and policy.

---

## UPDATED OPEN QUESTIONS (v0.1 status)

| # | Question | Status |
|---|---|---|
| SL-Q1 | What are the exact v0.1 grammar, legal keywords, indentation rules, and parser errors? | Open — next language-design pass |
| SL-Q2 | Which atom combinations are legal, normalized, invalid, or require an explicit policy? | Open — grammar/semantics pass |
| SL-Q3 | What are v0.1 defaults and override rules for semantic windows, calendar arithmetic, DST, and business-time context? | Open — resolution specification |
| SL-Q4 | What is the smallest native evaluator/resolver needed to demonstrate the architecture? | Open — implementation scoping |
| SL-Q5 | Which cron/RRULE capabilities are exact, lossy, or unsupported in the first compiler? | Open — adapter matrix |
| SL-Q6 | What is the first real corpus from 5xFive, Seshat, or Cloudflare against which to test the grammar? | Open — evidence-gathering and MVP selection |
| SL-Q7 | What should the final language/product be called? | Open — no name locked |
| PE-Q1 | What is the name and shape of the scheduling language? | Partially resolved — shape now locked; name remains open |
| PE-Q2 | Does the scheduling language extend RRULE, replace it, or sit alongside it? | Partially resolved — RRULE is a target, not the semantic ceiling; exact adapter scope remains open |

---

## DOCUMENT STATUS

This is the canonical v0.1 language-architecture inception checkpoint for the Temporal Intent / Scheduling-Language Branch as of August 26, 2026.

**Version history:**

- Primitive Exploration Inception Checkpoint v1.0 (August 25, 2026) — territory mapped; scheduling language selected as the most buildable primitive.
- v0.1 Language Architecture (this document) — semantic boundary, layers, algebra, object model, invariants, syntax direction, and compiler honesty locked; grammar and implementation remain open.

It should be extended when:

- the first grammar and parser contract are locked;
- a semantic-resolution policy is chosen for v0.1;
- a compiler capability matrix is verified against cron and RRULE;
- a first real consumer corpus is selected and evaluated; or
- a product/language name is formally locked.

---

## PART X — RESUME PROMPT

**To resume the Temporal Intent / Scheduling-Language Branch:**

*We are resuming from `scheduling_language_inception_checkpoint_v0_1_language_architecture.md` (August 26, 2026), which directly extends Primitive Exploration Inception Checkpoint v1.0 (August 25, 2026). Primitive Exploration’s scheduling-language gap, format-as-language thesis, and portfolio connections remain in force. This checkpoint locks the architecture: the primitive is a language for temporal intent, from which schedules are derived; humans, canonical documents, programmatic interfaces, and runtimes are participant-optimized layers; schedule, obligation, policy, authority, execution, verification, and fulfillment remain separate; semantic windows and ambiguity are legitimate meaning; context is participant-relative and dynamically resolved with provenance; preferences may guide resolution but never rewrite meaning; authority is distinct from understanding; execution is distinct from fulfillment; uncertainty, temporal history, and conflict are first-class. The v0.1 TemporalExpression algebra contains 12 atoms: Point, Window, Duration, Anchor, Relation, Condition, Boundary, Repeat, Selection, Exception, Context, and Phase. The core object chain is Source → Interpretation → TemporalExpression → Resolution → Occurrence; Obligation is an external consumer, with Authority → Execution → Verification → fulfillment around it. Ten invariants are locked, including honest unsupported/lossy compilation. The native canonical syntax is deterministic, readable, indentation-structured, JSON-serializable, semantic rather than timestamp-first, and centered on a `time` block; cron and RRULE are compilation targets, not the semantic ceiling. No final product name, exact grammar, parser, resolver defaults, implementation, capability matrix, or first consumer corpus is locked. Next, define the smallest actual v0.1 grammar: legal keywords, combinations, normalization, references, parser behavior, and a test corpus, while preserving every invariant in this checkpoint.*

**Everything that comes after builds from here.**
