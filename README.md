# Decan

Decan is a human-first, agent-friendly reference implementation for **Proper Time**: a small temporal-intent language for saying what time means before a scheduler, calendar, workflow, or agent turns it into action.

It is not a scheduler. It is not a calendar server. It is not a job runner. It is a deterministic temporal core: readable source goes in; canonical semantics, pinned evidence, finite resolution candidates, and replayable Occurrences come out.

## Why Decan exists

Cron and [RFC 5545/iCalendar](https://www.rfc-editor.org/rfc/rfc5545.html) recurrence rules are durable, useful standards. They are also shaped around recurrence objects. Decan starts one layer earlier: a person or agent may mean a point, window, relation, condition, boundary, exception, cadence, or context-dependent temporal rule.

Decan's job is to preserve that meaning without collapsing it into a timestamp too early.

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

## What is implemented

- Human-readable authoring and strict canonical source for temporal intent.
- JSON interchange with stable canonical hashes.
- Semantic validation with stable error codes.
- Exact snapshot-only temporal resolution with a public resolver support matrix.
- Explicit context snapshot adapters for timezone, calendar, locale, observer/reference facts, location, participant, availability, astronomical, and custom context.
- Civil-time gap/fold handling from pinned timezone rules.
- Loss-aware cron/RRULE adapters for a small exact weekly subset.
- SQLite-backed append-only Occurrences with materialization/replay checks.
- Executable consumer evidence for 5xFive, Seshat, and the Cloudflare backward-channel package.

## Human-first and agent-friendly

Decan intentionally has multiple surfaces:

- **Human surface:** readable temporal source centered on `time`, not opaque recurrence strings.
- **Canonical surface:** deterministic indentation-structured documents for review and diffing.
- **Programmatic surface:** typed TypeScript objects and JSON interchange.
- **Runtime surface:** validation, exact support classification, deterministic resolution, materialization, and capability reporting.

That was the original design target: humans should not have to think like cron, and agents should not have to guess what a human meant.

## Interop with cron, RRULE, and iCalendar

Decan does not claim to replace RFC 5545/iCalendar. It treats cron and RRULE as interchange targets when fidelity is possible.

The first exact adapter subset supports:

- cron shaped like `0 9 * * 1`;
- RRULE shaped like `FREQ=WEEKLY;INTERVAL=1;BYDAY=MO` with explicit local `DTSTART`;
- Decan weekly civil recurrence plus one clock point and lifecycle origin exported to `DTSTART` + `RRULE`.

Unsupported or lossy shapes fail closed with capability errors. Decan never emits an apparently valid cron/RRULE expression while pretending discarded semantics were preserved.

## Boundaries

Decan does not authorize, execute, retry, verify, or fulfill work. It has no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback.

Missing context remains a typed `need`; supplied context must be explicit evidence. Live observers are out of core. Future observer systems should emit pinned snapshots for Decan to consume.

## Repository map

- [SPEC.md](SPEC.md) — Proper Time / Decan framing and semantic model.
- [docs/conformance.md](docs/conformance.md) — implemented support, invariants, and non-goals.
- [docs/examples.md](docs/examples.md) — examples for source, snapshots, resolution, adapters, and materialization.
- [fixtures/consumer-evidence/](fixtures/consumer-evidence/) — executable real-consumer corpus.
- [references/](references/) — locked checkpoint chain and design history.
- [src/](src/) — TypeScript reference implementation.
- [tests/](tests/) — conformance and regression suite.

## Development

```bash
npm install
npm run typecheck
npm test -- --cache=false
npm run build
```

Decan currently requires Node.js `>=22.13.0` because the durable Occurrences adapter uses `node:sqlite`.

## Status

The initial primitive is built out through the v1.2 world-readiness checkpoint and the v1.3 public-packaging pass:

- `temporal-core.resolve` is exact over Decan's declared support matrix.
- cron/RRULE interop has an exact fail-closed subset.
- live dynamic observers are closed as unsupported in core.
- public packaging now states the Decan / Proper Time positioning, support claims, examples, and non-goals.

No license has been declared yet; treat the repository as not open-source licensed until that is chosen explicitly.
