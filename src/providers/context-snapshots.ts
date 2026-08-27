import type { ContextKind, ContextSnapshot, ReferenceId, ReferenceSnapshot } from "../model/types.js";

export type ZoneRuleTransitionSnapshot = Readonly<{ at: string; offsetMinutes: number }>;
export type TimezoneSnapshot = Readonly<{ id: string; version: string; initialOffsetMinutes: number; transitions: ReadonlyArray<ZoneRuleTransitionSnapshot> }>;
export type BusinessCalendarContextSnapshot = Readonly<{ id: string; version: string; closedDates: ReadonlyArray<string> }>;
export type LocationSnapshot = Readonly<{ id: string; version: string; latitude: number; longitude: number; observedAt?: string; source?: string }>;
export type ParticipantSnapshot = Readonly<{ id: string; version: string; value: unknown }>;
export type AvailabilitySnapshot = Readonly<{ id: string; version: string; value: unknown }>;
export type AstronomicalSnapshot = Readonly<{ id: string; version: string; value: unknown }>;
export type CustomContextSnapshot = Readonly<{ id: string; version: string; value: unknown }>;
export type ExplicitReferenceSnapshot = Readonly<{ id: ReferenceId; version: string; value: unknown }>;

const contextSnapshot = (kind: ContextKind, id: string, version: string, value: unknown): ContextSnapshot => ({ kind, id, version, value });

/** Adapts caller-supplied immutable zone rules. It never reads host timezone data. */
export const timezoneSnapshot = (snapshot: TimezoneSnapshot): ContextSnapshot =>
  contextSnapshot("timezone", snapshot.id, snapshot.version, { initialOffsetMinutes: snapshot.initialOffsetMinutes, transitions: snapshot.transitions });

/** Adapts caller-supplied immutable calendar rules. It never fetches holiday data. */
export const businessCalendarSnapshot = (snapshot: BusinessCalendarContextSnapshot): ContextSnapshot =>
  contextSnapshot("calendar", snapshot.id, snapshot.version, { closedDates: snapshot.closedDates });

/** Carries caller-supplied location evidence. It never reads device, browser, IP, or network location. */
export const locationSnapshot = (snapshot: LocationSnapshot): ContextSnapshot =>
  contextSnapshot("location", snapshot.id, snapshot.version, { latitude: snapshot.latitude, longitude: snapshot.longitude, ...(snapshot.observedAt ? { observedAt: snapshot.observedAt } : {}), ...(snapshot.source ? { source: snapshot.source } : {}) });

/** Carries caller-supplied participant evidence. It never reads host profile or account state. */
export const participantSnapshot = (snapshot: ParticipantSnapshot): ContextSnapshot =>
  contextSnapshot("participant", snapshot.id, snapshot.version, snapshot.value);

/** Carries caller-supplied availability evidence. It never polls calendars or observers. */
export const availabilitySnapshot = (snapshot: AvailabilitySnapshot): ContextSnapshot =>
  contextSnapshot("availability", snapshot.id, snapshot.version, snapshot.value);

/** Carries caller-supplied astronomical evidence. It never computes or fetches ephemeris data. */
export const astronomicalSnapshot = (snapshot: AstronomicalSnapshot): ContextSnapshot =>
  contextSnapshot("astronomical", snapshot.id, snapshot.version, snapshot.value);

/** Carries caller-supplied custom context evidence. */
export const customContextSnapshot = (snapshot: CustomContextSnapshot): ContextSnapshot =>
  contextSnapshot("custom", snapshot.id, snapshot.version, snapshot.value);

/** Carries a caller-supplied resolved reference snapshot. It never observes the referenced system. */
export const explicitReference = (snapshot: ExplicitReferenceSnapshot): ReferenceSnapshot => ({ id: snapshot.id, version: snapshot.version, value: snapshot.value });
