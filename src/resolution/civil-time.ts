export type ZoneRuleTransition = Readonly<{ at: string; offsetMinutes: number }>;
export type CivilTimeRequest = Readonly<{ id: string; version: string; initialOffsetMinutes: number; transitions: ReadonlyArray<ZoneRuleTransition>; year: number; month: number; day: number; hour: number; minute: number }>;
export type CivilTimeResult = Readonly<{ status: "resolved" | "conflicted"; candidates: ReadonlyArray<string>; zoneVersion: string }>;

const milliseconds = (value: string): number => Date.parse(value);
const iso = (value: number): string => new Date(value).toISOString().replace(".000Z", "Z");

/** Resolves from the supplied immutable transition table; it never consults host zone rules. */
export function resolveCivilTime(request: CivilTimeRequest): CivilTimeResult {
  const transitions = [...request.transitions].sort((left, right) => left.at < right.at ? -1 : left.at > right.at ? 1 : 0);
  const offsetAt = (instant: number): number => transitions.filter((transition) => milliseconds(transition.at) <= instant).at(-1)?.offsetMinutes ?? request.initialOffsetMinutes;
  const local = Date.UTC(request.year, request.month - 1, request.day, request.hour, request.minute);
  const offsets = [...new Set([request.initialOffsetMinutes, ...transitions.map((transition) => transition.offsetMinutes)])];
  const candidates = offsets.map((offset) => local - offset * 60_000).filter((instant) => offsetAt(instant) === offsets.find((offset) => local - offset * 60_000 === instant)).sort((left, right) => left - right).map((instant) => `${iso(instant)}[${request.id}]`);
  return candidates.length === 0 ? { status: "conflicted", candidates: [], zoneVersion: request.version } : { status: "resolved", candidates, zoneVersion: request.version };
}
