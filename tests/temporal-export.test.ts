import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The ./temporal entry point must stay free of Node builtins. This walks the actual
 * import graph rather than trusting the entry file, so a builtin reintroduced three
 * modules deep is still caught.
 */
function reachableFiles(entry: string): string[] {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/from\s+"(\.[^"]+)"/g)) {
      const specifier = match[1]!.replace(/\.js$/, ".ts");
      queue.push(resolve(dirname(file), specifier));
    }
  }
  return [...seen];
}

const TEMPORAL_ENTRY = resolve("src/temporal.ts");

describe("the ./temporal entry point is Worker-safe", () => {
  it("reaches no Node builtin anywhere in its import graph", () => {
    const offenders = reachableFiles(TEMPORAL_ENTRY)
      .filter((file) => /from\s+"node:/.test(readFileSync(file, "utf8")))
      .map((file) => file.replace(`${resolve(".")}/`, ""));
    expect(offenders).toEqual([]);
  });

  it("excludes only the SQLite store, and still offers the store interface", () => {
    const source = readFileSync(TEMPORAL_ENTRY, "utf8");
    expect(source).not.toContain("sqlite-store");
    // An edge consumer supplies its own durability against this interface.
    expect(source).toContain("OccurrenceStore");
    expect(source).toContain("MemoryOccurrenceStore");
  });

  it("exports the same temporal surface as the root, minus that one store", () => {
    const root = readFileSync(resolve("src/index.ts"), "utf8").split("\n").filter((line) => line.trim());
    const temporal = readFileSync(TEMPORAL_ENTRY, "utf8").split("\n").filter((line) => line.trim().startsWith("export"));
    const missing = root.filter((line) => line.startsWith("export") && !line.includes("sqlite-store") && !temporal.includes(line));
    expect(missing).toEqual([]);
  });

  it("is declared in the package exports map", () => {
    const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { exports: Record<string, unknown> };
    expect(pkg.exports["./temporal"]).toEqual({ types: "./dist/temporal.d.ts", import: "./dist/temporal.js" });
    // Additive: the existing entry points are untouched.
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["./cli"]).toBeDefined();
    expect(pkg.exports["./mcp"]).toBeDefined();
  });

  it("keeps the root entry point exporting the SQLite store", () => {
    expect(readFileSync(resolve("src/index.ts"), "utf8")).toContain("sqlite-store");
    expect(readdirSync(resolve("src/occurrences"))).toContain("sqlite-store.ts");
  });
});
