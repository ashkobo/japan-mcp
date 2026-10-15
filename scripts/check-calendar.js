// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// check-calendar.js
// ---------------------------------------------------------------------------

import assert from "node:assert/strict";
import { FIRST_YEAR, holidaysOfYear, LAST_YEAR, OFFICIAL_UNTIL } from "../src/index.js";

const source = "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv";
const response = await fetch(source, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Cabinet Office returned HTTP ${response.status}.`);
const csv = new TextDecoder("shift_jis").decode(await response.arrayBuffer());
const years = new Map();
for (const line of csv.split(/\r?\n/)) {
  const match = /^"?(\d{4})\/(\d{1,2})\/(\d{1,2})"?,/.exec(line);
  if (!match) continue;
  const year = Number(match[1]);
  if (year < FIRST_YEAR || year > LAST_YEAR) continue;
  const date = match
    .slice(1)
    .map((part, index) => part.padStart(index === 0 ? 4 : 2, "0"))
    .join("-");
  if (!years.has(year)) years.set(year, []);
  years.get(year).push(date);
}
assert.ok(years.size >= 50, "Unexpected official CSV format or missing historical rows.");
for (const [year, dates] of years) {
  assert.deepEqual(
    holidaysOfYear(year).map((row) => row.date),
    dates.sort(),
    `Computed holidays differ from the official source in ${year}.`,
  );
}
const latest = Math.max(...years.keys());
assert.equal(
  OFFICIAL_UNTIL,
  latest,
  "Review OFFICIAL_UNTIL against the official source before changing confirmation metadata.",
);
console.log(
  JSON.stringify({
    source,
    yearsChecked: years.size,
    firstYear: Math.min(...years.keys()),
    officialUntil: latest,
  }),
);
