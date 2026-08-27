import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public package surface", () => {
  const packageJson = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../package.json"), "utf8")) as {
    description?: string;
    exports?: Record<string, { types?: string; import?: string }>;
    files?: ReadonlyArray<string>;
    private?: boolean;
    repository?: { url?: string };
    types?: string;
  };

  it("declares the Decan package as a reference implementation without choosing a license", () => {
    expect(packageJson).toMatchObject({
      description: "Human-first, agent-friendly temporal intent reference implementation for Proper Time.",
      private: true,
      repository: { url: "git+https://github.com/rmichaelthomas/decan.git" }
    });
  });

  it("points package consumers at the built TypeScript entrypoint", () => {
    expect(packageJson.exports?.["."]).toEqual({ types: "./dist/index.d.ts", import: "./dist/index.js" });
    expect(packageJson.types).toBe("./dist/index.d.ts");
    expect(packageJson.files).toEqual(expect.arrayContaining(["dist", "README.md", "SPEC.md", "docs/conformance.md", "docs/consumer-evidence-pass.md", "docs/examples.md"]));
  });
});
