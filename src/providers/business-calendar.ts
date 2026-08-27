import { Temporal } from "@js-temporal/polyfill";

export type BusinessCalendarSnapshot = Readonly<{ id: string; version: string; closedDates: ReadonlyArray<string> }>;
export type BusinessDayRequest = Readonly<{ date: string; days: number; calendar: BusinessCalendarSnapshot }>;

export function addBusinessDays(request: BusinessDayRequest): Readonly<{ date: string; calendarVersion: string }> {
  let value = Temporal.PlainDate.from(request.date);
  const direction = request.days < 0 ? -1 : 1;
  let remaining = Math.abs(request.days);
  const closed = new Set(request.calendar.closedDates);
  while (remaining > 0) {
    value = value.add({ days: direction });
    if (value.dayOfWeek < 6 && !closed.has(value.toString())) remaining -= 1;
  }
  return { date: value.toString(), calendarVersion: request.calendar.version };
}
