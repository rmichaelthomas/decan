# Decan C2–C6 Implementation Design

**Status:** Approved design — implementation planning next
**Date:** August 27, 2026
**Scope:** Carry the verified C0/C1 reference into a new local Decan repository, then implement the checkpoint-approved C2 through C6 path.

## Purpose

Decan is a single private TypeScript package through C6. It carries the verified C0/C1 `syntax-interchange` implementation forward as its initial baseline, preserves the full checkpoint chain under `references/`, and grows only the temporal-core capabilities prescribed by the v0.7 roadmap. A package split is deliberately deferred until post-C6 consumer evidence demonstrates a useful boundary.

## Repository Shape

```text
decan/
  src/
    model/             # public contracts and temporal AST
    syntax/             # C0/C1 parser and normalization
    canonical/          # C0/C1 printing and identity
    interchange/        # C0/C1 strict interchange
    runtime/            # profile-scoped runtime adapters
    validation/         # C2 semantic admissibility
    providers/          # immutable versioned provider snapshot ports
    resolution/         # C3-C5 finite candidate evaluation
    materialization/    # C6 candidate-to-Occurrence seam
    occurrences/        # C6 append-only stores and projections
    capabilities/       # one support registry used by every stage
  tests/
    c0/ c1/ c2/ c3/ c4/ c5/ c6/
  fixtures/
    c1/ c2/ c3/ c4/ c5/ c6/
  references/           # copied immutable v0.1-v0.7 checkpoint chain
  docs/
    superpowers/specs/
    superpowers/plans/
```

The initial commit contains tracked source, tests, fixtures, package and TypeScript configuration, lockfile, checkpoint references, and project documentation. It excludes generated `dist/` output and installed dependencies. The package remains private while the core is proven.

## Stage Architecture

### C2 — Semantic Validation

`validation/` implements the public `validate()` operation as a pure semantic pass over `NormalizedDocument`. It returns the existing `ValidateResult` shape, including stable validation errors and declared but unresolved dependencies. It never fetches a provider, chooses an ambiguity, or changes source semantics.

C2 enforces only static rules: legal AST combinations, duration/recurrence mode compatibility, dependency declarations, detectable reference cycles, adjustment conflicts, and lifecycle/recurrence invariants. Semantic invalidity is distinct from a valid declaration whose dependencies are unavailable at resolution time.

### C3–C5 — Exact Temporal Core

`providers/` exposes narrow immutable, versioned snapshot inputs. `resolution/` consumes those inputs and an explicit frame containing reference time and finite horizon. It performs no network, host-clock, locale, zone, geography, or observer access.

Exact feature work follows the v0.5 support-matrix dependency order: explicit points and windows with named zone rules; recurrence with lifecycle origin; deterministic selection; offsets from explicit/snapshot references; business calendars; resolved exceptions; one-applicable adjustment and explicit conflicts; and registered versioned semantic windows. Locale-aware periods use only explicit, recorded participant/device locale context plus an explicit provider/version; absent inputs remain typed needs. Dynamic observers remain pending and cron/RRULE remain unsupported.

C3 uses golden fixtures for composed scenarios. C4 adds metamorphic properties for invariant-preserving changes. C5 adds pinned civil-time differential fixtures for DST gaps/folds and elapsed-versus-calendar behavior.

### C6 — Durable Occurrences

`materialization/` accepts only a fully resolved, unconflicted, explicitly identified candidate from an intact resolution. It produces the locked temporal Occurrence without selecting candidates or initiating work. `occurrences/` implements an in-memory store plus a SQLite conformance adapter sharing the locked append-only contract.

SQLite must enforce `(intent_id, occurrence_key)` uniqueness transactionally. Tests cover convergent concurrent materialization, event append-only behavior, and `asOf` projections. No store, event, or API introduces Binding, Action, Claim, Attempt, authority, execution, retry, result, verification, or fulfillment state.

## Runtime Profiles and Capabilities

The existing `syntax-interchange` adapter remains explicit about its C0/C1 boundary. C2–C5 add a `temporal-core` implementation only once the required exact conformance evidence exists. C6 adds `durable-occurrences` only once the SQLite suite passes. A single versioned capability registry remains the source of truth for parse, validate, resolve, materialize, inspect, explain, and persistence support; a feature is never silently approximated because it parsed.

## Error Handling and Explanation

Operation failure remains separate from temporal state. C2 validation errors use stable `TemporalError` codes and source paths; C3–C5 report unresolved, partially resolved, and conflicted results as successful temporal observations where appropriate. Structured derivation, snapshots, assumptions, needs, identities, and provider versions remain authoritative. Plain human explanation and localization are presentation-only projections and may not claim authorization or execution.

## Verification Strategy

Every stage begins with focused failing tests, then its minimal implementation, then focused/full test, strict type-check, and build verification. Portable fixtures pin all relevant zone-rule, calendar, locale, window, and reference-snapshot versions. C6 additionally requires real SQLite transaction/concurrency evidence. Each completed stage receives an independently reviewable commit.

## Non-Goals Through C6

- No ambient, geographic, host, IP, universal, or hidden locale fallback.
- No dynamic observers or live data fetches.
- No cron/RRULE adapters or compilation claims.
- No scheduler service, job queue, Binding, authority, execution, retry, verification, or fulfillment behavior.
- No premature multi-package split.

## Post-C6 Gate

After C6, Decan enters a real-world consumer and evidence pass. That evidence determines whether hardening, adapters, consumer integrations, or a future package split are warranted. The standing preference is hardening and real consumers before downstream execution work.
