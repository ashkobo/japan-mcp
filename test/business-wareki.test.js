// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// business-wareki.test.js
// ---------------------------------------------------------------------------

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addBusinessDays,
  countBusinessDays,
  fromWareki,
  isBusinessDay,
  toWareki,
} from "../src/index.js";

test("business days skip weekends and holidays", () => {
  // 2026-09-18 (Fri) → silver week 9/19–9/23 → 9/24 (Thu)
  assert.equal(addBusinessDays("2026-09-18", 1), "2026-09-24");
  assert.equal(addBusinessDays("2026-09-24", -1), "2026-09-18");
  assert.equal(addBusinessDays("2026-09-19", 0), "2026-09-24");
  assert.equal(countBusinessDays("2026-09-14", "2026-09-25"), 7);
  assert.equal(countBusinessDays("2026-09-25", "2026-09-14"), 7);
});

test("year-end closure option", () => {
  assert.equal(isBusinessDay("2026-12-29"), true);
  assert.equal(isBusinessDay("2026-12-29", { yearEnd: true }), false);
  assert.equal(addBusinessDays("2026-12-28", 1, { yearEnd: true }), "2027-01-04");
});

test("toWareki", () => {
  assert.equal(toWareki("2026-10-13").text, "令和8年10月13日");
  assert.equal(toWareki("2019-05-01").text, "令和元年5月1日");
  assert.equal(toWareki("2019-04-30").short, "H31.4.30");
  assert.equal(toWareki("1989-01-07").text, "昭和64年1月7日");
  assert.throws(() => toWareki("1868-01-01"), RangeError);
});

test("fromWareki", () => {
  assert.equal(fromWareki("令和8年10月13日").date, "2026-10-13");
  assert.equal(fromWareki("R8.10.13").date, "2026-10-13");
  assert.equal(fromWareki("ｒ８．１０．１３").date, "2026-10-13");
  assert.equal(fromWareki("Heisei 31/4/30").date, "2019-04-30");
  assert.deepEqual(fromWareki("平成元年"), { year: 1989 });
  assert.throws(() => fromWareki("平成31年5月1日"), RangeError);
  assert.throws(() => fromWareki("平成32年"), RangeError);
  assert.throws(() => fromWareki("昭和64年1月8日"), RangeError);
});

test("partial era dates reject impossible months and months outside the era", () => {
  for (const value of ["令和8年0月", "令和8年13月", "平成31年5月", "令和元年4月"]) {
    assert.throws(() => fromWareki(value), RangeError, value);
  }
  assert.deepEqual(fromWareki("平成31年4月"), { year: 2019, month: 4 });
  assert.deepEqual(fromWareki("令和元年5月"), { year: 2019, month: 5 });
  assert.deepEqual(fromWareki("昭和64年1月"), { year: 1989, month: 1 });
});
