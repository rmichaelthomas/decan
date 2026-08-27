import { describe, expect, test } from "vitest";
import {
  DECAN_MCP_PROMPT_NAMES,
  DECAN_MCP_RESOURCE_URIS,
  DECAN_MCP_TOOL_NAMES,
  callDecanMcpTool,
  createDecanMcpServer,
  toMcpTextResult
} from "../../src/mcp/server.js";

const text = `time
  point 09:00
  repeat every week
lifecycle
  status active
  effective-from 2026-08-31
`;

describe("Decan MCP surface", () => {
  test("exposes the complete agent-native Decan tool set", () => {
    expect(DECAN_MCP_TOOL_NAMES).toEqual([
      "decan_canonicalize",
      "decan_validate",
      "decan_classify_support",
      "decan_resolve",
      "decan_import_cron",
      "decan_import_rrule",
      "decan_export_rrule",
      "decan_materialize"
    ]);
    expect(DECAN_MCP_RESOURCE_URIS).toContain("decan://proper-time/corpus");
    expect(DECAN_MCP_PROMPT_NAMES).toContain("explain-proper-time-intent");
  });

  test("creates a real MCP server instance for stdio hosts", () => {
    const server = createDecanMcpServer();
    expect(server.isConnected()).toBe(false);
  });

  test("runs Decan canonicalization through the same handler used by MCP tools", async () => {
    const result = await callDecanMcpTool("decan_canonicalize", { text, surface: "authoring" }) as { ok: true; value: { canonicalText: string } };

    expect(result.ok).toBe(true);
    expect(result.value.canonicalText).toContain("repeat every week");
  });

  test("wraps structured tool output in MCP text content", async () => {
    const value = await callDecanMcpTool("decan_import_cron", {
      cron: "0 9 * * 1",
      effectiveFrom: "2026-08-27"
    });

    const mcpResult = toMcpTextResult(value);

    expect(mcpResult.content).toHaveLength(1);
    expect(mcpResult.content[0]).toMatchObject({ type: "text" });
    expect(JSON.parse(mcpResult.content[0].text)).toMatchObject({ ok: true });
    expect(mcpResult.structuredContent).toMatchObject({ ok: true });
  });
});
