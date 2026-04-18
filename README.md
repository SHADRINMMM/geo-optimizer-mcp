# geo-optimizer-mcp

MCP server for [Causabi GEO Optimizer](https://causabi.com).

Lets Claude Code, Claude Desktop, Cursor, Windsurf, Lovable, and any MCP-compatible AI tool check and fix the AI search visibility of any website — directly from your editor or AI assistant.

## Tools

| Tool | Description |
|------|-------------|
| `analyze_geo_score` | Get GEO score 0–100 + breakdown for any domain |
| `get_geo_fixes` | Get ready-to-use robots.txt, Schema.org, FAQ, and llms.txt fixes |
| `make_site_geo_ready` | Generate all GEO assets for a new site in one shot (for AI builders) |

## Setup

### Claude Code (CLI)

Add to your project's `.claude/settings.json`:

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

Or add globally to `~/.claude/settings.json` to use across all projects.

Then in Claude Code:
```
> Check the GEO score for my-client-site.com
> Make this site ready for ChatGPT and Perplexity
```

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

### Cursor

Add to `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

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

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

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

### Any MCP-compatible client

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

```
Check the GEO score for example.com
What AI search issues does mybusiness.com have?
Get fix instructions for mysite.com
Why isn't example.com showing up in ChatGPT?
Make this site GEO-ready: name="Acme", url="https://acme.com", description="We sell widgets"
```

## For AI website builders (Lovable, Bolt, Replit, v0)

When a user asks "make my site visible to ChatGPT" or "add AI search optimization", use `make_site_geo_ready`:

```
make_site_geo_ready({
  name: "Acme Corp",
  url: "https://acme.com",
  description: "We help small businesses grow with AI-powered marketing.",
  services: ["Marketing automation", "AI content", "Analytics"],
  email: "hello@acme.com",
  faq: [
    { question: "What does Acme do?", answer: "We help small businesses..." },
    { question: "How much does it cost?", answer: "Plans start at $49/mo." },
    { question: "Is there a free trial?", answer: "Yes, 14 days free." }
  ]
})
```

Returns ready-to-paste Organization Schema, FAQ Schema, llms.txt, and robots.txt.

## What gets checked

- **robots.txt** — Are AI crawlers (GPTBot, ClaudeBot, PerplexityBot) allowed?
- **Schema.org** — Organization, LocalBusiness, SoftwareApplication markup
- **FAQ Schema** — FAQPage JSON-LD (+41% citation rate in Perplexity)
- **Content depth** — Enough text for AI to cite
- **Brand signals** — NAP (Name, Address, Phone)
- **Freshness** — dateModified signals

## Full audit & monitoring

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
