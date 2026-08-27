# Decan World Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining core readiness gaps by replacing vague resolver partiality with an exact support matrix and adding loss-aware cron/RRULE adapters for safe exact subsets.

**Architecture:** Keep Decan core deterministic and evidence-first. Resolver exactness means every expression family has a declared outcome class: exact resolved behavior, exact typed dependency needs, exact conflict behavior, or exact unsupported feature needs. Cron/RRULE adapters are import/export utilities for recurrence interchange; they support only exact subsets and return structured unsupported/lossy reports otherwise.

**Tech Stack:** Node.js >=22.13, TypeScript strict, Vitest, existing Decan model/runtime modules. RFC 5545 is the external standard reference for iCalendar recurrence concepts.

**Spec:** `references/scheduling_language_checkpoint_v0_5_runtime_reference_conformance.md` §§51 and capabilities guidance; `references/decan_checkpoint_v1_1_explicit_context_snapshots.md`; RFC 5545 §§3.3.10 and 3.8.5.

## Global Constraints

- Do not add execution, authority, verification, fulfillment, scheduler service, live observers, or ambient fallback.
- Resolver exactness is classification exactness across Decan's AST, not a claim that every semantic idea yields candidates.
- Missing context and references remain typed `needs`.
- Unsupported expression families remain explicit feature needs.
- Cron/RRULE adapters must be loss-aware and fail closed.
- No adapter may fetch timezone, locale, calendar, or network state.

---

### Task 1: Exact resolver support matrix

**Files:**

- Create: `src/resolution/support-matrix.ts`, `tests/c3/resolve-support-matrix.test.ts`
- Modify: `src/model/types.ts`, `src/capabilities/temporal-core.ts`, `src/index.ts`, `tests/c6/profile-boundary.test.ts`

**Interfaces:**

- Produces `classifyResolveSupport(expression: TemporalExpression): ResolveSupportReport`.
- Produces `ResolveSupportKind = "exact" | "needs" | "unsupported" | "conflicted"`.

- [ ] **Step 1: Write failing tests for matrix coverage**

Test every Decan expression kind: point, window, repeat, selection, relation, offset, duration, condition, boundary, exception, adjustment, compound.

- [ ] **Step 2: Write failing capability tests**

Expect temporal-core `resolve` to be `exact`, with feature `resolve-support-matrix` exact and live observers still pending.

- [ ] **Step 3: Implement matrix and capability promotion**

The matrix must not execute resolution. It must describe known behavior.

### Task 2: Loss-aware cron/RRULE adapters

**Files:**

- Create: `src/adapters/cron-rrule.ts`, `tests/post_c6/cron-rrule-adapters.test.ts`
- Modify: `src/index.ts`, `src/capabilities/temporal-core.ts`, `tests/c6/profile-boundary.test.ts`, `README.md`

**Interfaces:**

- Produces `importCronExpression(request): CronAdapterResult`.
- Produces `importRRule(request): RRuleAdapterResult`.
- Produces `exportRRule(request): RRuleAdapterResult`.

- [ ] **Step 1: Write failing tests for exact imports**

Cron `0 9 * * 1` imports to a weekly Monday 09:00 compound expression. RRULE `FREQ=WEEKLY;INTERVAL=1` with explicit `DTSTART` imports to weekly recurrence plus clock.

- [ ] **Step 2: Write failing tests for fail-closed unsupported/lossy cases**

Cron wildcards that imply multiple times per day, unsupported macros, RRULE `BYSETPOS`, `COUNT`, `UNTIL`, `BYMONTHDAY`, or multiple BYDAY values must return non-ok unsupported results, not partial expressions.

- [ ] **Step 3: Implement minimal exact subset**

Support only five-field cron where minute/hour are single numbers, day-of-week is a single value, day-of-month and month are wildcards. Support RRULE weekly interval with optional single BYDAY matching the `DTSTART` weekday.

- [ ] **Step 4: Verify and commit**

Run focused red/green checks, then full typecheck, full tests, and build before commit.
