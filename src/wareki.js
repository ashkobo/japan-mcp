// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// wareki.js
// ---------------------------------------------------------------------------
// Japanese era names (和暦) <-> Gregorian dates.
// Dates before 1873-01-01 are treated as Gregorian (Japan used the lunisolar
// calendar until then), so early Meiji dates are proleptic, not historical.

import { formatDay, parseDate, partsOf } from "./dates.js";

// Newest first. Each era ends the day before the next one starts.
export const ERAS = [
  { name: "令和", romaji: "Reiwa", abbr: "R", start: "2019-05-01" },
  { name: "平成", romaji: "Heisei", abbr: "H", start: "1989-01-08" },
  { name: "昭和", romaji: "Showa", abbr: "S", start: "1926-12-25" },
  { name: "大正", romaji: "Taisho", abbr: "T", start: "1912-07-30" },
  { name: "明治", romaji: "Meiji", abbr: "M", start: "1868-01-25" },
].map((era, i, all) => ({
  ...era,
  startDay: parseDate(era.start),
  endDay: i === 0 ? Infinity : parseDate(all[i - 1].start) - 1,
}));

const ERA_KEYS = new Map(
  ERAS.flatMap((e) => [
    [e.name, e],
    [e.abbr, e],
    [e.romaji.toUpperCase(), e],
  ]),
);

const WAREKI_RE =
  /^(明治|大正|昭和|平成|令和|meiji|taisho|showa|heisei|reiwa|[mtshr])\s*(元|\d{1,2})\s*(?:年|[./-])?\s*(?:(\d{1,2})\s*(?:月|[./-])\s*(?:(\d{1,2})\s*日?)?)?$/i;

// PUBLIC
// ---------------------------------------------------------------------------

/**
 * [Example]
 * toWareki("2026-10-13") // { era: "令和", year: 8, text: "令和8年10月13日", short: "R8.10.13", ... }
 * toWareki("2019-05-01").text // "令和元年5月1日"
 */
export function toWareki(date) {
  const n = parseDate(date);
  const era = eraOfDay(n);
  const { y, m, d } = partsOf(n);
  const year = y - partsOf(era.startDay).y + 1;
  return {
    era: era.name,
    eraRomaji: era.romaji,
    year,
    month: m,
    day: d,
    text: `${era.name}${year === 1 ? "元" : year}年${m}月${d}日`,
    short: `${era.abbr}${year}.${m}.${d}`,
  };
}

export function looksLikeWareki(text) {
  return WAREKI_RE.test(normalize(text));
}

/**
 * Returns { date } only when month and day are given, otherwise just the year (and month).
 *
 * [Example]
 * fromWareki("令和8年10月13日").date // "2026-10-13"
 * fromWareki("ｒ８．１０．１３").date  // "2026-10-13"
 * fromWareki("平成元年")              // { year: 1989 }
 */
export function fromWareki(text) {
  const match = WAREKI_RE.exec(normalize(text));
  if (!match) {
    throw new RangeError(
      `Cannot read "${text}" as a Japanese era date (e.g. 令和8年10月13日, R8.10.13).`,
    );
  }
  const era = ERA_KEYS.get(match[1].toUpperCase());
  const year = match[2] === "元" ? 1 : Number(match[2]);
  if (year < 1) throw new RangeError("Era year starts at 1 (元年).");
  const gYear = partsOf(era.startDay).y + year - 1;
  const lastYear = era.endDay === Infinity ? Infinity : partsOf(era.endDay).y;
  if (gYear > lastYear) {
    throw new RangeError(`${era.name}${year}年 does not exist (${era.name} ended in ${lastYear}).`);
  }

  const [m, d] = [match[3], match[4]].map((v) => (v === undefined ? undefined : Number(v)));
  if (m === undefined) return { year: gYear };
  if (m < 1 || m > 12) throw new RangeError("Month must be between 1 and 12.");
  const first = parseDate(`${gYear}-${String(m).padStart(2, "0")}-01`);
  const next =
    m === 12
      ? parseDate(`${gYear + 1}-01-01`)
      : parseDate(`${gYear}-${String(m + 1).padStart(2, "0")}-01`);
  if (next <= era.startDay || first > era.endDay) {
    throw new RangeError(`${text} is outside ${era.name}.`);
  }
  if (d === undefined) return { year: gYear, month: m };

  const iso = `${gYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const n = parseDate(iso);
  if (n < era.startDay || n > era.endDay) {
    const end = era.endDay === Infinity ? "" : formatDay(era.endDay);
    throw new RangeError(`${text} is outside ${era.name} (${formatDay(era.startDay)} – ${end}).`);
  }
  return { date: formatDay(n), year: gYear, month: m, day: d };
}

// PRIVATE
// ---------------------------------------------------------------------------

function eraOfDay(n) {
  const era = ERAS.find((e) => n >= e.startDay);
  if (!era) throw new RangeError("Dates before 明治 (1868-01-25) are not supported.");
  return era;
}

function normalize(text) {
  return String(text).normalize("NFKC").trim(); // full-width "Ｒ８" -> "R8"
}
