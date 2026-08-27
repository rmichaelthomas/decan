import { DatabaseSync } from "node:sqlite";
import { parentPort, workerData } from "node:worker_threads";

const barrier = new Int32Array(workerData.barrier);
Atomics.wait(barrier, 0, 0);
const db = new DatabaseSync(workerData.path);
db.exec("PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS occurrences (id TEXT PRIMARY KEY, intent_id TEXT NOT NULL, occurrence_key TEXT NOT NULL, payload_json TEXT NOT NULL, UNIQUE(intent_id, occurrence_key)) STRICT; CREATE TABLE IF NOT EXISTS occurrence_events (id TEXT PRIMARY KEY, occurrence_id TEXT NOT NULL, recorded_at TEXT NOT NULL, payload_json TEXT NOT NULL) STRICT;");
const occurrence = { id: "occurrence-payroll", intentId: "payroll", intentVersion: 1, occurrenceKey: "slot-1", phase: "materialized" };
const inserted = db.prepare("INSERT INTO occurrences (id, intent_id, occurrence_key, payload_json) VALUES (?, ?, ?, ?) ON CONFLICT(intent_id, occurrence_key) DO NOTHING").run(occurrence.id, occurrence.intentId, occurrence.occurrenceKey, JSON.stringify(occurrence));
if (Number(inserted.changes) === 1) db.prepare("INSERT INTO occurrence_events (id, occurrence_id, recorded_at, payload_json) VALUES (?, ?, ?, ?)").run("occurrence-payroll:materialized", occurrence.id, "2026-08-27T16:00:00Z", JSON.stringify({ id: "occurrence-payroll:materialized", kind: "materialized", recordedAt: "2026-08-27T16:00:00Z" }));
db.close();
parentPort.postMessage(workerData.id);
