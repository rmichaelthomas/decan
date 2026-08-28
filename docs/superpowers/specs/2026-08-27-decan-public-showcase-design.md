# Decan Public Showcase and GitHub Pages Design

## Goal

Turn the existing static page into a durable public showcase for Decan and Proper Time. It must let a first-time visitor understand the proposition, see evidence that the reference implementation is real, and choose a practical next step through the spec, corpus, CLI, or MCP surface.

The site is a public argument and an evidence index. It is not a scheduler console, a dashboard, or a claim that Decan executes work.

## Public posture

The page speaks in three connected registers:

1. **Proposition:** Proper Time is the layer where temporal meaning and explicit evidence are preserved before another system schedules or acts.
2. **Proof:** Decan can canonicalize, validate, classify support, resolve against pinned context, materialize a selected candidate, and report interop loss honestly.
3. **Entry points:** visitors can read the specification and corpus or use the CLI and stdio MCP server.

Consumer evidence is generalized on the landing page into three case types: workflow automation, policy-shaped maintenance, and protocol obligations. Named case material remains available in the corpus, where its provenance is useful rather than promotional.

## Information architecture

The single page follows a deliberate evidence flow:

```text
Proposition
  ↓
Temporal evidence trace
  ↓
Four entry points: spec, corpus, CLI, MCP
  ↓
What Decan proves and what it refuses
  ↓
Three generalized evidence domains
  ↓
Future horizon and release posture
```

### Hero

The hero has a short proposition, a concise explanation of Decan's scope, and direct links to the specification and corpus. Alongside it, an inspectable source-to-occurrence trace demonstrates the actual core chain without pretending it is a live service.

### Evidence trace

The central visual is a static, accessible sequence:

```text
intent → pinned context → exact candidate → materialized occurrence
```

It uses a small readable source fragment, labels for the evidence supplied, a resulting UTC candidate, and an explicit non-execution note. It also links to the conformance guide so the page's claims have a normative destination.

### Entry points

The page gives four distinct routes:

- **Read the specification** for the semantic model.
- **Inspect the corpus** for executable evidence cases.
- **Use the CLI** with concise command examples.
- **Connect MCP** with an accurate statement of its stdio tools, resources, and prompts.

The tools are presented as interfaces to the same core. They are not framed as hosted services.

### Boundaries and horizon

The page names the core's refusals: no ambient time, locale, network, or observers; no authorization or fulfillment; no false interop precision. A final horizon section points to scientific mission-planning evidence and managed-service exploration, while explicitly placing those products and profiles outside the open temporal core.

## Visual direction

The design uses a committed night-chart palette: mineral blue-black ground, warm parchment notation, copper evidence marks, and a restrained blue signal color. The physical scene is a builder inspecting a reliable instrument at a quiet desk after a deployment, not reading a magazine or browsing a generic developer-tool catalogue.

Typography uses a deliberate sans-forward system stack with broad, dense display treatment and a distinct compact notation face. The composition is structural rather than card-driven: full-width bands, evidence rails, inset code samples, and changing column ratios create rhythm. No fake metrics, glass panels, rounded-icon grids, gradient text, or decorative terminal cosplay are used.

Motion is optional and progressive. On supported, non-reduced-motion browsers, the evidence trace may reveal in sequence on initial load. `prefers-reduced-motion` receives the fully visible static sequence.

## Implementation

- Keep the site dependency-free as `site/index.html`, suitable for direct GitHub Pages publication from the repository's `main` branch and `/site` directory.
- Add GitHub Pages configuration through a small workflow that deploys only `site/`, avoiding a platform-specific build dependency.
- Use root-relative public links that work from the published `/decan/` project path, or preserve documented relative links where GitHub Pages resolves the content directly.
- Keep the static page self-contained, responsive, keyboard-navigable, and usable without JavaScript.
- Update public-material regression tests to assert the revised content claims, generalized case labels, release posture, and GitHub Pages workflow.

## Accessibility and responsiveness

- Maintain semantic sections, visible focus treatments, readable color contrast, descriptive link labels, and selection-friendly code samples.
- Treat the evidence trace as normal semantic content, not as information encoded only by color or animation.
- Collapse the hero, entry-point layout, and evidence domains to one column on narrow screens while retaining the reading order.
- Avoid horizontal scrolling below 320px wide and preserve a readable body measure on larger displays.

## Deployment

GitHub Actions builds no application assets. It uses GitHub's Pages artifact and deployment actions to publish the `site/` directory after a successful push to `main`, with least-privilege Pages permissions and a concurrency group that prevents stale deployments from winning.

The repository must have GitHub Pages configured to use GitHub Actions as its source once the workflow is merged. This is a repository setting outside the codebase, so the implementation will document it but will not attempt to alter it without separate authorization.

## Verification

Required verification includes:

- public-materials regression tests;
- an HTML/content check for the generalized evidence domains and valid internal page links;
- an accessibility-minded static review of headings, landmarks, keyboard focus, reduced motion, and narrow viewport rules;
- workflow syntax validation where available;
- full typecheck, test suite, and build, ensuring the site changes do not regress the reference implementation.

## Non-goals

- Publishing or changing package distribution.
- Making any claim that Decan is a scheduler, calendar server, execution engine, or hosted MCP product.
- Removing or altering private planning materials, by the user's explicit request for this work.
