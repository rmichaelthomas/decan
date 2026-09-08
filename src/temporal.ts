/**
 * The Worker-safe temporal surface.
 *
 * Identical to the package root except that it omits `SQLiteOccurrenceStore`, the
 * only module that imports a Node builtin. Everything here runs unchanged on
 * Cloudflare Workers, Deno and the browser without a compatibility flag.
 *
 * Durability is deliberately absent rather than reimplemented: an edge consumer
 * supplies its own `OccurrenceStore` (D1, Durable Object storage, KV), and the
 * interface for doing so is exported here.
 *
 * Hashes from this entry point are byte-identical to the root's - both call the
 * same pure SHA-256 - so a canonical expression hash minted at the edge compares
 * equal to one minted under Node.
 */

export type * from "./model/types.js";
export { canonicalizeDocument, canonicalJson, sha256 } from "./canonical/identity.js";
export { printDocument } from "./canonical/printer.js";
export { canonicalizeText, parse, parseDocument } from "./syntax/index.js";
export { deserializeInterchange, serializeInterchange } from "./interchange/interchange.js";
export { createSyntaxInterchangeRuntime } from "./runtime/syntax-interchange-runtime.js";
export type { SyntaxInterchangeRuntime } from "./runtime/syntax-interchange-runtime.js";
export { createValidationRuntime } from "./runtime/validation-runtime.js";
export type { ValidationRuntime } from "./runtime/validation-runtime.js";
export { validateDocument } from "./validation/validate.js";
export { resolveExpression } from "./resolution/resolve.js";
export { classifyResolveSupport } from "./resolution/support-matrix.js";
export type { ResolveOutcomeKind, ResolveSupportKind, ResolveSupportReport } from "./resolution/support-matrix.js";
export { candidateIdentity, resolutionIdentity } from "./resolution/identity.js";
export { resolveCivilTime } from "./resolution/civil-time.js";
export type { CivilTimeRequest, CivilTimeResult } from "./resolution/civil-time.js";
export { addBusinessDays } from "./providers/business-calendar.js";
export type { BusinessCalendarSnapshot, BusinessDayRequest } from "./providers/business-calendar.js";
export { astronomicalSnapshot, availabilitySnapshot, businessCalendarSnapshot, customContextSnapshot, explicitReference, locationSnapshot, participantSnapshot, timezoneSnapshot } from "./providers/context-snapshots.js";
export type { AstronomicalSnapshot, AvailabilitySnapshot, BusinessCalendarContextSnapshot, CustomContextSnapshot, ExplicitReferenceSnapshot, LocationSnapshot, ParticipantSnapshot, TimezoneSnapshot, ZoneRuleTransitionSnapshot } from "./providers/context-snapshots.js";
export { exportRRule, importCronExpression, importRRule } from "./adapters/cron-rrule.js";
export type { CronImportRequest, ImportedScheduleSource, RRuleExport, RRuleExportRequest, RRuleImportRequest, ScheduleAdapterImport } from "./adapters/cron-rrule.js";
export { exactLossReport, unsupportedLossReport } from "./adapters/loss-report.js";
export type { TemporalLossReport } from "./adapters/loss-report.js";
export { observationReference } from "./providers/observer-snapshots.js";
export type { ObserverKind, ObserverSnapshot } from "./providers/observer-snapshots.js";
export { localeSnapshot } from "./providers/locale-snapshots.js";
export type { LocalePeriod, LocaleSnapshot } from "./providers/locale-snapshots.js";
export { materialize } from "./materialization/materialize.js";
export { MemoryOccurrenceStore } from "./occurrences/memory-store.js";
export type { OccurrenceStore } from "./occurrences/store.js";
export { createDurableOccurrencesRuntime, createTemporalCoreRuntime } from "./runtime/temporal-core-runtime.js";
export type { DurableOccurrencesRuntime, TemporalCoreRuntime } from "./runtime/temporal-core-runtime.js";
export { canonicalizeTemporalIntent, classifyTemporalSupport, exportRRuleTemporalIntent, importCronTemporalIntent, importRRuleTemporalIntent, materializeTemporalIntent, parseIsoDateValue, resolveTemporalIntent, validateTemporalIntent } from "./interface/operations.js";
export type { CanonicalizeOperationInput, ClassifySupportOperationInput, ExportRRuleOperationInput, ImportCronOperationInput, ImportRRuleOperationInput, MaterializeOperationInput, ResolveOperationInput, TextSurface, ValidateOperationInput } from "./interface/operations.js";
