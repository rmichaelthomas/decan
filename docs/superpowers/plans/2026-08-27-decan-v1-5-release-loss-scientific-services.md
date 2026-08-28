# Decan v1.5 Release, Loss, Scientific-Time, and Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Apache-2.0 release posture, adapter loss evidence, a scientific mission-planning spike, and managed-service exploration artifacts without expanding Decan's execution boundary.

**Architecture:** Keep release posture in package/documentation files; place `TemporalLossReport` in a focused adapter module and attach it to exact adapter results and unsupported capability-error details. Treat the scientific and service work as executable/documented evidence, not as live services or scientific-time core semantics.

**Tech Stack:** TypeScript, Vitest, Node.js 22, npm package metadata, Markdown.

**Spec:** `references/decan_checkpoint_v1_5_release_loss_scientific_services.md`

## Global Constraints

- Core resolution remains snapshot-only; no host clock, network, geolocation, polling, or live observer access.
- No Binding, execution, retry, authority, verification, or fulfillment behavior may be introduced.
- Default adapter behavior stays exact-or-fail-closed; no lossy conversion is added in this sprint.
- Scientific-time work must not claim time-scale conversion, leap-second support, ephemeris solving, or relativistic calculation.
- Use test-first red/green cycles for every production behavior change.

---

### Task 1: Apache-2.0 release posture

**Files:**
- Create: `LICENSE`
- Modify: `package.json`
- Modify: `README.md`
- Test: `tests/post_c6/release-posture.test.ts`

**Interfaces:**
- Produces: package metadata `license: "Apache-2.0"` and an Apache-2.0 root license artifact.

- [ ] **Step 1: Write the failing release-posture test**

```ts
expect(packageJson.license).toBe("Apache-2.0");
expect(readFileSync(resolve(root, "LICENSE"), "utf8")).toContain("Apache License");
expect(readFileSync(resolve(root, "README.md"), "utf8")).not.toContain("No license has been declared yet");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/post_c6/release-posture.test.ts`

- [ ] **Step 3: Add the standard Apache-2.0 license and release metadata**

Add the unmodified Apache-2.0 license text at `LICENSE`, add `"license": "Apache-2.0"` to `package.json`, and replace the README unlicensed status with Apache-2.0 release wording.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- tests/post_c6/release-posture.test.ts`

### Task 2: Temporal Loss Report profile

**Files:**
- Create: `src/adapters/loss-report.ts`
- Modify: `src/adapters/cron-rrule.ts`
- Modify: `src/index.ts`
- Test: `tests/post_c6/temporal-loss-report.test.ts`

**Interfaces:**
- Produces: `TemporalLossReport`, `exactLossReport()`, and `unsupportedLossReport()`.
- Produces: exact adapter result `lossReport`; unsupported adapter error `details.lossReport`.

- [ ] **Step 1: Write failing exact and unsupported report tests**

```ts
expect(importCronExpression(exactRequest)).toMatchObject({
  ok: true,
  value: { lossReport: { fidelity: "exact", target: "cron", discarded: [] } }
});
expect(importCronExpression(unsupportedRequest)).toMatchObject({
  ok: false,
  errors: [{ details: { lossReport: { fidelity: "unsupported", target: "cron" } } }]
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/post_c6/temporal-loss-report.test.ts`

- [ ] **Step 3: Implement minimal report constructors and wire all adapter exits**

Define immutable report fields for source, target, target version, operation, fidelity, preserved/discarded semantics, assumptions, consequences, and remediation. Add exact reports to import/export results and unsupported reports to capability-error details.

- [ ] **Step 4: Run focused adapter tests**

Run: `npm test -- tests/post_c6/temporal-loss-report.test.ts tests/post_c6/cron-rrule-adapters.test.ts`

### Task 3: Scientific mission-planning spike

**Files:**
- Create: `docs/scientific-time-spike.md`
- Test: `tests/scientific_time/mission-planning-profile.test.ts`

**Interfaces:**
- Consumes: `astronomicalSnapshot`, `explicitReference`, and `resolveExpression`.
- Produces: executable evidence of an external eclipse-entry instant plus an elapsed Decan relation, and a documented profile decision gate.

- [ ] **Step 1: Write a failing documentation-contract test**

```ts
expect(spike).toContain("Mission-Planning Snapshot Profile");
expect(spike).toContain("Scientific Time Profile");
expect(spike).toContain("leap-second");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/scientific_time/mission-planning-profile.test.ts`

- [ ] **Step 3: Add the executable mission-planning resolution assertion and spike document**

Resolve an external `@eclipse-entry` ISO instant plus a 30-second elapsed relation while retaining a versioned astronomical context snapshot. Document that tagged scientific scales and `:60` remain outside the current core.

- [ ] **Step 4: Run the focused spike test**

Run: `npm test -- tests/scientific_time/mission-planning-profile.test.ts`

### Task 4: Managed-service exploration boundary

**Files:**
- Create: `docs/managed-services-exploration.md`
- Test: `tests/public_interface/managed-services-exploration.test.ts`

**Interfaces:**
- Produces: an open-core/commercial boundary map for signed snapshots, replay archive, managed MCP, and connectors.

- [ ] **Step 1: Write the failing documentation-contract test**

```ts
expect(document).toContain("Signed Snapshot Registry");
expect(document).toContain("Evidence Replay Archive");
expect(document).toContain("Managed MCP");
expect(document).toContain("not a scheduler");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/public_interface/managed-services-exploration.test.ts`

- [ ] **Step 3: Write the service-boundary exploration**

Define the customer problem, the inputs/outputs, open-core boundary, commercial operational value, non-goals, first falsifiable hypotheses, and evidence to collect. Keep all live acquisition and managed operations outside Decan core.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- tests/public_interface/managed-services-exploration.test.ts`

### Task 5: Integration and verification

**Files:**
- Modify: `README.md`
- Test: all repository tests

- [ ] **Step 1: Link the scientific spike and managed-service exploration from the README repository map**

- [ ] **Step 2: Run the full quality suite**

Run: `npm run typecheck && npm test && npm run build`

- [ ] **Step 3: Inspect the final diff and commit the sprint**

Run: `git diff --check && git status --short`
