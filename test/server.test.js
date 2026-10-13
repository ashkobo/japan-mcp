// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// server.test.js
// ---------------------------------------------------------------------------

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "test", version: "0" });

before(async () => {
  const server = fileURLToPath(new URL("../src/server.js", import.meta.url));
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [server] }));
});
after(() => client.close());

async function call(name, args) {
  const res = await client.callTool({ name, arguments: args });
  return { ...res, json: res.isError ? null : JSON.parse(res.content[0].text) };
}

test("lists the tools", async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [
    "japan_add_business_days",
    "japan_business_days",
    "japan_date_info",
    "japan_holidays",
    "japan_wareki",
  ]);
});

test("date info", async () => {
  const { json } = await call("japan_date_info", { date: "2026-09-22" });
  assert.equal(json.weekday, "火");
  assert.equal(json.holiday, "国民の休日");
  assert.equal(json.businessDay, false);
  assert.equal(json.wareki, "令和8年9月22日");
});

test("today without arguments", async () => {
  const { json } = await call("japan_date_info", {});
  assert.match(json.date, /^\d{4}-\d{2}-\d{2}$/);
});

test("business days and wareki", async () => {
  assert.equal(
    (await call("japan_add_business_days", { date: "2026-09-18", days: 1 })).json.result.date,
    "2026-09-24",
  );
  assert.equal(
    (await call("japan_business_days", { start: "2026-09-14", end: "2026-09-25" })).json
      .businessDays,
    7,
  );
  assert.equal(
    (await call("japan_wareki", { value: "R8.10.13" })).json.gregorian.date,
    "2026-10-13",
  );
  assert.equal(
    (await call("japan_wareki", { value: "2026-10-13" })).json.wareki.text,
    "令和8年10月13日",
  );
});

test("bad input is a tool error, not a crash", async () => {
  const res = await call("japan_date_info", { date: "2026-02-30" });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /no such day/);
});
