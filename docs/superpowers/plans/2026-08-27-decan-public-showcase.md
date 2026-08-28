# Decan Public Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Decan's initial static landing page with an accessible, evidence-led public showcase and deploy `site/` through GitHub Pages.

**Architecture:** Keep the page self-contained in `site/index.html`, using semantic HTML, responsive CSS, and small progressive-enhancement JavaScript only for an optional evidence-trace reveal. A Pages workflow uploads only `site/`; Vitest protects public content and deployment configuration.

**Tech Stack:** HTML5, CSS custom properties and media queries, vanilla JavaScript, GitHub Actions, GitHub Pages, Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-08-27-decan-public-showcase-design.md`

## Global Constraints

- Keep the site dependency-free and publishable directly from `main` and the `site/` directory.
- Present Decan as a reference implementation, not a scheduler, calendar server, execution engine, or hosted MCP product.
- Generalize named personal-product consumers into workflow automation, policy-shaped maintenance, and protocol obligations.
- Preserve direct routes to the specification, corpus, CLI, and stdio MCP surfaces.
- Work without JavaScript and respect `prefers-reduced-motion`.
- Do not change repository-hygiene or private-planning material.

---

### Task 1: Lock the public-site and Pages contract in tests

**Files:**
- Modify: `tests/public_interface/public-materials.test.ts`
- Create: `tests/public_interface/github-pages-workflow.test.ts`

**Interfaces:**
- Consumes: `site/index.html` as UTF-8 text and `.github/workflows/deploy-pages.yml` as YAML source.
- Produces: regressions for public content, motion support, generalized evidence domains, and least-privilege Pages deployment.

- [ ] **Step 1: Write the failing landing-page contract test**

```ts
test("ships an evidence-led Decan showcase without personal-product promotion", () => {
  const landing = read("site/index.html");
  expect(landing).toContain("The layer before schedules act");
  expect(landing).toContain("intent → pinned context → exact candidate → materialized occurrence");
  expect(landing).toContain("Workflow automation");
  expect(landing).toContain("Policy-shaped maintenance");
  expect(landing).toContain("Protocol obligations");
  expect(landing).not.toContain("5xFive");
  expect(landing).not.toContain("Seshat");
  expect(landing).toContain("prefers-reduced-motion");
  expect(landing).toContain("Scientific-Time Spike");
  expect(landing).toContain("Managed Services Exploration");
});
```

- [ ] **Step 2: Write the failing workflow test**

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
const workflow = new URL("../../.github/workflows/deploy-pages.yml", import.meta.url);
describe("GitHub Pages deployment", () => {
  test("deploys only the static site from main with Pages permissions", () => {
    expect(existsSync(workflow)).toBe(true);
    const source = readFileSync(workflow, "utf8");
    expect(source).toContain("push:");
    expect(source).toContain("main");
    expect(source).toContain("pages: write");
    expect(source).toContain("id-token: write");
    expect(source).toContain("path: ./site");
    expect(source).toContain("actions/deploy-pages");
  });
});
```

- [ ] **Step 3: Run the focused tests to verify they fail**

Run: `npm test -- tests/public_interface/public-materials.test.ts tests/public_interface/github-pages-workflow.test.ts --run`

Expected: FAIL because the page and Pages workflow lack the asserted contract.

- [ ] **Step 4: Commit the failing-contract tests**

```bash
git add tests/public_interface/public-materials.test.ts tests/public_interface/github-pages-workflow.test.ts
git commit -m "test: define public showcase contract"
```

### Task 2: Build the evidence-led static showcase

**Files:**
- Modify: `site/index.html`
- Modify: `tests/public_interface/public-materials.test.ts`

**Interfaces:**
- Consumes: Task 1's content contract and `SPEC.md`, corpus, conformance guide, scientific-time spike, and managed-services exploration.
- Produces: a semantic static page with evidence trace, entry points, generalized evidence domains, explicit boundaries, and responsive/reduced-motion behavior.

