# Proper Time and Decan

Proper Time is the standards-shaped idea behind Decan: represent temporal intent as meaning plus evidence, not merely as timestamp plus recurrence.

Decan is the reference implementation of that idea.

## The thesis

Existing time formats are useful but narrow:

- cron is excellent at compact recurrence triggers;
- RFC 5545/iCalendar is excellent at exchanging calendar objects;
- job schedulers are excellent at firing work.

None of those layers is the same thing as temporal intent.

Temporal intent asks:

- What did the person or system mean?
- Which temporal concepts were explicit?
- Which facts were inferred, supplied, or still missing?
- Which context snapshots produced the current candidates?
- What can be replayed later without asking the host environment to guess?

## Core chain

Decan preserves a source-to-occurrence chain:

```text
Source → Interpretation → TemporalExpression → Resolution → Occurrence
```

External systems may wrap that chain with:

```text
Authority → Execution → Verification → Fulfillment
```

Those external layers are intentionally not Decan core. Understanding time does not authorize action, and a trigger firing does not prove fulfillment.

## Semantic vocabulary

Decan's temporal algebra includes:

- point
- window
- duration
- anchor
- relation
- condition
- boundary
- repeat
- selection
- exception
- context
- phase

The implementation represents these through a compact TypeScript AST and a deterministic readable source format. The canonical block is `time`, not `schedule`, because scheduling is one consumer of temporal intent rather than the primitive itself.

## Human-first

Decan is human-first in the specific sense that the durable source is readable and semantic. A person can review:

```decan
time
  relation
    after @approval
    offset 3 business days
```

without first learning a calendar object's recurrence grammar or a scheduler's dialect.

Human-first does not mean Decan performs unrestricted natural-language understanding. Natural language is source evidence; canonical Decan is the inspectable semantic form.

## Agent-friendly

Decan is agent-friendly in the specific sense that it gives agents stable, non-ambient machinery:

- strict parse/canonicalize/serialize boundaries;
- stable hashes;
- typed operation envelopes;
- explicit support classification;
- deterministic finite resolution;
- pinned context/reference snapshots;
- materialization and replay checks;
- honest unsupported/lossy adapter outcomes.

An agent can inspect what Decan knows, what it needs, and what it refuses to infer.

## Relationship to RFC 5545/iCalendar

Decan is not [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html) and does not implement full iCalendar components. It sits beside that world:

- iCalendar exchanges calendar objects;
- Decan exchanges temporal intent and resolution evidence;
- cron/RRULE adapters are interop surfaces when exact fidelity is possible.

The current adapter supports a deliberately small exact weekly subset. Everything outside that subset fails closed until a future evidence-backed adapter expands support.

## Non-goals

Decan core does not:

- read the host clock;
- infer host locale or timezone;
- read device/browser geolocation;
- fetch network/calendar/holiday data;
- observe live external state;
- authorize work;
- execute work;
- retry work;
- verify outcomes;
- declare obligations fulfilled.
