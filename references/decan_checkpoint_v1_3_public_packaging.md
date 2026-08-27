# decan_checkpoint_v1_3_public_packaging.md

# CANONICAL CHECKPOINT DOCUMENT
## Decan / Proper Time / Public Packaging
### v1.3 — Public packaging: human-first and agent-friendly premise confirmed

**Status:** LOCKED — EXTENDS `decan_checkpoint_v1_2_world_readiness`  
**Date:** August 27, 2026  
**Author:** Rob Thomas / R. Michael Thomas (architect), Codex (analytical and implementation partner)  
**Domain prefix:** `decan`  
**Session type:** Remote setup, premise audit, and public documentation packaging  
**Relationship to prior checkpoints:** Direct continuation of v1.2, which closed resolver partiality, added exact cron/RRULE weekly interop, and settled live observers as unsupported in Decan core. All prior checkpoints through v1.2 remain in force.

This checkpoint records the transition from local build artifact to public-facing repository artifact. The work did not add new primitive semantics. It verified that the original human-first / agent-friendly premise survived implementation and made that premise legible in public documentation.

## HOW TO READ THIS DOCUMENT

This is a packaging checkpoint, not a new architecture checkpoint. It records:

- the GitHub remote setup;
- the premise audit against the original inception documents;
- the public Decan / Proper Time framing;
- the documentation artifacts added for a world-facing repository.

It does not choose a license, publish a package, submit a standard, create governance, or claim full RFC 5545/iCalendar compatibility.

---

# PART XXXI — REMOTE AND PUBLIC SURFACE

## §102. Decan now has a GitHub remote

**Decision: `https://github.com/rmichaelthomas/decan.git` is the public remote for the Decan repository. LOCKED.**

The local Decan repository now has `origin` configured as:

```text
https://github.com/rmichaelthomas/decan.git
```

The current verified history has been pushed to `origin/main`. The local branch remains a working branch tracking `origin/main` unless renamed in a later repository-maintenance pass.

## §103. Public packaging uses Decan / Proper Time split

**Decision: Decan is the reference implementation; Proper Time is the standards-shaped idea. LOCKED.**

The public README and `SPEC.md` now present:

- Decan as the reference implementation;
- Proper Time as the broader temporal-intent framing;
- cron and RFC 5545/iCalendar as durable standards Decan sits beside, not replaces;
- exact interop only where fidelity is proven;
- explicit non-goals for scheduling, execution, authority, verification, fulfillment, ambient context, live observers, and full iCalendar support.

This preserves the original “make a long-standing time standard relevant” instinct without overclaiming that Decan is RFC 5545 or already an official standard.

---

# PART XXXII — PREMISE AUDIT

## §104. Human-first premise survived implementation

**Decision: Decan meets the original human-first requirement for the built primitive scope. LOCKED.**

The premise in Primitive Exploration and v0.1 Language Architecture was that humans should not have to think like cron or learn the machine's representation before expressing time.

The implemented evidence:

- readable Decan source centered on `time`;
- authoring normalization from human conveniences such as `9am`;
- strict canonical text for review and diffing;
- source records preserved as immutable evidence;
- semantic windows, relations, boundaries, and conditions represented without premature timestamp collapse;
- unresolved needs and conflicts returned visibly rather than hidden.

This does not claim full natural-language understanding. Natural language remains source evidence; canonical Decan remains the inspectable semantic form.

## §105. Agent-friendly premise survived implementation

**Decision: Decan meets the original agent-friendly requirement for the built primitive scope. LOCKED.**

The premise was that agents should receive precise machinery rather than fuzzy prose or hidden environmental guesses.

The implemented evidence:

- typed public runtime operations;
- strict success/failure envelopes;
- stable canonical hashes;
- JSON interchange;
- semantic validation;
- public resolver support matrix;
- deterministic finite resolution;
- pinned context/reference snapshots;
- derivation-bearing candidates;
- idempotent materialization;
- append-only Occurrence storage;
- fail-closed cron/RRULE adapters;
- capability reporting that says exact, unsupported, or non-goal instead of guessing.

This makes Decan agent-friendly without making it an agent framework.

## §106. Public examples are executable evidence

**Decision: world-facing examples are now backed by tests. LOCKED.**

The public examples document covers:

- canonicalizing readable source;
- resolving with pinned timezone evidence;
- inspecting resolver support;
- importing exact cron;
- importing/exporting exact RRULE;
- materializing an Occurrence.

The examples are guarded by `tests/post_c6/public-doc-examples.test.ts`, and the package entrypoint metadata is guarded by `tests/post_c6/package-surface.test.ts`.

## §107. Verification status is green for public packaging

**Decision: the Decan worktree verifies after public packaging. LOCKED.**

Verification run after this sprint:

- `npm run typecheck` — passed
- `npm test -- --cache=false` — passed: 31 test files, 89 tests
- `npm run build` — passed
- `NPM_CONFIG_CACHE=/private/tmp/decan-npm-cache npm pack --dry-run` — passed, with public package contents narrowed to `dist`, `README.md`, `SPEC.md`, and the public docs.

---

## WHAT IS LOCKED

- Decan's remote is `https://github.com/rmichaelthomas/decan.git`.
- The current verified history is pushed to `origin/main`.
- Public framing uses Decan for the implementation and Proper Time for the standards-shaped temporal-intent idea.
- The original human-first premise is implemented for the current primitive scope.
- The original agent-friendly premise is implemented for the current primitive scope.
- Public docs now avoid overclaiming: no full RFC 5545/iCalendar, no live observer core, no scheduler/execution/authority/verification/fulfillment claims.
- Public examples and package entry metadata are tested.

## WHAT IS NOT LOCKED

- Open-source license.
- Public package publication.
- Version number beyond local `0.0.0`.
- Standards submission, governance, registry, or RFC process.
- Full iCalendar support.
- A live observer product/module boundary.
- Whether the local working branch is renamed to `main`.

## WHAT IS LOGGED

- The README now names Decan as human-first and agent-friendly.
- `SPEC.md` explains Proper Time as temporal intent plus evidence.
- `docs/conformance.md` lists support claims and non-conformant behavior.
- `docs/examples.md` gives public examples.
- `package.json` now has description, repository metadata, package entrypoint metadata, keywords, and publishable file intent while remaining `private: true`.
- Verification passed after the packaging changes: typecheck, full tests, build, and package dry-run.

---

## UPDATED OPEN QUESTIONS (v1.3 status)

| # | Question | Status |
|---|---|---|
| 1 | Has Decan been pushed outside local? | Resolved — pushed to `origin/main`. |
| 2 | Did the human-first premise survive implementation? | Resolved — yes, within built primitive scope. |
| 3 | Did the agent-friendly premise survive implementation? | Resolved — yes, within built primitive scope. |
| 4 | Is Decan claiming to replace RFC 5545/iCalendar? | Resolved — no. |
| 5 | What remains before broad public release? | Open — license, versioning, release notes, optional branch rename, package publication decision. |

---

## RESUME PROMPT (v1.3)

*Resume from `decan_checkpoint_v1_3_public_packaging` in `/Users/rmichaelthomas/Documents/Codex/decan`. The repository remote is `https://github.com/rmichaelthomas/decan.git`, and the verified history through v1.2 was pushed to `origin/main` before public packaging work. v1.3 adds the public-facing Decan / Proper Time packaging layer: README rewritten for outside readers, `SPEC.md` explaining Proper Time as temporal intent plus evidence, `docs/conformance.md` documenting implemented support and non-goals, `docs/examples.md` showing source/snapshots/resolution/adapters/materialization, package metadata with repository/entrypoint/keywords, and tests guarding public examples plus package surface. The original human-first premise is confirmed through readable `time` syntax, authoring normalization, canonical reviewable source, source preservation, semantic windows/relations/boundaries/conditions, visible needs/conflicts, and no premature timestamp collapse. The original agent-friendly premise is confirmed through typed operations, strict envelopes, hashes, JSON interchange, support matrix, finite deterministic resolution, pinned snapshots, derivation-bearing candidates, idempotent materialization, append-only Occurrences, fail-closed adapters, and capability reporting. Preserve all prior invariants: no ambient fallback, no scheduler service, no live observers in core, no Binding, no authority, no execution, no retry, no verification, no fulfillment, no obligation lifecycle inside Decan, no full RFC 5545/iCalendar claim, and no license choice unless Rob explicitly makes one. Next useful work is release management: choose license, choose version/tag, optionally rename local branch to `main`, write release notes, and decide whether/when to publish a package.*