- [ ] **Step 1: Replace the page structure with semantic evidence bands**

```html
<header class="masthead">…The layer before schedules act…</header>
<main>
  <section id="evidence">…intent → pinned context → exact candidate → materialized occurrence…</section>
  <section id="entry-points">…Specification, Corpus, CLI, MCP…</section>
  <section id="proof">…what Decan proves and refuses…</section>
  <section id="evidence-domains">…Workflow automation, Policy-shaped maintenance, Protocol obligations…</section>
  <section id="horizon">…Scientific-Time Spike, Managed Services Exploration…</section>
</main>
```

Use `../SPEC.md`, `../docs/proper-time-corpus.md`, `../docs/conformance.md`, `../docs/scientific-time-spike.md`, and `../docs/managed-services-exploration.md` for the public document links.

- [ ] **Step 2: Implement the visual system and responsive behavior**

Use an OKLCH mineral blue-black ground, warm notation foreground, copper evidence marks, and blue signal accents. Use dense sans-forward typography, notation only for code, full-width bands, and changing grid ratios instead of cards. Include these protections:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
}
@media (max-width: 760px) {
  .masthead-grid, .trace, .entry-grid, .domain-grid { grid-template-columns: 1fr; }
}
```

Give links visible `:focus-visible` outlines and never encode trace state only by color.

- [ ] **Step 3: Add progressive trace enhancement**

```js
document.documentElement.classList.add("js");
document.querySelectorAll(".trace-step").forEach((step, index) => {
  step.style.setProperty("--step", String(index));
});
```

The static HTML must remain complete when JavaScript is disabled.

- [ ] **Step 4: Run focused tests and a static accessibility review**

Run: `npm test -- tests/public_interface/public-materials.test.ts --run`

Then run: `rg -n "<header|<main|<section|<footer|focus-visible|prefers-reduced-motion|href=" site/index.html`

Expected: the test passes and the source shows semantic landmarks, focus styling, motion protection, and public-document links.

- [ ] **Step 5: Commit the static showcase**

```bash
git add site/index.html tests/public_interface/public-materials.test.ts
git commit -m "feat: redesign Decan public showcase"
```

### Task 3: Add GitHub Pages delivery and verify the public surface

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`
- Modify: `tests/public_interface/github-pages-workflow.test.ts`

**Interfaces:**
- Consumes: the static `site/` artifact and GitHub's Pages artifact/deployment actions.
- Produces: push-to-main deployment, a README setup note, and a passing workflow regression.

- [ ] **Step 1: Add the Pages workflow**

Create `.github/workflows/deploy-pages.yml` with a `push` trigger for `main`, `workflow_dispatch`, `contents: read`, `pages: write`, and `id-token: write`. Use a `build` job to configure Pages and upload `./site`, then a `deploy` job with the Pages environment and `actions/deploy-pages@v4`.

```yaml
name: Deploy Decan site
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
```

- [ ] **Step 2: Document the one repository setting**

Add a README note: after the workflow is merged, set the repository's Pages source to **GitHub Actions**. State that it publishes only `site/` after pushes to `main`.

- [ ] **Step 3: Run focused and complete verification**

Run: `npm test -- tests/public_interface/public-materials.test.ts tests/public_interface/github-pages-workflow.test.ts --run`

Run: `npm run typecheck && npm test && npm run build && git diff --check && git status --short`

Expected: all tests, typecheck, and build pass; whitespace is clean; only intended files are present.

- [ ] **Step 4: Commit Pages delivery**

```bash
git add .github/workflows/deploy-pages.yml README.md tests/public_interface/github-pages-workflow.test.ts
git commit -m "ci: deploy Decan showcase to GitHub Pages"
```

## Self-review

Tasks 1 and 2 cover the proof-led information flow, generalized consumers, visual direction, accessibility, responsiveness, and progressive enhancement. Task 3 covers Pages delivery and the external repository setting. The plan does not alter repository hygiene. No placeholders or undefined interfaces remain.
