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
- Loss-aware cron/RRULE adapters for a small exact weekly subset, each with a `TemporalLossReport` that records exact preservation or an explicit unsupported conversion.
- SQLite-backed append-only Occurrences with materialization/replay checks.
- Executable consumer evidence for 5xFive, Seshat, and the Cloudflare backward-channel package.
- A CLI for direct parsing, validation, support classification, resolution, adapter interop, and materialization.
- An MCP stdio server exposing Decan tools, resources, and prompts to agent hosts.
- Public Proper Time dissemination materials: corpus page, launch argument, and standalone landing page.

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

Unsupported or lossy shapes fail closed with capability errors. Every adapter result includes a `TemporalLossReport`: exact conversions name the preserved semantics, while rejected conversions name the consequence and remediation. Decan never emits an apparently valid cron/RRULE expression while pretending discarded semantics were preserved.

## Boundaries

Decan does not authorize, execute, retry, verify, or fulfill work. It has no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback.

Missing context remains a typed `need`; supplied context must be explicit evidence. Live observers are out of core. Future observer systems should emit pinned snapshots for Decan to consume.

## Repository map

- [SPEC.md](SPEC.md) — Proper Time / Decan framing and semantic model.
- [docs/conformance.md](docs/conformance.md) — implemented support, invariants, and non-goals.
- [docs/examples.md](docs/examples.md) — examples for source, snapshots, resolution, adapters, and materialization.
- [docs/proper-time-corpus.md](docs/proper-time-corpus.md) — public corpus map for real temporal-intent evidence cases.
- [docs/launch-argument.md](docs/launch-argument.md) — long-form public argument for the layer before schedules.
- [Scientific-Time Spike](docs/scientific-time-spike.md) — mission-planning evidence and the scientific-time escalation gate.
- [Managed Services Exploration](docs/managed-services-exploration.md) — open-core and managed-service product boundary.
- [site/index.html](site/index.html) — standalone landing page for Decan / Proper Time.
- [fixtures/consumer-evidence/](fixtures/consumer-evidence/) — executable real-consumer corpus.
- [references/](references/) — locked checkpoint chain and design history.
- [src/](src/) — TypeScript reference implementation.
- [tests/](tests/) — conformance and regression suite.

## CLI

After building, Decan exposes a command surface:

```bash
npm run build
node dist/cli/index.js canonicalize fixtures/consumer-evidence/5xfive-banneker1-cron-trigger/authoring.ti
node dist/cli/index.js import-cron "0 9 * * 1" --effective-from 2026-08-27
```

When installed as a package, the binaries are:

```bash
decan canonicalize intent.ti
decan validate intent.ti
decan support intent.ti
decan resolve intent.ti --reference-time 2026-08-27T12:00:00Z --horizon-count 3 --context context.json
decan import-cron "0 9 * * 1" --effective-from 2026-08-27
decan import-rrule --dtstart 20260831T090000 --rrule FREQ=WEEKLY\;INTERVAL=1\;BYDAY=MO
decan materialize --intent-id example.weekly --intent-version 1 --resolution resolution.json --candidate-id sha256:candidate --recorded-at 2026-08-27T21:53:00Z
```

## MCP

Decan also ships a stdio MCP server:

```bash
decan-mcp
```

It exposes these tools:

- `decan_canonicalize`
- `decan_validate`
- `decan_classify_support`
- `decan_resolve`
- `decan_import_cron`
- `decan_import_rrule`
- `decan_export_rrule`
- `decan_materialize`

It also exposes read-only resources for the spec, conformance guide, Proper Time corpus, and launch argument, plus prompts for explaining temporal intent and converting schedules into Decan with honest gaps.

## Development

```bash
npm install
npm run typecheck
npm test -- --cache=false
npm run build
```

Decan currently requires Node.js `>=22.13.0` because the durable Occurrences adapter uses `node:sqlite`.

## Public site

The static Decan showcase lives in [`site/`](site/index.html). After this repository's Pages source is set to **GitHub Actions**, the deployment workflow publishes only that directory after pushes to `main`.

## Status

The initial primitive is built out through the v1.2 world-readiness checkpoint, v1.3 public-packaging pass, v1.4 public-interface sprint, and v1.5 release, loss-evidence, scientific-time, and service-exploration sprint:

- `temporal-core.resolve` is exact over Decan's declared support matrix.
- cron/RRULE interop has an exact fail-closed subset.
- live dynamic observers are closed as unsupported in core.
- public packaging now states the Decan / Proper Time positioning, support claims, examples, and non-goals.
- CLI and MCP surfaces now make Decan directly usable by humans, scripts, CI, and agent hosts.
- adapter outputs now carry `TemporalLossReport` evidence for exact and unsupported cron/RRULE conversions.
- the scientific-time spike demonstrates satellite and mission-planning applicability with pinned astronomical snapshots, without claiming scientific-scale transformation or ephemeris authority.
- service exploration defines managed snapshot, MCP, replay, and connector possibilities that remain outside the open temporal core.

Decan is licensed under [Apache-2.0](LICENSE). The core, reference implementation, and public specification materials are reusable infrastructure; managed snapshot, MCP, audit, and connector services remain separate products.
