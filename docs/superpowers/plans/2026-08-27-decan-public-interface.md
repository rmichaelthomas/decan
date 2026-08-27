# Decan Public Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Decan's public interaction surfaces: CLI, MCP server, public corpus page, launch argument, standalone landing page, package metadata, and verification.

**Architecture:** Add `src/interface/operations.ts` as the shared operation layer. Build `src/cli/*` and `src/mcp/server.ts` on top of that layer so human/script/agent surfaces remain behaviorally aligned.

**Tech Stack:** TypeScript, Node.js ESM, Vitest, official `@modelcontextprotocol/server` v2, Zod v4, existing Decan core.

**Spec:** `docs/superpowers/specs/2026-08-27-decan-public-interface-design.md`

## Global Constraints

- Do not change Decan core semantics merely to make public surfaces easier.
- Do not infer timezone, locale, clock, geolocation, network, account state, or live observer context.
- Keep package `"private": true` until release posture and license are explicitly chosen.
- CLI and MCP commands must return structured JSON-compatible results.
- MCP must be real stdio MCP using the official SDK, not a placeholder.
- Public copy may be audacious, but it must preserve Decan's non-goals.

---

### Task 1: Red tests for public interfaces

**Files:**

- Create: `tests/public_interface/cli.test.ts`
- Create: `tests/public_interface/mcp.test.ts`
- Create: `tests/public_interface/public-materials.test.ts`
- Modify: `tests/post_c6/package-surface.test.ts`

**Interfaces:**

- Consumes: existing Decan public core exports.
- Produces: failing tests that define CLI, MCP, and dissemination expectations.

- [x] **Step 1: Write failing CLI command-runner tests**
- [x] **Step 2: Write failing MCP surface tests**
- [x] **Step 3: Write failing public-material tests**
- [x] **Step 4: Run tests and confirm red**

### Task 2: Shared operation layer

**Files:**

- Create: `src/interface/operations.ts`
- Modify: `src/index.ts`

**Interfaces:**

- Produces: `canonicalizeTemporalIntent`, `validateTemporalIntent`, `classifyTemporalSupport`, `resolveTemporalIntent`, `importCronTemporalIntent`, `importRRuleTemporalIntent`, `exportRRuleTemporalIntent`, `materializeTemporalIntent`, and `parseIsoDateValue`.

- [x] **Step 1: Implement operation wrappers**
- [x] **Step 2: Export the public interface types and functions**
- [x] **Step 3: Run focused tests**

### Task 3: CLI

**Files:**

- Create: `src/cli/commands.ts`
- Create: `src/cli/index.ts`
- Modify: `package.json`

**Interfaces:**

- Produces: `runDecanCli(argv, io)` and `decan` binary.

- [x] **Step 1: Implement command parser**
- [x] **Step 2: Implement command handlers**
- [x] **Step 3: Add package bin metadata**
- [x] **Step 4: Run CLI tests and emitted CLI smoke test**

### Task 4: MCP

**Files:**

- Create: `src/mcp/server.ts`
- Modify: `package.json`

**Interfaces:**

- Produces: `createDecanMcpServer`, `serveDecanMcpStdio`, `callDecanMcpTool`, `toMcpTextResult`, `DECAN_MCP_TOOL_NAMES`, `DECAN_MCP_RESOURCE_URIS`, `DECAN_MCP_PROMPT_NAMES`, and `decan-mcp` binary.

- [x] **Step 1: Install official MCP server SDK**
- [x] **Step 2: Register Decan tools**
- [x] **Step 3: Register resources and prompts**
- [x] **Step 4: Run MCP tests and emitted server smoke test**

### Task 5: Public materials

**Files:**

- Create: `.impeccable.md`
- Create: `docs/proper-time-corpus.md`
- Create: `docs/launch-argument.md`
- Create: `site/index.html`
- Modify: `README.md`
- Modify: `docs/conformance.md`

**Interfaces:**

- Produces: public orientation, evidence corpus explanation, longer launch argument, and standalone landing page.

- [x] **Step 1: Persist design context**
- [x] **Step 2: Write Proper Time corpus page**
- [x] **Step 3: Write long-form launch argument**
- [x] **Step 4: Build standalone landing page**
- [x] **Step 5: Update README and conformance**

### Task 6: Final verification and release gate

**Files:**

- Modify: `references/decan_checkpoint_v1_4_public_interface.md`

**Interfaces:**

- Produces: locked checkpoint and pushed commit.

- [x] **Step 1: Run full verification**
- [x] **Step 2: Commit**
- [x] **Step 3: Push**
