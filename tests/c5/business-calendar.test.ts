import { describe, expect, it } from "vitest";
import { addBusinessDays } from "../../src/index.js";

describe("C5 versioned business calendars", () => {
  it("uses only the supplied closed dates and preserves its version in the result", () => {
    expect(addBusinessDays({ date: "2026-08-28", days: 1, calendar: { id: "us-holidays", version: "2026.1", closedDates: ["2026-08-31"] } })).toEqual({ date: "2026-09-01", calendarVersion: "2026.1" });
  });
});
