import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { describe, expect, it } from "vitest";
import { SQLiteOccurrenceStore } from "../../src/index.js";

const insertInWorker = (path: string, barrier: SharedArrayBuffer, id: string) => new Promise<string>((resolve, reject) => {
  const worker = new Worker(new URL("./helpers/sqlite-insert-worker.mjs", import.meta.url), { workerData: { path, barrier, id } });
  worker.once("message", resolve);
  worker.once("error", reject);
});

describe("C6 SQLite convergence", () => {
  it("converges concurrent connections on one durable occurrence key", async () => {
    const directory = mkdtempSync(join(tmpdir(), "decan-c6-concurrent-"));
    const path = join(directory, "occurrences.sqlite");
    const barrier = new SharedArrayBuffer(4);
    const first = insertInWorker(path, barrier, "one");
    const second = insertInWorker(path, barrier, "two");
    Atomics.store(new Int32Array(barrier), 0, 1);
    Atomics.notify(new Int32Array(barrier), 0, 2);
    await Promise.all([first, second]);
    const store = new SQLiteOccurrenceStore(path);
    expect(store.query({ intentId: "payroll" }).items).toHaveLength(1);
    store.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
