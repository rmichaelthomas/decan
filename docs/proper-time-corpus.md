# Proper Time Corpus

The Proper Time corpus is the public evidence set for Decan. It is not a marketing gallery and not a synthetic benchmark. It is a working collection of temporal-intent cases that move through the same chain Decan claims to preserve:

```text
source → canonical document → expected candidates / needs → derivation → materialization / replay → observed gap
```

That chain matters because Decan is not trying to be yet another scheduler. A scheduler can fire a job. A calendar can store a recurrence rule. Cron can compress a trigger into five fields. RRULE can exchange a rich recurrence object. Proper Time asks a different question first: what did the person, product, or agent mean about time, and what evidence would let another system replay that meaning later?

The corpus gives that question teeth. A case only belongs here if it identifies real source intent, pins the snapshots or references required for deterministic reasoning, states expected candidates, and records what Decan can and cannot honestly do.

## Corpus status

The first public corpus contains three portfolio consumers:

| Consumer | Why it matters | Current Decan status |
| --- | --- | --- |
| 5xFive / Banneker 1 Automations | Weekly automation triggers from a real product surface, imported from cron-shaped intent. | Exact over Decan's weekly cron subset with pinned timezone evidence. |
| Seshat dependency scan scheduling | Security/maintenance scheduling where cadence, windows, and suppression matter more than a naked timestamp. | Represented as temporal intent with evidence and explicit gaps where product policy exceeds core. |
| Cloudflare backward-channel package | Obligation / expiration timing from the original primitive exploration, where "time" is tied to protocol responsibility. | Represented as relation, boundary, condition, and replayable evidence rather than a simple recurrence. |

Executable fixtures live in [`fixtures/consumer-evidence/`](../fixtures/consumer-evidence/). The tests in [`tests/consumer_evidence/`](../tests/consumer_evidence/) and [`tests/post_c6/`](../tests/post_c6/) make the public claims regressable.

## Case anatomy

Each corpus case should answer the following questions:

1. What was the source intent?
2. Which source system produced it?
3. Which Decan document represents it?
4. Which snapshots or references are required?
5. Which candidates should appear under a finite horizon?
6. Which derivation steps prove where those candidates came from?
7. What materialization/replay behavior is expected?
8. What gap remains outside Decan core?

This format is intentionally friendly to both people and agents. A person can review a case as a document. An agent can parse it, validate it, classify support, resolve it, and compare the result to expected evidence.

## Case 1: 5xFive / Banneker 1 Automations

### Source

5xFive's Banneker 1 Automation work produced the cleanest first consumer because it gives Decan a real product trigger without needing to pretend the product is already a Decan-native scheduler. The source is a weekly automation cadence in cron shape:

```text
0 9 * * 1
```

That expression is useful and compact, but it is not the whole intent. A human product surface means something more like:

> Run this automation every Monday at 9:00 in the domain's selected timezone, beginning with the first eligible Monday after the automation becomes active.

Decan preserves that richer layer before it becomes an execution job.

### Decan source

```decan
intent fivexfive.banneker1.automation.weekly-digest
source
  kind imported_cron
  value "0 9 * * 1"
  created-at "2026-08-26T21:53:00.507Z"
  actor "5xFive Automations UI Phase 2"
time
  point 09:00
  repeat every week
context
  timezone @domain-timezone
reference domain-timezone
  kind context
  source "5xFive domain timezone America/New_York"
lifecycle
  status active
  effective-from 2026-08-31
```

### Expected candidates

With a pinned `America/New_York` timezone snapshot and a finite count horizon, Decan returns point candidates for the weekly local civil time. The point is not merely "Monday"; it is "Monday 09:00 under this explicit timezone evidence and this lifecycle origin."

The case asserts:

- canonicalization is stable;
- validation is valid;
- resolver support is exact;
- materialization creates one occurrence for the selected candidate;
- repeating the same materialization request returns the existing occurrence rather than duplicating it.

### Observed gap

Decan does not read the 5xFive account, infer the domain timezone, poll the automation state, authorize execution, retry the workflow, or prove that the automation completed. Those are product responsibilities. Decan's job is to produce a replayable temporal candidate with evidence.

This is the first important public lesson: Decan is not less useful because it refuses to execute. It is more useful because it cleanly separates temporal meaning from product authority.

## Case 2: Seshat dependency scan scheduling

### Source

