import { describe, expect, test } from "vitest";
import { runDecanCli } from "../../src/cli/commands.js";

const sampleSource = `intent fivexfive.banneker1.automation.weekly-digest
source
  kind imported_cron
  value "0 9 * * 1"
  created-at "2026-08-26T21:53:00.507Z"
  actor "5xFive Automations UI Phase 2"
time
  point 09:00
  repeat every week
lifecycle
  status active
  effective-from 2026-08-31
`;

const timezoneContext = JSON.stringify([
  {
    kind: "timezone",
    id: "America/New_York",
    version: "tzdb-2026a-test",
    value: {
      initialOffsetMinutes: -240,
      transitions: []
    }
  }
]);

function cliHarness(files: Readonly<Record<string, string>>) {
  let stdout = "";
  let stderr = "";
  return {
    io: {
      readFile: async (path: string) => {
        const content = files[path];
        if (content === undefined) throw new Error(`missing test file ${path}`);
        return content;
      },
      writeStdout: (text: string) => { stdout += text; },
      writeStderr: (text: string) => { stderr += text; }
    },
    get stdout() { return stdout; },
    get stderr() { return stderr; }
  };
}

describe("Decan CLI command runner", () => {
  test("canonicalizes a human-readable temporal intent file", async () => {
    const harness = cliHarness({ "intent.ti": sampleSource });

    const exitCode = await runDecanCli(["canonicalize", "intent.ti"], harness.io);

    expect(exitCode).toBe(0);
    const result = JSON.parse(harness.stdout);
    expect(result.ok).toBe(true);
    expect(result.value.canonicalText).toContain("intent fivexfive.banneker1.automation.weekly-digest");
    expect(result.value.expressionHash).toMatch(/^sha256:/);
  });

  test("resolves an exact weekly civil recurrence with explicit timezone evidence", async () => {
    const harness = cliHarness({ "intent.ti": sampleSource, "context.json": timezoneContext });

    const exitCode = await runDecanCli([
      "resolve",
      "intent.ti",
      "--reference-time",
      "2026-08-27T12:00:00Z",
      "--horizon-count",
      "2",
      "--context",
      "context.json"
    ], harness.io);

    expect(exitCode).toBe(0);
    const result = JSON.parse(harness.stdout);
    expect(result.ok).toBe(true);
    expect(result.value.status).toBe("resolved");
    expect(result.value.candidates).toHaveLength(2);
  });

  test("imports cron as an exact Decan temporal expression", async () => {
    const harness = cliHarness({});

    const exitCode = await runDecanCli(["import-cron", "0 9 * * 1", "--effective-from", "2026-08-27"], harness.io);

    expect(exitCode).toBe(0);
    const result = JSON.parse(harness.stdout);
    expect(result.ok).toBe(true);
    expect(result.value.diagnostics[0].code).toBe("DECAN-ADAPTER-CRON-EXACT-SUBSET");
    expect(result.value.lifecycle.effectiveFrom).toMatchObject({ year: 2026, month: 8, day: 31 });
  });

  test("materializes a selected candidate through the public command surface", async () => {
    const resolution = {
      id: "sha256:resolution",
      status: "resolved",
      candidates: [
        {
          id: "sha256:candidate",
          value: { kind: "point_candidate", value: { date: "2026-08-31" } },
          derivation: [{ kind: "test", inputs: ["fixture"], output: "candidate" }]
        }
      ],
      needs: [],
      assumptions: [],
      contextUsed: [],
      horizon: { kind: "count", value: 1 },
      derivation: [{ kind: "test", inputs: ["fixture"], output: "resolution" }]
    };
    const harness = cliHarness({ "resolution.json": JSON.stringify(resolution) });

    const exitCode = await runDecanCli([
      "materialize",
      "--intent-id",
      "fivexfive.banneker1.automation.weekly-digest",
      "--intent-version",
      "1",
      "--resolution",
      "resolution.json",
      "--candidate-id",
      "sha256:candidate",
      "--recorded-at",
      "2026-08-27T21:53:00Z"
    ], harness.io);

    expect(exitCode).toBe(0);
    const result = JSON.parse(harness.stdout);
    expect(result.ok).toBe(true);
    expect(result.value.occurrence.phase).toBe("materialized");
  });
});
