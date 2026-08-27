import { DatabaseSync } from "node:sqlite";
import type { Occurrence, OccurrenceEvent, OccurrenceQuery, Page, StoredOccurrence } from "../model/types.js";
import type { OccurrenceStore } from "./store.js";

type OccurrenceRow = Readonly<{ id: string; intent_id: string; occurrence_key: string; payload_json: string }>;
type EventRow = Readonly<{ payload_json: string; recorded_at: string }>;

const project = (occurrence: Occurrence, events: ReadonlyArray<OccurrenceEvent>, asOf?: string): StoredOccurrence | undefined => {
  const visible = asOf === undefined ? events : events.filter((event) => event.recordedAt <= asOf);
  if (visible.length === 0) return undefined;
  const last = visible.at(-1);
  const phase = last?.kind === "cancelled" ? "cancelled" : last?.kind === "closed" ? "closed" : occurrence.phase;
  return { occurrence: { ...occurrence, phase }, history: visible };
};

export class SQLiteOccurrenceStore implements OccurrenceStore {
  readonly #db: DatabaseSync;

  constructor(path: string) {
    this.#db = new DatabaseSync(path);
    this.#db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS occurrences (
        id TEXT PRIMARY KEY,
        intent_id TEXT NOT NULL,
        occurrence_key TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        UNIQUE(intent_id, occurrence_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS occurrence_events (
        id TEXT PRIMARY KEY,
        occurrence_id TEXT NOT NULL REFERENCES occurrences(id),
        recorded_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS occurrence_events_by_occurrence ON occurrence_events(occurrence_id, recorded_at);
    `);
  }

  close(): void { this.#db.close(); }

  find(intentId: string, occurrenceKey: string): Occurrence | undefined {
    const row = this.#db.prepare("SELECT id, intent_id, occurrence_key, payload_json FROM occurrences WHERE intent_id = ? AND occurrence_key = ?").get(intentId, occurrenceKey) as OccurrenceRow | undefined;
    return row === undefined ? undefined : JSON.parse(row.payload_json) as Occurrence;
  }

  appendMaterialized(occurrence: Occurrence, recordedAt: string): "created" | "existing" {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const result = this.#db.prepare("INSERT INTO occurrences (id, intent_id, occurrence_key, payload_json) VALUES (?, ?, ?, ?) ON CONFLICT(intent_id, occurrence_key) DO NOTHING").run(occurrence.id, occurrence.intentId, occurrence.occurrenceKey, JSON.stringify(occurrence));
      const created = Number(result.changes) === 1;
      if (created) this.#db.prepare("INSERT INTO occurrence_events (id, occurrence_id, recorded_at, payload_json) VALUES (?, ?, ?, ?)").run(`${occurrence.id}:materialized`, occurrence.id, recordedAt, JSON.stringify({ id: `${occurrence.id}:materialized`, kind: "materialized", recordedAt }));
      this.#db.exec("COMMIT");
      return created ? "created" : "existing";
    } catch (caught) {
      this.#db.exec("ROLLBACK");
      throw caught;
    }
  }

  appendEvent(occurrenceId: string, event: OccurrenceEvent): void {
    this.#db.prepare("INSERT INTO occurrence_events (id, occurrence_id, recorded_at, payload_json) VALUES (?, ?, ?, ?)").run(event.id, occurrenceId, event.recordedAt, JSON.stringify(event));
  }

  get(id: string): StoredOccurrence | undefined {
    const row = this.#db.prepare("SELECT id, intent_id, occurrence_key, payload_json FROM occurrences WHERE id = ?").get(id) as OccurrenceRow | undefined;
    return row === undefined ? undefined : this.#stored(row);
  }

  query(query: OccurrenceQuery): Page<StoredOccurrence> {
    const intentId = typeof query.intentId === "string" ? query.intentId : undefined;
    const rows = (intentId === undefined
      ? this.#db.prepare("SELECT id, intent_id, occurrence_key, payload_json FROM occurrences ORDER BY id").all()
      : this.#db.prepare("SELECT id, intent_id, occurrence_key, payload_json FROM occurrences WHERE intent_id = ? ORDER BY id").all(intentId)) as OccurrenceRow[];
    const asOf = typeof query.asOf === "string" ? query.asOf : undefined;
    return { items: rows.map((row) => this.#stored(row, asOf)).filter((item): item is StoredOccurrence => item !== undefined) };
  }

  #stored(row: OccurrenceRow, asOf?: string): StoredOccurrence | undefined {
    const occurrence = JSON.parse(row.payload_json) as Occurrence;
    const eventRows = this.#db.prepare("SELECT payload_json, recorded_at FROM occurrence_events WHERE occurrence_id = ? ORDER BY recorded_at, id").all(occurrence.id) as EventRow[];
    return project(occurrence, eventRows.map((event) => JSON.parse(event.payload_json) as OccurrenceEvent), asOf);
  }
}