Seshat's scan scheduling is a different kind of consumer. It is not just "run every week." A dependency scanner carries policy pressure: avoid noisy windows, respect maintenance cadence, keep evidence around why a scan did or did not happen, and preserve enough detail that a future agent can explain the schedule.

A scheduler might store a cron expression. Proper Time wants the source intent:

> Scan dependencies on a recurring cadence, inside an acceptable maintenance window, with suppression or adjustment when the project is in a blocked state.

### Decan shape

The corpus case uses Decan's temporal vocabulary to separate:

- cadence (`repeat`);
- target window (`window`);
- exceptions (`except`);
- policy references (`@blocked`, `@maintenance-window`);
- lifecycle (`effective-from`, `status active`);
- context evidence (`calendar`, `custom`, or `locale` snapshots depending on the product boundary).

This is where the corpus becomes more than a cron demo. Real systems rarely mean only "at 09:00." They mean "at 09:00 unless this policy is active," "inside a maintenance window," "after approval," "by the end of the period," or "the last business day before a boundary." Decan's job is to preserve the difference among those meanings.

### Expected candidates and derivation

For exact subsets, Decan should return finite candidates with derivation steps that identify the source frame and the snapshot inputs. For unresolved product policy, Decan should return typed needs rather than inventing a maintenance calendar or pretending a blocked state is false.

The case asserts that the executable corpus can detect:

- source/canonical mismatch;
- missing context snapshots;
- unsupported feature families;
- candidate drift;
- materialization drift;
- replay mismatch.

### Observed gap

The Seshat case highlights a boundary: product policy is not temporal core unless it has been represented as evidence. "Project is blocked" is not a fact Decan can observe. "Preferred maintenance window" is not a universal calendar. Decan can carry those facts once supplied; it should not fabricate them.

## Case 3: Cloudflare backward-channel package

### Source

The Cloudflare backward-channel package came from the original primitive exploration because it exposes a richer temporal class: an obligation has time, but not necessarily as a recurrence. It can have:

- creation time;
- deadline;
- expiration;
- grace;
- verification boundary;
- retry window;
- fulfillment state;
- external observation.

Flattening this to "run a job later" loses the core meaning. Proper Time treats obligation timing as temporal intent, not just scheduling machinery.

### Decan shape

The case can represent:

- a relation such as `after @received`;
- a boundary such as `by 2026-09-01`;
- a condition such as `condition gate when @acknowledged`;
- an exception such as `except @revoked`;
- lifecycle state such as `active`, `superseded`, or `retired`.

### Expected evidence

For this case, the important artifact is not only a candidate. It is the evidence chain:

```text
source package event
→ explicit reference snapshot
→ relation / boundary semantics
→ resolver support classification
→ candidate or need
→ materialized occurrence if exact
→ replay check
```

That chain is what lets a later human or agent ask, "Why did Decan think this obligation matured then?" and get an answer grounded in snapshots instead of ambient state.

### Observed gap

Decan does not fulfill obligations. It does not verify that a backward-channel message was sent, delivered, accepted, or acknowledged. A future package can use Decan as the temporal layer, but the protocol layer owns transport, authority, retry, and fulfillment.

## Why this corpus is the endpoint of the initial build

The original Decan goal was not "make a parser." It was to revive a primitive: a human-first, agent-friendly way to represent temporal intent. The corpus is where that goal stops being aesthetic and becomes executable.

The current corpus proves that Decan can:

- accept real product-shaped temporal sources;
- preserve readable source;
- canonicalize deterministic semantics;
- validate them;
- classify exact / needs / unsupported support;
- resolve exact subsets over pinned context;
- materialize selected candidates;
- replay materialization expectations;
- record honest gaps.

That is the natural endpoint of the initial idea. Future work can expand the standard, adapters, hosted tooling, and consumers, but the first primitive is no longer theoretical.

## How to add a corpus case

Add a new directory under `fixtures/consumer-evidence/` containing:

- `authoring.ti` — the readable Decan source;
- `case.json` — expected source, snapshots, candidates, derivation checks, materialization expectations, and observed gaps.

Then run the consumer evidence tests. If the new case needs Decan to infer context, the case is wrong or Decan is missing an explicit adapter. If the case needs execution/fulfillment, the consumer package owns that layer.

## Public promise

The Proper Time corpus makes one public promise:

> Decan will not pretend temporal meaning is simpler than it is.

When Decan can resolve a case exactly, it should do so with evidence. When it cannot, it should say what it needs. When a target format would lose meaning, it should fail closed. That is the standard-shaped core.
