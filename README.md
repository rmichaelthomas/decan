# Decan

Decan is a reference implementation of a readable, deterministic language for temporal intent. It is a temporal core, not a scheduler or execution engine.

## Current state

The carried-forward baseline implements the verified C0/C1 `syntax-interchange` profile: strict source parsing, normalization, canonical printing, canonical JSON interchange, and stable identities. The C2–C6 implementation plan is tracked in [`docs/superpowers/plans/2026-08-27-decan-c2-c6.md`](docs/superpowers/plans/2026-08-27-decan-c2-c6.md).

## Boundaries

Decan does not authorize, execute, retry, verify, or fulfill work. It has no ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback. The checkpoint chain in [`references/`](references/) is the governing semantic record.
