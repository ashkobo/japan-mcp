// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// holidays.js
// ---------------------------------------------------------------------------
// Japanese national holidays (国民の祝日に関する法律), computed from the rules
// rather than a table, so there is no data file to keep up to date.
// Covers the law's history: moved holidays, the 2019 enthronement, the 2020/2021
// Olympic shifts, substitute holidays (振替休日) and citizens' holidays (国民の休日).

import { dayNumber, formatDay, parseDate, partsOf, weekdayOf } from "./dates.js";

export const FIRST_YEAR = 1949;
export const LAST_YEAR = 2099;
// The equinox days are fixed officially each February for the next year.
// Years after this are computed predictions (almost always right, but not official).
export const OFFICIAL_UNTIL = 2027;

const ONE_OFF = [
  ["1959-04-10", "皇太子明仁親王の結婚の儀"],
  ["1989-02-24", "昭和天皇の大喪の礼"],
  ["1990-11-12", "即位礼正殿の儀"],
  ["1993-06-09", "皇太子徳仁親王の結婚の儀"],
  ["2019-05-01", "天皇の即位の日"],
  ["2019-10-22", "即位礼正殿の儀"],
];

const SUBSTITUTE_START = dayNumber(1973, 4, 12);
const CITIZENS_START = dayNumber(1985, 12, 27);

const cache = new Map();

// PUBLIC
// ---------------------------------------------------------------------------

export function holidayNameOfDay(n) {
  return holidayMap(partsOf(n).y).get(n) ?? null;
}

export function holidayName(date) {
  return holidayNameOfDay(parseDate(date));
}

export function isEstimated(year) {
  return year > OFFICIAL_UNTIL;
}

export function holidaysOfYear(y) {
  return [...holidayMap(y)].map(([n, name]) => ({ date: formatDay(n), name }));
}

/** Both ends inclusive; the order of the dates does not matter. */
export function holidaysBetween(from, to) {
  let [a, b] = [parseDate(from), parseDate(to)];
  if (a > b) [a, b] = [b, a];
  const out = [];
  for (let y = partsOf(a).y; y <= partsOf(b).y; y += 1) {
    for (const [n, name] of holidayMap(y)) {
      if (n >= a && n <= b) out.push({ date: formatDay(n), name });
    }
  }
  return out;
}

// PRIVATE
// ---------------------------------------------------------------------------

// Map<dayNumber, name>, including substitute and citizens' holidays.
function holidayMap(y) {
  if (cache.has(y)) return cache.get(y);
  if (!Number.isInteger(y) || y < FIRST_YEAR || y > LAST_YEAR) {
    throw new RangeError(`Year ${y} is out of range (${FIRST_YEAR}–${LAST_YEAR}).`);
  }
  const named = namedHolidays(y);
  const all = new Map(named);

  // Substitute holiday: until 2006 only the Monday after, from 2007 the next non-holiday
  for (const day of [...named.keys()].sort((a, b) => a - b)) {
    if (day < SUBSTITUTE_START || weekdayOf(day) !== 0) continue;
    let sub = day + 1;
    if (y >= 2007) while (named.has(sub)) sub += 1;
    else if (named.has(sub)) continue;
    if (partsOf(sub).y === y) all.set(sub, "振替休日");
  }

  // Citizens' holiday: a plain day between two holidays (not a Sunday until 2006)
  for (const day of named.keys()) {
    const between = day + 1;
    if (between < CITIZENS_START || all.has(between) || !named.has(between + 1)) continue;
    if (y < 2007 && weekdayOf(between) === 0) continue;
    all.set(between, "国民の休日");
  }

  const sorted = new Map([...all].sort((a, b) => a[0] - b[0]));
  cache.set(y, sorted);
  return sorted;
}

// Only the days named in the law (祝日); holidayMap adds the rest.
function namedHolidays(y) {
  const h = new Map();
  const add = (m, d, name) => h.set(dayNumber(y, m, d), name);

  add(1, 1, "元日");
  add(1, y <= 1999 ? 15 : nthMonday(y, 1, 2), "成人の日");
  if (y >= 1967) add(2, 11, "建国記念の日");
  if (y >= 2020) add(2, 23, "天皇誕生日");
  add(3, vernalEquinox(y), "春分の日");
  add(4, 29, y <= 1988 ? "天皇誕生日" : y <= 2006 ? "みどりの日" : "昭和の日");
  add(5, 3, "憲法記念日");
  if (y >= 2007) add(5, 4, "みどりの日");
  add(5, 5, "こどもの日");

  if (y === 2020) add(7, 23, "海の日");
  else if (y === 2021) add(7, 22, "海の日");
  else if (y >= 2003) add(7, nthMonday(y, 7, 3), "海の日");
  else if (y >= 1996) add(7, 20, "海の日");

  if (y === 2020) add(8, 10, "山の日");
  else if (y === 2021) add(8, 8, "山の日");
  else if (y >= 2016) add(8, 11, "山の日");

  if (y >= 2003) add(9, nthMonday(y, 9, 3), "敬老の日");
  else if (y >= 1966) add(9, 15, "敬老の日");
  add(9, autumnalEquinox(y), "秋分の日");

  if (y === 2020) add(7, 24, "スポーツの日");
  else if (y === 2021) add(7, 23, "スポーツの日");
  else if (y >= 2020) add(10, nthMonday(y, 10, 2), "スポーツの日");
  else if (y >= 2000) add(10, nthMonday(y, 10, 2), "体育の日");
  else if (y >= 1966) add(10, 10, "体育の日");

  add(11, 3, "文化の日");
  add(11, 23, "勤労感謝の日");
  if (y >= 1989 && y <= 2018) add(12, 23, "天皇誕生日");

  for (const [date, name] of ONE_OFF) {
    if (date.startsWith(`${y}-`)) h.set(parseDate(date), name);
  }
  return h;
}

function nthMonday(y, m, n) {
  const first = weekdayOf(dayNumber(y, m, 1));
  return 1 + ((8 - first) % 7) + (n - 1) * 7;
}

// The usual approximation formulas. The inner division must truncate toward
// zero, not floor, or every year before 1980 comes out one day late.
function vernalEquinox(y) {
  return y < 1980
    ? Math.floor(20.8357 + 0.242194 * (y - 1980) - Math.trunc((y - 1983) / 4))
    : Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.trunc((y - 1980) / 4));
}

function autumnalEquinox(y) {
  return y < 1980
    ? Math.floor(23.2588 + 0.242194 * (y - 1980) - Math.trunc((y - 1983) / 4))
    : Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.trunc((y - 1980) / 4));
}
