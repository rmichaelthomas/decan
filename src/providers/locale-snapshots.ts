import type { ContextSnapshot } from "../model/types.js";

export type LocalePeriod = Readonly<{ start: Readonly<{ hour: number; minute: number }>; end: Readonly<{ hour: number; minute: number }> }>;
export type LocaleSnapshot = Readonly<{ id: string; version: string; locale: string; periods: Readonly<Record<string, LocalePeriod>> }>;

/** Creates explicit, versioned locale context. No host/device locale is read. */
export const localeSnapshot = (snapshot: LocaleSnapshot): ContextSnapshot => ({ kind: "locale", id: snapshot.id, version: snapshot.version, value: { locale: snapshot.locale, periods: snapshot.periods } });
