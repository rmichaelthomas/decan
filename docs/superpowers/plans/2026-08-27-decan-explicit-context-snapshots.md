# Decan Explicit Context Snapshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Decan's explicit context snapshot layer first-class without adding ambient locale, timezone, clock, geolocation, network, or dynamic-observer fallback.

**Architecture:** Keep the resolver pure: callers supply immutable, versioned snapshots and Decan resolves only from those inputs. Add small provider constructors for timezone, business calendar, location, participant, availability, astronomical, custom, and reference snapshots, while retaining the existing locale and observer helpers. Capability reporting names this as an exact adapter seam, not a live capture system.

**Tech Stack:** Node.js >=22.13, TypeScript strict, Vitest, existing Decan model/provider/runtime modules.

**Spec:** `references/scheduling_language_checkpoint_v0_5_runtime_reference_conformance.md` §51; `references/decan_checkpoint_v1_0_three_consumer_corpus.md` resume boundary; README boundary note on no ambient fallback.

## Global Constraints

- Do not access host clock, host locale, host timezone, device/browser geography, network, live calendars, or observers.
- Missing inputs remain typed resolution `needs`, never guessed defaults.
- Do not add Binding, authority, execution, retry, verification, fulfillment, scheduler service, cron/RRULE import, or live observer behavior.
- Use failing tests before production code changes.
- Keep Decan a single private TypeScript package.

---

### Task 1: Prove the explicit context adapter seam

**Files:**

- Create: `tests/post_c6/context-snapshots.test.ts`
- Modify later: `src/providers/context-snapshots.ts`, `src/index.ts`

**Interfaces:**

- Consumes existing `resolveExpression`, `ContextSnapshot`, and `ReferenceSnapshot`.
- Produces exported constructors that return immutable Decan snapshot records.

- [ ] **Step 1: Write failing tests**

```ts
const zone = timezoneSnapshot({ id: "America/New_York", version: "tzdb-2026a", initialOffsetMinutes: -300, transitions: [] });
expect(resolveExpression({ referenceTime: "2026-01-01T00:00:00Z", horizon: { kind: "count", value: 1 }, context: [zone], expression: { kind: "point", value: { kind: "clock", hour: 9, minute: 0 } } })).toMatchObject({ ok: true, value: { status: "resolved" } });
```

- [ ] **Step 2: Run the focused test and verify it fails because the constructors are missing**

Run: `npm test -- --cache=false tests/post_c6/context-snapshots.test.ts`

Expected: FAIL with missing exported constructors.

- [ ] **Step 3: Implement minimal constructors**

Create `src/providers/context-snapshots.ts` with pure object constructors only. No constructor may call `Date.now`, `Intl`, `navigator`, filesystem, network, process locale, or host timezone APIs.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --cache=false tests/post_c6/context-snapshots.test.ts`

Expected: PASS.

### Task 2: Advertise and document the boundary

**Files:**

- Modify: `src/capabilities/temporal-core.ts`, `tests/c6/profile-boundary.test.ts`, `README.md`
- Create: `references/decan_checkpoint_v1_1_explicit_context_snapshots.md`

**Interfaces:**

- Consumes existing `CapabilityManifest`.
- Produces feature id `explicit-context-snapshot-adapters` with exact support for `resolve`.

- [ ] **Step 1: Add failing capability expectation**

```ts
expect(createTemporalCoreRuntime().capabilities()).toMatchObject({
  ok: true,
  value: { features: expect.arrayContaining([{ id: "explicit-context-snapshot-adapters", support: { resolve: "exact" } }]) }
});
```

- [ ] **Step 2: Implement the capability feature**

Add the feature without changing operation-level `resolve: "partial"` and without changing `live-dynamic-observers`.

- [ ] **Step 3: Update README and checkpoint**

Document that these are caller-supplied snapshot constructors, not live capture or fallback.

- [ ] **Step 4: Verify and commit**

Run: `npm run typecheck`, `npm test -- --cache=false`, and `npm run build`; commit the sprint if all pass.
