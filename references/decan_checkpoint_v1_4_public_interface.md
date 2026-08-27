# Decan Checkpoint v1.4 — Public Interface Sprint

Date: 2026-08-27

This checkpoint locks the public-interface sprint after v1.3 public packaging.

## Summary

Decan now has the practical dissemination layer that was missing after the primitive itself was built:

- package-level CLI;
- stdio MCP server;
- substantial Proper Time corpus page;
- long-form launch argument;
- standalone landing page;
- README/conformance updates;
- explicit release-posture gate.

The work does not change Decan's core temporal semantics. It makes the built primitive usable and explainable by humans, scripts, CI, and agent hosts.

Committed and pushed on `main` as `feat: add Decan public interfaces`.

## Locked decisions

| Decision | Status | Rationale |
| --- | --- | --- |
| Decan remains private/no-license until Rob chooses release posture. | Locked for v1.4 | License is a public/legal decision and should not be inferred by the agent. |
| CLI and MCP share `src/interface/operations.ts`. | Locked | Prevents human/script/agent surfaces from drifting. |
| MCP uses the official `@modelcontextprotocol/server` v2 package. | Locked | Avoids a hand-rolled protocol façade. |
| MCP transport is stdio. | Locked | Best first fit for local agent hosts. |
| The landing page is a standalone repo artifact. | Locked | Keeps the reference package self-contained; deployment can be a follow-up from exact source. |
| Public posture is standards-shaped, not standard. | Locked | Decan can invite critique without claiming governance/adoption it does not yet have. |

## Implemented

### CLI

`src/cli/commands.ts` implements the public command runner and `src/cli/index.ts` provides the binary entrypoint.

Commands:

- `canonicalize`
- `validate`
- `support`
- `resolve`
- `import-cron`
- `import-rrule`
- `export-rrule`
- `materialize`

Package binary:

- `decan`

### MCP

`src/mcp/server.ts` implements a real stdio MCP server using the official MCP TypeScript server SDK.

Tools:

- `decan_canonicalize`
- `decan_validate`
- `decan_classify_support`
- `decan_resolve`
- `decan_import_cron`
- `decan_import_rrule`
- `decan_export_rrule`
- `decan_materialize`

Resources:

- `decan://proper-time/spec`
- `decan://proper-time/conformance`
- `decan://proper-time/corpus`
- `decan://proper-time/launch-argument`

Prompts:

- `explain-proper-time-intent`
- `convert-schedule-to-decan`

Package binary:

- `decan-mcp`

### Public materials

- `.impeccable.md` records Decan's design context.
- `docs/proper-time-corpus.md` explains the evidence corpus and consumer traces.
- `docs/launch-argument.md` gives the long public argument for Proper Time and Decan.
- `site/index.html` is the standalone landing page.
- `README.md` documents CLI, MCP, repository map, and status.
- `docs/conformance.md` includes CLI/MCP as implemented seams.

## Still not changed

Decan core still does not:

- authorize work;
- execute work;
- retry work;
- verify fulfillment;
- poll live observers;
- infer host timezone, locale, clock, geolocation, network, account, or calendar state;
- claim full RFC 5545/iCalendar conformance;
- claim to be a ratified standard.

## Release gate

The package still has:

```json
{
  "private": true
}
```

No license is declared. A public npm/GitHub release should wait for Rob's explicit license and release-posture choice.

## Verification status

Verified before commit:

- `npm run typecheck` passed.
- `npm test -- --cache=false` passed: 34 test files, 100 tests.
- `npm run build` passed.
- `NPM_CONFIG_CACHE=/private/tmp/decan-npm-cache npm pack --dry-run --json` passed.
- Emitted CLI smoke test passed with `node dist/cli/index.js import-cron "0 9 * * 1" --effective-from 2026-08-27`.
- Emitted MCP construction smoke test passed with 8 tools and 4 resources.
- Emitted MCP stdio smoke test passed: spawned `dist/mcp/server.js`, completed `initialize`, and returned all 8 tools from `tools/list`.

## Resume prompt

Continue Decan from v1.4 public interface. Verify all tests/build/package dry-run, update this checkpoint's verification status, commit as `feat: add Decan public interfaces`, and push `main` to `origin/main`.
