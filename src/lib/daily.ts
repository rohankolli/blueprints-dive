export const RESET_TIMEZONE = "America/New_York";

/** Calendar date in the daily reset timezone (YYYY-MM-DD). */
export function getDiveDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RESET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Stable dive number from NY calendar days since a fixed epoch. */
export function getDiveNumber(diveDate: string): number {
  const epoch = Date.parse("2026-01-01T12:00:00Z");
  const day = Date.parse(`${diveDate}T12:00:00Z`);
  const days = Math.floor((day - epoch) / (24 * 60 * 60 * 1000));
  return Math.max(1, days + 1);
}

/** Next midnight America/New_York as an ISO string (for UI countdown). */
export function getNextResetIso(now: Date = new Date()): string {
  const diveDate = getDiveDate(now);
  let lo = now.getTime();
  let hi = now.getTime() + 36 * 60 * 60 * 1000;

  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (getDiveDate(new Date(mid)) === diveDate) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return new Date(hi).toISOString();
}
