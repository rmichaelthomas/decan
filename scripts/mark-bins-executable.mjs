import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";

for (const file of ["dist/cli/index.js", "dist/mcp/server.js"]) {
  const path = join(process.cwd(), file);
  if (existsSync(path)) chmodSync(path, 0o755);
}
