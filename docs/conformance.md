# Decan Conformance

This document states what the current Decan reference implementation claims and what it deliberately does not claim.

## Profiles

| Profile | Status | Scope |
|---|---:|---|
| `syntax-interchange` | exact | parse, canonicalize, print, JSON interchange, stable identities |
| `temporal-core` | exact | semantic validation, resolver support classification, snapshot-only resolution |
| `durable-occurrences` | exact | materialize resolved candidates into append-only Occurrence storage |

`durable-occurrences` is available only with an Occurrence store. The SQLite adapter is the durable conformance target.

## Resolver support

`temporal-core.resolve` is exact over Decan's declared support matrix. This means every expression family is handled deterministically as one of:

- candidate-producing;
- typed dependency need;
- explicit conflict;
- unsupported feature need.

It does not mean every temporal idea produces a timestamp.

Use `classifyResolveSupport(expression)` to inspect support before resolution.

## Exact implemented seams

- readable/canonical source normalization;
- JSON interchange round-tripping;
- semantic validation;
- explicit point and window handling;
- civil recurrence with lifecycle origin;
- elapsed sub-day recurrence from explicit instant origin;
- relation offsets from date or instant references;
- business-day offsets with explicit calendar snapshots;
- semantic windows with explicit locale/custom snapshots;
- explicit observer/reference snapshots for gated conditions;
- explicit context snapshot adapters;
- civil-time gap/fold behavior from pinned zone rules;
- append-only materialization;
- exact weekly cron/RRULE import/export subset;
- CLI commands for canonicalize, validate, support, resolve, import/export, and materialize;
- MCP stdio tools, read-only resources, and prompts for agent hosts.

## Adapter support

Cron/RRULE adapter support is exact only for the first weekly subset:

- five-field cron;
- single numeric minute;
- single numeric hour;
- wildcard day-of-month;
- wildcard month;
- single weekday;
- weekly RRULE with `INTERVAL=1`;
- explicit local `DTSTART`;
- optional single `BYDAY` matching `DTSTART`.

Unsupported or lossy shapes return capability errors. They are not silently approximated.

## Human-first claim

Decan meets the human-first design goal by providing:

- readable source syntax;
- canonical text that is deterministic and reviewable;
- source records that remain immutable evidence;
- semantic windows and relations that do not collapse prematurely into timestamps;
- visible unresolved needs and conflicts.

## Agent-friendly claim

Decan meets the agent-friendly design goal by providing:

- typed public operations;
- strict success/failure envelopes;
- stable content identities;
- deterministic finite resolution;
- capability manifests;
- support classification;
- explicit snapshot inputs;
- derivation-bearing candidates;
- idempotent materialization;
- CLI and MCP surfaces that expose the same core behavior without ambient host inference.

## Non-conformant behavior

A Decan-compatible implementation must not:

- invent timezone, locale, location, calendar, or observer context;
- fetch live data during core resolution;
- treat understanding as authority;
- treat execution as fulfillment;
- silently degrade unsupported cron/RRULE semantics;
- rewrite original intent with resolved timestamps;
- hide conflicts by choosing a policy without an explicit input.

## Current non-goals

- Full RFC 5545/iCalendar import/export.
- Full RRULE semantics.
- Cron ranges, steps, lists, macros, or non-weekly schedules.
- Live dynamic observers in core.
- Natural-language parsing beyond source/authoring evidence.
- A hosted scheduler service.
- Public governance or standards-submission process.
