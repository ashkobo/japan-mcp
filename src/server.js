#!/usr/bin/env node
// (c) 2026 Ash
// SPDX-License-Identifier: MIT
// server.js
// ---------------------------------------------------------------------------
// MCP server over stdio. Everything is computed locally: no network, no API keys.
// Each tool is a thin wrapper over the library in index.js.

import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseDate, weekdayOf } from "./dates.js";
import {
  addBusinessDays,
  countBusinessDays,
  fromWareki,
  holidayName,
  holidaysBetween,
  holidaysOfYear,
  isBusinessDay,
  isEstimated,
  todayJst,
  toWareki,
  WEEKDAYS_EN,
  WEEKDAYS_JA,
} from "./index.js";
import { looksLikeWareki } from "./wareki.js";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const DATE = z.string().describe("Date as YYYY-MM-DD (Japan time).");
const YEAR_END = z
  .boolean()
  .optional()
  .describe(
    "Also close 12/29–1/3 (年末年始), a common office closure, not a bank calendar. Default false.",
  );
const READ_ONLY = { readOnlyHint: true, openWorldHint: false };

// HELPERS
// ---------------------------------------------------------------------------

// A bad input comes back as a tool error instead of crashing the server.
function reply(fn) {
  return async (args) => {
    try {
      return { content: [{ type: "text", text: JSON.stringify(fn(args)) }] };
    } catch (err) {
      return { isError: true, content: [{ type: "text", text: err.message }] };
    }
  };
}

function dateInfo(date) {
  const n = parseDate(date);
  const year = Number(date.slice(0, 4));
  return {
    date,
    weekday: WEEKDAYS_JA[weekdayOf(n)],
    weekdayEn: WEEKDAYS_EN[weekdayOf(n)],
    wareki: toWareki(date).text,
    holiday: holidayName(date),
    businessDay: isBusinessDay(date),
    ...(isEstimated(year) && {
      note: "Holidays for this year are computed, not yet officially announced.",
    }),
  };
}

// TOOLS
// ---------------------------------------------------------------------------

const server = new McpServer({ name: "japan-mcp", version });

server.registerTool(
  "japan_date_info",
  {
    title: "Japan date info",
    description:
      "Weekday, Japanese era (和暦), national holiday and business-day status of a date. " +
      "Without a date, returns today in Japan time — use this when you need to know today's date in Japan.",
    inputSchema: { date: DATE.optional() },
    annotations: READ_ONLY,
  },
  reply(({ date }) => dateInfo(date ?? todayJst())),
);

server.registerTool(
  "japan_holidays",
  {
    title: "Japanese national holidays",
    description:
      "List Japanese national holidays (祝日・振替休日・国民の休日) for a year, or between two dates (inclusive). " +
      "Defaults to the current year. Supported years: 1949–2099.",
    inputSchema: {
      year: z.number().int().optional(),
      from: DATE.optional(),
      to: DATE.optional(),
    },
    annotations: READ_ONLY,
  },
  reply(({ year, from, to }) => {
    if (from || to) {
      if (!from || !to) throw new RangeError("Give both from and to.");
      return { from, to, holidays: holidaysBetween(from, to) };
    }
    const y = year ?? Number(todayJst().slice(0, 4));
    return { year: y, estimated: isEstimated(y), holidays: holidaysOfYear(y) };
  }),
);

server.registerTool(
  "japan_business_days",
  {
    title: "Count business days in Japan",
    description:
      "Count business days (weekdays that are not national holidays) from start to end, both inclusive.",
    inputSchema: { start: DATE, end: DATE, yearEnd: YEAR_END },
    annotations: READ_ONLY,
  },
  reply(({ start, end, yearEnd }) => ({
    start,
    end,
    businessDays: countBusinessDays(start, end, { yearEnd }),
    holidays: holidaysBetween(start, end),
  })),
);

server.registerTool(
  "japan_add_business_days",
  {
    title: "Add business days in Japan",
    description:
      "The date that is N business days after (or before, if negative) the given date. " +
      'Useful for deadlines like "5営業日後". With 0, returns the date itself if it is a business day, else the next one.',
    inputSchema: { date: DATE, days: z.number().int(), yearEnd: YEAR_END },
    annotations: READ_ONLY,
  },
  reply(({ date, days, yearEnd }) => {
    const result = addBusinessDays(date, days, { yearEnd });
    return { from: date, days, result: dateInfo(result) };
  }),
);

server.registerTool(
  "japan_wareki",
  {
    title: "Japanese era (和暦) converter",
    description:
      "Convert between Gregorian dates and Japanese era dates (明治・大正・昭和・平成・令和). " +
      'Input either "2026-10-13" or an era date such as "令和8年10月13日", "R8.10.13", "平成元年".',
    inputSchema: { value: z.string() },
    annotations: READ_ONLY,
  },
  reply(({ value }) =>
    looksLikeWareki(value)
      ? { input: value, gregorian: fromWareki(value) }
      : { input: value, wareki: toWareki(value) },
  ),
);

await server.connect(new StdioServerTransport());
