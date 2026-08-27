import type { Occurrence, OccurrenceEvent, OccurrenceQuery, Page, StoredOccurrence } from "../model/types.js";

export interface OccurrenceStore {
  find(intentId: string, occurrenceKey: string): Occurrence | undefined;
  appendMaterialized(occurrence: Occurrence, recordedAt: string): "created" | "existing";
  appendEvent(occurrenceId: string, event: OccurrenceEvent): void;
  get(id: string): StoredOccurrence | undefined;
  query(query: OccurrenceQuery): Page<StoredOccurrence>;
}
