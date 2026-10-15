// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// demo.js
// ---------------------------------------------------------------------------

import assert from "node:assert/strict";
import { addBusinessDays, countBusinessDays, fromWareki } from "japan-mcp";

const deadline = addBusinessDays("2026-04-30", 5);
assert.equal(deadline, "2026-05-12");
assert.equal(countBusinessDays("2026-09-14", "2026-09-25"), 7);
assert.equal(fromWareki("令和8年10月15日").date, "2026-10-15");
console.log(`5 business days after 2026-04-30: ${deadline}`);
console.log("Silver Week 2026-09-14..25: 7 business days");
