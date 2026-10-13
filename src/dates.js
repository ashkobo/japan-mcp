// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// dates.js
// ---------------------------------------------------------------------------
// Dates are plain "YYYY-MM-DD" strings. Internally a date is a day number
// (days since 1970-01-01), so no time zone ever gets involved.

const DAY_MS = 86_400_000;
const JST_OFFSET_MS = 9 * 3_600_000; // UTC+9, no daylight saving
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];
export const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dayNumber(y, m, d) {
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Throws RangeError on a malformed or impossible date. */
export function parseDate(s) {
  const match = DATE_RE.exec(String(s).trim());
  if (!match) throw new RangeError(`Invalid date "${s}". Use YYYY-MM-DD.`);
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // Date.UTC silently rolls 02-30 over to 03-02, so check it came back unchanged
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) {
    throw new RangeError(`Invalid date "${s}": no such day.`);
  }
  return dayNumber(y, m, d);
}

export function formatDay(n) {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function partsOf(n) {
  const t = new Date(n * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(n) {
  return (((n + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday
}

/** Today in Japan, whatever the machine's time zone is. */
export function todayJst(now = new Date()) {
  return formatDay(Math.floor((now.getTime() + JST_OFFSET_MS) / DAY_MS));
}
