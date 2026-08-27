import type { CapabilityManifest, CapabilityResult, FeatureSupport, TemporalOperation } from "../model/types.js";

const operations = (support: Partial<Record<TemporalOperation, FeatureSupport>>): CapabilityManifest["operations"] => ({
  parse: "pending", canonicalize: "pending", print: "pending", validate: "pending", serialize: "pending", deserialize: "pending",
  resolve: "pending", materialize: "pending", queryOccurrences: "pending", getOccurrence: "pending", inspect: "pending", explain: "pending", capabilities: "exact", ...support
});

export const temporalCoreCapabilities = (): CapabilityResult => ({ ok: true, value: { profile: "temporal-core", operations: operations({ validate: "exact", resolve: "partial" }), features: [{ id: "snapshot-temporal-core", support: { resolve: "partial" } }, { id: "explicit-locale-snapshots", support: { resolve: "exact" } }, { id: "explicit-observer-snapshots", support: { resolve: "exact" } }, { id: "elapsed-instant-offsets", support: { resolve: "exact" } }, { id: "elapsed-subday-recurrence", support: { resolve: "exact" } }, { id: "live-dynamic-observers", support: { resolve: "pending" } }, { id: "cron-rrule-adapters", support: { resolve: "unsupported" } }] } });
export const durableOccurrenceCapabilities = (): CapabilityResult => ({ ok: true, value: { profile: "durable-occurrences", operations: operations({ validate: "exact", resolve: "partial", materialize: "exact", queryOccurrences: "exact", getOccurrence: "exact" }), features: [{ id: "sqlite-append-only-occurrences", support: { materialize: "exact", queryOccurrences: "exact", getOccurrence: "exact" } }] } });
