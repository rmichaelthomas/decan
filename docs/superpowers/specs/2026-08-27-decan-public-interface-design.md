# Decan v1.4 Public Interface Design

## Goal

Turn Decan from a verified reference implementation into a public-facing primitive with direct human, script, and agent entrypoints.

## Context

The initial Decan primitive is already complete through the world-readiness checkpoint: exact resolver subset, explicit context snapshots, cron/RRULE adapters, materialization/replay, and a three-consumer evidence corpus. v1.4 adds dissemination and interaction surfaces without changing core temporal semantics.

## Design Context

Audience: standards-minded builders, agent developers, scheduling-system maintainers, protocol designers, and technically curious operators.

Use cases:

- understand Proper Time as the layer before schedules;
- run Decan directly from a terminal;
- expose Decan to agent hosts through MCP;
- inspect real consumer evidence;
- evaluate the project without overclaiming release maturity.

Tone: audacious but exacting; public enough to invite critique, precise enough not to pretend Decan is a standard, calendar server, scheduler, or full RFC 5545 implementation.

## Architecture

v1.4 adds one shared operation layer under `src/interface/operations.ts`. The CLI and MCP server both call that layer, so public behavior does not fork.

```text
Decan core modules
      ↓
src/interface/operations.ts
      ↓                  ↓
src/cli/*          src/mcp/server.ts
```

Public documentation grows in parallel:

- `docs/proper-time-corpus.md` explains the executable corpus and its consumer cases.
- `docs/launch-argument.md` provides the long-form public argument.
- `site/index.html` gives a standalone landing page.
- `README.md` links the whole surface together.

## CLI

The CLI supports:

- `canonicalize`
- `validate`
- `support`
- `resolve`
- `import-cron`
- `import-rrule`
- `export-rrule`
- `materialize`

The CLI returns JSON for every command. Successful Decan operations exit `0`; Decan operation failures exit `1`; command usage/input failures exit `2`.

The CLI does not read ambient timezone, locale, clock, network, or calendars. Context and references are supplied as JSON files.

## MCP

The MCP server uses the official `@modelcontextprotocol/server` v2 package and serves over stdio. It exposes:

- tools for Decan operations;
- read-only resources for the spec, conformance guide, corpus, and launch argument;
- prompts for explanation and conversion workflows.

The MCP server is not a scheduler, does not execute external work, and does not observe live systems. It gives agents a stricter temporal interface between conversational scheduling intent and downstream action.

## Public materials

The landing page is editorial-standard rather than SaaS-dashboard: precise, typographic, readable, and built around the primitive. The corpus page explains why real evidence matters. The launch argument gives Rob a serious public articulation of Decan / Proper Time without flattening it into "a scheduling DSL."

## Release posture

The package remains `"private": true` and no license is declared until Rob chooses an explicit license/release posture. v1.4 prepares the public interface; it does not silently publish or open-source the repository.

## Verification

Required verification:

- focused public-interface tests;
- package surface tests;
- full test suite;
- typecheck;
- build;
- package dry-run;
- emitted CLI smoke test;
- emitted MCP construction smoke test.
