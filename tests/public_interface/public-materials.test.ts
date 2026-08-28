import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("public dissemination materials", () => {
  test("ships a serious Proper Time corpus page with real consumer traces", () => {
    const corpus = read("docs/proper-time-corpus.md");

    expect(corpus).toContain("# Proper Time Corpus");
    expect(corpus).toContain("5xFive / Banneker 1 Automations");
    expect(corpus).toContain("Seshat dependency scan scheduling");
    expect(corpus).toContain("Cloudflare backward-channel package");
    expect(corpus).toContain("intent");
    expect(corpus).toContain("Observed gap");
  });

  test("ships a long-form public argument for why temporal intent needs its own layer", () => {
    const launch = read("docs/launch-argument.md");

    expect(launch).toContain("# Decan, Proper Time, and the Layer Before Schedules");
    expect(launch).toContain("Human-first");
    expect(launch).toContain("Agent-friendly");
    expect(launch).toContain("What Decan is not");
    expect(launch.length).toBeGreaterThan(9000);
  });

  test("ships a standalone landing page with CLI and MCP calls to action", () => {
    const landing = read("site/index.html");

    expect(landing).toContain("<title>Decan — Proper Time");
    expect(landing).toContain("human-first");
    expect(landing).toContain("agent-friendly");
    expect(landing).toContain("CLI");
    expect(landing).toContain("MCP");
    expect(landing).toContain("Proper Time Corpus");
  });

  test("keeps the README aligned with the v1.5 release posture", () => {
    const readme = read("README.md");

    expect(readme).toContain("v1.5");
    expect(readme).toContain("TemporalLossReport");
    expect(readme).toContain("Scientific-Time Spike");
    expect(readme).toContain("Managed Services Exploration");
    expect(readme).toContain("Apache-2.0");
  });
});
