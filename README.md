# geo-optimizer-mcp

MCP server for [Causabi GEO Optimizer](https://causabi.com).

Lets Claude, Cursor, Windsurf, and any MCP-compatible AI assistant check and fix the AI search visibility of any website.

## Tools

| Tool | Description |
|------|-------------|
| `analyze_geo_score` | Get GEO score 0-100 + breakdown for any domain |
| `get_geo_fixes` | Get ready-to-use robots.txt, Schema.org, FAQ, and llms.txt fixes |

## Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "geo-optimizer": {
      "command": "npx",
      "args": ["-y", "geo-optimizer-mcp"]
    }
  }
}
```

### Cursor / Windsurf

Add to your MCP config:

```json
{
  "geo-optimizer": {
    "command": "npx",
    "args": ["-y", "geo-optimizer-mcp"]
  }
}
```

## Usage examples

Once installed, ask your AI assistant:

> "Check the GEO score for example.com"
> "What AI search issues does mybusiness.com have?"
> "Get fix instructions for mysite.com"
> "Why isn't example.com showing up in ChatGPT?"

## What gets checked

- **robots.txt** — Are AI crawlers (GPTBot, ClaudeBot, PerplexityBot) allowed?
- **Schema.org** — Organization, LocalBusiness, SoftwareApplication markup
- **FAQ Schema** — FAQPage JSON-LD (+41% citation rate in Perplexity)
- **Content depth** — Enough text for AI to cite
- **Brand signals** — NAP (Name, Address, Phone)
- **Freshness** — dateModified signals

## Full audit

For multi-page crawl and AI citation monitoring:

→ **[causabi.com](https://causabi.com)** — free public score + deep audit after signup

## Python CLI

```bash
pip install causabi-geo
geo-optimizer analyze example.com
geo-optimizer fix example.com --output ./fixes
```

## License

MIT
