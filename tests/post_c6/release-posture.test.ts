import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(process.cwd());

describe("Apache-2.0 release posture", () => {
  test("declares Apache-2.0 and ships the canonical license text", () => {
    const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { license?: string };
    const readme = readFileSync(resolve(root, "README.md"), "utf8");
    const license = readFileSync(resolve(root, "LICENSE"), "utf8");

    expect(packageJson.license).toBe("Apache-2.0");
    expect(license).toContain("Apache License");
    expect(license).toContain("Version 2.0, January 2004");
    expect(readme).not.toContain("No license has been declared yet");
  });
});
