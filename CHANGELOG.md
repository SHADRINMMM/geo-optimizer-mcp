# Changelog

## Unreleased

- Tool output cleaned: no emoji, no unsourced statistics (removed "+41% citation rate", "200M+ weekly users", "15M+ daily queries", "73% of sites"), engines named as Gemini, Grok, Claude, ChatGPT (Perplexity and Yandex AI removed from engine lists; PerplexityBot stays as a robots.txt crawler).

## 0.5.0

- `suggest_monitoring_config` now answers in English for English input (audiences and
  suggested queries were always Russian); Russian input keeps Russian output.
- Added `mcpName` and `server.json` for the official MCP Registry.
- Added `suggest_monitoring_config` — given a business description, generates target
  audience descriptions, a monitoring location, and suggested queries, plus the API
  calls to apply the config on causabi.com. Purely generative, no auth or API call.
- Added `get_site_report` — client-ready report tool. With a `report_slug` (from a
  public causabi.com/report/<slug> share link), returns the full AI mention-rate
  breakdown across engines. With only a `domain`, returns the public crawlability
  score and explains what's needed for the full report.
- Server now registers 6 tools total (was 4 in 0.4.0): `get_product_guide`,
  `analyze_geo_score`, `get_geo_fixes`, `make_site_geo_ready`,
  `suggest_monitoring_config`, `get_site_report`.
- Fixed User-Agent version drift — `analyze.ts` and `fix.ts` were still sending
  `geo-optimizer-mcp/0.1.0` while `report.ts` sent `0.5.0`. All three now import a
  shared `USER_AGENT` constant (`src/version.ts`) kept in sync with `package.json`.
- README `## Tools` table updated to document all 6 tools (was missing the two
  above); added usage examples for both.

## 0.4.0

- Added `get_product_guide` and `suggest_monitoring_config`.

## 0.2.0

- Added `make_site_geo_ready`.

## 0.1.0

- Initial release: `analyze_geo_score`, `get_geo_fixes`.
