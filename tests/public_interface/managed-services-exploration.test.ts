import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("managed services exploration", () => {
  test("keeps commercial services outside the temporal core", () => {
    const document = readFileSync(resolve(process.cwd(), "docs/managed-services-exploration.md"), "utf8");
    expect(document).toContain("Signed Snapshot Registry");
    expect(document).toContain("Evidence Replay Archive");
    expect(document).toContain("Managed MCP");
    expect(document).toContain("not a scheduler");
  });
});
