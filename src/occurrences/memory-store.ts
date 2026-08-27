import type { Occurrence, OccurrenceEvent, OccurrenceQuery, Page, StoredOccurrence } from "../model/types.js";
import type { OccurrenceStore } from "./store.js";

const project = (occurrence: Occurrence, events: ReadonlyArray<OccurrenceEvent>, asOf?: string): StoredOccurrence | undefined => {
  const visible = asOf === undefined ? events : events.filter((event) => event.recordedAt <= asOf);
  if (visible.length === 0) return undefined;
  const latest = visible.at(-1);
  const phase = latest?.kind === "cancelled" ? "cancelled" : latest?.kind === "closed" ? "closed" : occurrence.phase;
  return { occurrence: { ...occurrence, phase }, history: visible };
};

export class MemoryOccurrenceStore implements OccurrenceStore {
  readonly #occurrences = new Map<string, Occurrence>();
  readonly #keys = new Map<string, string>();
  readonly #events = new Map<string, OccurrenceEvent[]>();

  find(intentId: string, occurrenceKey: string): Occurrence | undefined {
    const id = this.#keys.get(`${intentId}:${occurrenceKey}`);
    return id === undefined ? undefined : this.#occurrences.get(id);
  }

  appendMaterialized(occurrence: Occurrence, recordedAt: string): "created" | "existing" {
    if (this.find(occurrence.intentId, occurrence.occurrenceKey)) return "existing";
    this.#occurrences.set(occurrence.id, occurrence);
    this.#keys.set(`${occurrence.intentId}:${occurrence.occurrenceKey}`, occurrence.id);
    this.#events.set(occurrence.id, [{ id: `${occurrence.id}:materialized`, kind: "materialized", recordedAt }]);
    return "created";
  }

  appendEvent(occurrenceId: string, event: OccurrenceEvent): void {
    const events = this.#events.get(occurrenceId);
    if (!events) throw new Error(`Unknown occurrence ${occurrenceId}`);
    events.push(event);
  }

  get(id: string): StoredOccurrence | undefined {
    const occurrence = this.#occurrences.get(id);
    return occurrence === undefined ? undefined : project(occurrence, this.#events.get(id) ?? []);
  }

  query(query: OccurrenceQuery): Page<StoredOccurrence> {
    const intentId = typeof query.intentId === "string" ? query.intentId : undefined;
    const asOf = typeof query.asOf === "string" ? query.asOf : undefined;
    return { items: [...this.#occurrences.values()].filter((item) => intentId === undefined || item.intentId === intentId).map((item) => project(item, this.#events.get(item.id) ?? [], asOf)).filter((item): item is StoredOccurrence => item !== undefined) };
  }
}
