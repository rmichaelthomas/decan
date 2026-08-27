# Decan

Decan is a reference implementation of a readable, deterministic language for temporal intent. It is a temporal core, not a scheduler or execution engine.

## Current state

Decan now includes semantic validation, explicit snapshot-only temporal resolution, civil-time gap/fold handling, SQLite-backed append-only Occurrences, and an executable real-consumer evidence corpus. The available profiles are `syntax-interchange`, `temporal-core`, and `durable-occurrences`; the latter is available only through the SQLite-backed runtime adapter.

The consumer evidence corpus now covers the three portfolio consumers named in the original primitive exploration: 5xFive / Banneker 1 Automations, Seshat dependency scan scheduling, and the Cloudflare backward-channel package. Cases live under [`fixtures/consumer-evidence/`](fixtures/consumer-evidence/) and execute through canonicalization, validation, resolution, derivation checks, materialization, and replay. The post-C6 boundary is documented in [`docs/consumer-evidence-pass.md`](docs/consumer-evidence-pass.md), with locked progress recorded in [`references/decan_checkpoint_v0_9_consumer_evidence.md`](references/decan_checkpoint_v0_9_consumer_evidence.md) and [`references/decan_checkpoint_v1_0_three_consumer_corpus.md`](references/decan_checkpoint_v1_0_three_consumer_corpus.md).

## Boundaries

Decan does not authorize, execute, retry, verify, or fulfill work. It has no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback. The checkpoint chain in [`references/`](references/) is the governing semantic record.
