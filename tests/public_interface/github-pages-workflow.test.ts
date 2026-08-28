import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const workflow = new URL("../../.github/workflows/deploy-pages.yml", import.meta.url);

describe("GitHub Pages deployment", () => {
  test("deploys only the static site from main with Pages permissions", () => {
    expect(existsSync(workflow)).toBe(true);
    const source = readFileSync(workflow, "utf8");

    expect(source).toContain("push:");
    expect(source).toContain("actions/checkout");
    expect(source).toContain("main");
    expect(source).toContain("pages: write");
    expect(source).toContain("id-token: write");
    expect(source).toContain("path: ./site");
    expect(source).toContain("actions/deploy-pages");
  });
});
