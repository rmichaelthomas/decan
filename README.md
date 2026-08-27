# Decan

Decan is a reference implementation of a readable, deterministic language for temporal intent. It is a temporal core, not a scheduler or execution engine.

## Current state

Decan now includes semantic validation, exact snapshot-only temporal resolution with a resolver support matrix, explicit context snapshot adapters, loss-aware cron/RRULE adapters for exact weekly subsets, civil-time gap/fold handling, SQLite-backed append-only Occurrences, and an executable real-consumer evidence corpus. The available profiles are `syntax-interchange`, `temporal-core`, and `durable-occurrences`; the latter is available only through the SQLite-backed runtime adapter.

The consumer evidence corpus now covers the three portfolio consumers named in the original primitive exploration: 5xFive / Banneker 1 Automations, Seshat dependency scan scheduling, and the Cloudflare backward-channel package. Cases live under [`fixtures/consumer-evidence/`](fixtures/consumer-evidence/) and execute through canonicalization, validation, resolution, derivation checks, materialization, and replay. The post-C6 boundary is documented in [`docs/consumer-evidence-pass.md`](docs/consumer-evidence-pass.md), with locked progress recorded in [`references/decan_checkpoint_v0_9_consumer_evidence.md`](references/decan_checkpoint_v0_9_consumer_evidence.md) and [`references/decan_checkpoint_v1_0_three_consumer_corpus.md`](references/decan_checkpoint_v1_0_three_consumer_corpus.md).

## Explicit context snapshots

Decan can consume caller-supplied, immutable, versioned snapshots for timezone rules, business calendars, locale periods, observer/reference facts, location, participant context, availability, astronomical context, and custom context. These constructors are adapters from evidence into Decan's resolution frame; they are not live capture providers.

## Interop adapters

Cron and RRULE are interchange targets, not Decan's semantic ceiling. Decan imports and exports only a small exact weekly subset: one local clock time, weekly civil recurrence, explicit lifecycle origin, and no hidden timezone/calendar lookup. Unsupported or lossy cron/RRULE shapes fail closed with capability errors.

## Boundaries

Decan does not authorize, execute, retry, verify, or fulfill work. It has no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback. Missing context remains a typed `need`; supplied context must be explicit evidence. Live observers are out of core; future observer systems should emit pinned snapshots for Decan to consume. The checkpoint chain in [`references/`](references/) is the governing semantic record, with world-readiness closure locked in [`references/decan_checkpoint_v1_2_world_readiness.md`](references/decan_checkpoint_v1_2_world_readiness.md).
