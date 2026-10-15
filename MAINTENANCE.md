# Maintaining japan-mcp

This server computes Japanese national holidays, ordinary weekday business days and modern
era dates locally. It is not a settlement calendar or a configurable company calendar.
`yearEnd` closes December 29 through January 3, independently of actual bank opening dates.

## Before a release

Run `npm ci`, `npm run lint`, `npm test`, `npm run demo` and `npm run verify:package`.
The last command packs the candidate, installs it in a temporary consumer and checks its API
and MCP transport. Confirm the GitHub CI jobs on the candidate commit before releasing it.
Inspect the npm file list and verify that exported functions and the executable are present.

Regression coverage includes comparison with holiday_jp for 1970–2050, Olympic-year shifts,
substitute and citizens' holidays, era boundaries and partial era dates. Test legal rule
changes against an independent official fixture, rather than merely changing expected values.

## Annual and exceptional review

After the next year's official holidays are published, compare the Cabinet Office list with
the computed calendar. Review `OFFICIAL_UNTIL` in `src/holidays.js`; future equinox days must
remain marked as estimated until confirmed. Review immediately after any law, special holiday
or era announcement. Predictions are not a substitute for that review.

`node scripts/check-calendar.js` compares all supported years in the official CSV and checks
the confirmation year without changing files. After publication, the monthly Official calendar
workflow runs the same check; a difference requires source review, not automatic publication.

- [Cabinet Office holiday list](https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html)
- [National Astronomical Observatory calendar](https://eco.mtk.nao.ac.jp/koyomi/)
- [Independent holiday_jp dataset](https://github.com/holiday-jp/holiday_jp)

## Reproduce a report

Ask for the tool/version, input date or era, expected result with a source, Node version and
client. The configured year-end closure, inclusive range counting and the special behavior
of adding zero days can explain apparent differences between libraries. Keep these semantics
explicit when comparing results. Do not claim support for a bank's custom closing rules.
