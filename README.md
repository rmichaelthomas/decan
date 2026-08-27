# Decan

Decan is a reference implementation of a readable, deterministic language for temporal intent. It is a temporal core, not a scheduler or execution engine.

## Current state

Decan now includes semantic validation, explicit snapshot-only temporal resolution, civil-time gap/fold handling, SQLite-backed append-only Occurrences, and an executable real-consumer evidence corpus. The available profiles are `syntax-interchange`, `temporal-core`, and `durable-occurrences`; the latter is available only through the SQLite-backed runtime adapter.

The first real consumer case is 5xFive / Banneker 1 Automations: a Cloudflare-cron-shaped schedule trigger (`0 9 * * 1`) represented as pinned Decan evidence under [`fixtures/consumer-evidence/5xfive-banneker1-cron-trigger/`](fixtures/consumer-evidence/5xfive-banneker1-cron-trigger/). The post-C6 boundary is documented in [`docs/consumer-evidence-pass.md`](docs/consumer-evidence-pass.md), and the current locked checkpoint is [`references/decan_checkpoint_v0_9_consumer_evidence.md`](references/decan_checkpoint_v0_9_consumer_evidence.md).

## Boundaries

Decan does not authorize, execute, retry, verify, or fulfill work. It has no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback. The checkpoint chain in [`references/`](references/) is the governing semantic record.
