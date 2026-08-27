import type { CapabilityManifest, CapabilityResult, FeatureSupport, TemporalOperation } from "../model/types.js";

const operations = (support: Partial<Record<TemporalOperation, FeatureSupport>>): CapabilityManifest["operations"] => ({
  parse: "pending", canonicalize: "pending", print: "pending", validate: "pending", serialize: "pending", deserialize: "pending",
  resolve: "pending", materialize: "pending", queryOccurrences: "pending", getOccurrence: "pending", inspect: "pending", explain: "pending", capabilities: "exact", ...support
});

export const temporalCoreCapabilities = (): CapabilityResult => ({ ok: true, value: { profile: "temporal-core", operations: operations({ validate: "exact", resolve: "partial" }), features: [{ id: "explicit-snapshot-resolution", support: { resolve: "partial" } }, { id: "civil-gap-fold", support: { resolve: "partial" } }] } });
export const durableOccurrenceCapabilities = (): CapabilityResult => ({ ok: true, value: { profile: "durable-occurrences", operations: operations({ validate: "exact", resolve: "partial", materialize: "exact", queryOccurrences: "exact", getOccurrence: "exact" }), features: [{ id: "sqlite-append-only-occurrences", support: { materialize: "exact", queryOccurrences: "exact", getOccurrence: "exact" } }] } });
