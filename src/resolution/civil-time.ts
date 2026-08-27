import { Temporal } from "@js-temporal/polyfill";

export type CivilTimeRequest = Readonly<{ id: string; version: string; year: number; month: number; day: number; hour: number; minute: number }>;
export type CivilTimeResult = Readonly<{ status: "resolved" | "conflicted"; candidates: ReadonlyArray<string>; zoneVersion: string }>;

/** Resolves only the supplied zone identifier/version; no system zone or clock is consulted. */
export function resolveCivilTime(request: CivilTimeRequest): CivilTimeResult {
  const fields = { timeZone: request.id, year: request.year, month: request.month, day: request.day, hour: request.hour, minute: request.minute };
  const earlier = Temporal.ZonedDateTime.from(fields, { disambiguation: "earlier" });
  const later = Temporal.ZonedDateTime.from(fields, { disambiguation: "later" });
  const preserved = (value: Temporal.ZonedDateTime): boolean => (
    value.year === request.year && value.month === request.month && value.day === request.day && value.hour === request.hour && value.minute === request.minute
  );
  if (!preserved(earlier) || !preserved(later)) return { status: "conflicted", candidates: [], zoneVersion: request.version };
  const values = earlier.epochNanoseconds === later.epochNanoseconds ? [earlier.toString()] : [earlier.toString(), later.toString()];
  return { status: "resolved", candidates: values, zoneVersion: request.version };
}
