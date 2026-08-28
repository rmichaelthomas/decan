# Decan Checkpoint v1.5 — Release Posture, Loss Evidence, Scientific-Time Spike, and Service Exploration

**Date:** 2026-08-27  
**Status:** LOCKED decisions; implementation sprint authorized  
**Extends:** `decan_checkpoint_v1_4_public_interface.md`

## Purpose

This checkpoint records the choices made after reviewing the actual Decan repository at `98eaafa` and its history through `2d405f8`. It distinguishes what Decan already demonstrates from the next release, adapter, scientific-profile, and commercial-boundary work.

## Verified current state

At this checkpoint Decan has:

- C2 semantic validation, C3–C5 snapshot-pinned temporal resolution, and C6 SQLite-backed append-only Occurrences;
- exact/needs/unsupported capability reporting;
- exact, fail-closed weekly cron and RRULE interoperability;
- explicit timezone, calendar, locale, observer, location, participant, availability, astronomical, custom, and reference snapshots;
- three executable consumer cases: 5xFive, Seshat, and the Cloudflare backward-channel package;
- a CLI and a real stdio MCP surface using the official MCP server SDK.

The general resolver is exact over its declared support matrix. That does not claim every legal temporal expression produces a timestamp or that Decan provides full RFC 5545, orbital, or scientific-time support.

## Gemini synthesis

The external review correctly identified several existing Decan properties: temporal intent is distinct from scheduling and execution; resolution is snapshot-only; adapters fail closed; and MCP is a natural agent-facing surface. The repository now proves these claims rather than merely describing them.

The remaining useful additions are:

1. a public, uniform loss-report profile for adapters;
2. standards-shaped specification and conformance artifacts that can mature beyond the TypeScript reference implementation;
3. managed snapshot, MCP, replay, and connector explorations outside the core;
4. an evidence-backed scientific-time investigation.

The suggested direct translation from a resolved candidate into an execution DAG remains non-conformant when it bypasses Decan's downstream Binding/Execution Case boundary.

## Locked decisions

### Apache-2.0 release posture

**Decision:** Decan's repository source, reference implementation, and public specification artifacts will use Apache License 2.0. LOCKED.

The initial release implementation adds the standard root `LICENSE`, declares `Apache-2.0` in package metadata, and updates the public release posture. A `NOTICE` file is not invented unless this repository has attribution content that requires it.

### Temporal Loss Report

**Decision:** Adapter outputs will use a first-class `TemporalLossReport` profile. LOCKED.

The report is adapter evidence, not a license for silent approximation. It names the source/target identity and version, operation, fidelity, preserved semantics, discarded semantics, assumptions, consequences, and remediation. Default adapter behavior remains exact-or-fail-closed. The v1.5 implementation records `exact` and `unsupported` results; `lossy` is reserved for a future adapter that explicitly opts into a documented approximation.

### Scientific-time investigation

**Decision:** Run an executable, no-core-change scientific mission-planning spike. LOCKED.

The spike proves whether Decan can preserve a relationship such as "30 elapsed seconds after authoritative eclipse entry" when the event and astronomical evidence are supplied as immutable snapshots. It also records the boundary: Decan does not yet model tagged TAI/UTC/GPS/Galileo time scales, leap-second `:60`, ephemeris computation, relativistic transformations, or clock domains.

The spike's decision gate is:

- if authoritative upstream systems provide converted ISO instants, publish a Mission-Planning Snapshot Profile using current Decan primitives;
- if Decan must itself compare or transform scientific time scales, propose a later Scientific Time Profile with typed scale-aware instants and conversion evidence. Do not hide that work in generic context values.

### Managed-service exploration

**Decision:** Begin a product-boundary exploration for signed snapshots, replay/audit evidence, managed MCP, and enterprise connectors. LOCKED.

This is not authorization to add a hosted service or live I/O to Decan core. The exploration produces a boundary map and testable product hypotheses. The open core remains deterministic and self-hostable; commercial value is managed context freshness, signing, retention, operations, and organizational integration.

## Continuing boundaries

- Decan remains a temporal core, not a scheduler, job runner, calendar server, authority system, or executor.
- Inputs affecting temporal truth remain explicit, immutable, versioned snapshots.
- No core resolver may fetch, poll, subscribe, inspect host state, or infer a missing scientific/locale/timezone fact.
- Scientific event generation, orbital mechanics, and physical clock transformation remain external providers unless a future profile explicitly standardizes their evidence boundary.

## Sprint acceptance criteria

1. Apache-2.0 license text and metadata are present and public documentation no longer says Decan is unlicensed.
2. cron/RRULE exact and unsupported results expose a test-backed `TemporalLossReport`.
3. An executable scientific mission-planning case proves the current snapshot boundary and a checked document records the escalation gate.
4. A service-boundary document makes the open-core/commercial separation, non-goals, hypotheses, and validation signals explicit.

