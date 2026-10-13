// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// business.js
// ---------------------------------------------------------------------------
// Business days (営業日): not Saturday, Sunday or a national holiday.
// Option `yearEnd`: also close 12/29–1/3 (年末年始), as banks and offices do.

import { formatDay, parseDate, partsOf, weekdayOf } from "./dates.js";
import { holidayNameOfDay } from "./holidays.js";

const MAX_SPAN_DAYS = 366 * 50; // keeps a typo like 20260 days from spinning for seconds

// PUBLIC
// ---------------------------------------------------------------------------

export function isBusinessDay(date, options) {
  return isBusinessDayN(parseDate(date), options);
}

/** Both ends inclusive; the order of the dates does not matter. */
export function countBusinessDays(start, end, options) {
  let [a, b] = [parseDate(start), parseDate(end)];
  if (a > b) [a, b] = [b, a];
  if (b - a > MAX_SPAN_DAYS) throw new RangeError("Range is too long (max 50 years).");
  let count = 0;
  for (let n = a; n <= b; n += 1) if (isBusinessDayN(n, options)) count += 1;
  return count;
}

/**
 * Move `days` business days from `date` (negative goes back).
 * With 0, returns `date` if it is a business day, otherwise the next one.
 */
export function addBusinessDays(date, days, options) {
  if (!Number.isInteger(days)) throw new RangeError("days must be an integer.");
  if (Math.abs(days) > MAX_SPAN_DAYS) throw new RangeError("days is too large.");
  let n = parseDate(date);
  if (days === 0) {
    while (!isBusinessDayN(n, options)) n += 1;
    return formatDay(n);
  }
  const step = days > 0 ? 1 : -1;
  for (let left = Math.abs(days); left > 0; ) {
    n += step;
    if (isBusinessDayN(n, options)) left -= 1;
  }
  return formatDay(n);
}

// PRIVATE
// ---------------------------------------------------------------------------

function isBusinessDayN(n, { yearEnd = false } = {}) {
  const w = weekdayOf(n);
  if (w === 0 || w === 6) return false;
  if (yearEnd && isYearEnd(n)) return false;
  return holidayNameOfDay(n) === null;
}

function isYearEnd(n) {
  const { m, d } = partsOf(n);
  return (m === 12 && d >= 29) || (m === 1 && d <= 3);
}
