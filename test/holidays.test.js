// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// holidays.test.js
// ---------------------------------------------------------------------------

import assert from "node:assert/strict";
import { test } from "node:test";
import holidayJp from "@holiday-jp/holiday_jp";
import { holidayName, holidaysBetween, holidaysOfYear } from "../src/index.js";

const iso = (d) => d.toISOString().slice(0, 10);

// holiday_jp names substitute days differently ("元日 振替休日"), so compare dates only.
test("same holiday dates as holiday_jp, 1970–2050", () => {
  const expected = new Set(
    holidayJp.between(new Date("1970-01-01"), new Date("2050-12-31")).map((h) => iso(h.date)),
  );
  const actual = new Set(holidaysBetween("1970-01-01", "2050-12-31").map((h) => h.date));

  const missing = [...expected].filter((d) => !actual.has(d));
  const extra = [...actual].filter((d) => !expected.has(d));
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] });
});

test("2026 including the silver week citizens' holiday", () => {
  assert.deepEqual(
    holidaysOfYear(2026).map((h) => h.date),
    [
      "2026-01-01",
      "2026-01-12",
      "2026-02-11",
      "2026-02-23",
      "2026-03-20",
      "2026-04-29",
      "2026-05-03",
      "2026-05-04",
      "2026-05-05",
      "2026-05-06",
      "2026-07-20",
      "2026-08-11",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-10-12",
      "2026-11-03",
      "2026-11-23",
    ],
  );
  assert.equal(holidayName("2026-09-22"), "国民の休日");
  assert.equal(holidayName("2026-05-06"), "振替休日");
});

test("special years", () => {
  assert.equal(holidayName("2019-05-01"), "天皇の即位の日");
  assert.equal(holidayName("2019-04-30"), "国民の休日");
  assert.equal(holidayName("2020-07-24"), "スポーツの日");
  assert.equal(holidayName("2021-08-09"), "振替休日");
  assert.equal(holidayName("1989-02-24"), "昭和天皇の大喪の礼");
  assert.equal(holidayName("2026-10-13"), null);
});

test("out of range years throw", () => {
  assert.throws(() => holidaysOfYear(1948), RangeError);
  assert.throws(() => holidaysOfYear(2100), RangeError);
});
