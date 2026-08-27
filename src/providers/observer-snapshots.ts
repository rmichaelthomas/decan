import type { ReferenceSnapshot } from "../model/types.js";

export type ObserverKind = "availability" | "completion" | "device" | "external_condition";
export type ObserverSnapshot = Readonly<{ id: string; kind: ObserverKind; version: string; observedAt: string; value: boolean }>;

/** Adapts caller-supplied immutable observations; it performs no observation or fetching itself. */
export const observationReference = (snapshot: ObserverSnapshot): ReferenceSnapshot => ({
  id: `@${snapshot.id}`,
  version: snapshot.version,
  value: { value: snapshot.value, kind: snapshot.kind, observedAt: snapshot.observedAt }
});
