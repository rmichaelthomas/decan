# Decan

Decan is a reference implementation of a readable, deterministic language for temporal intent. It is a temporal core, not a scheduler or execution engine.

## Current state

Decan now includes semantic validation, explicit snapshot-only temporal resolution, civil-time gap/fold handling, and SQLite-backed append-only Occurrences. The available profiles are `syntax-interchange`, `temporal-core`, and `durable-occurrences`; the latter is available only through the SQLite-backed runtime adapter. The post-C6 boundary is documented in [`docs/consumer-evidence-pass.md`](docs/consumer-evidence-pass.md).

## Boundaries

Decan does not authorize, execute, retry, verify, or fulfill work. It has no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback. The checkpoint chain in [`references/`](references/) is the governing semantic record.
