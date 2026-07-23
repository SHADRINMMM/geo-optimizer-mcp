# geo-optimizer-mcp

MCP server for [Causabi GEO Optimizer](https://causabi.com).

---

**What this is.** An MCP (Model Context Protocol) server that lets Claude Code, OpenAI Codex CLI, Claude Desktop, Cursor, Windsurf, and any MCP-compatible client check a website's AI-crawler readiness and generate fixes (robots.txt, Schema.org, FAQ markup, llms.txt) — directly from your editor or AI assistant. Runs locally over stdio, no account needed.

**Quickstart (Claude Code):**

```bash
claude mcp add geo-optimizer -- npx -y geo-optimizer-mcp
```

**Quickstart (OpenAI Codex CLI):**

```bash
codex mcp add geo-optimizer -- npx -y geo-optimizer-mcp
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.geo-optimizer]
command = "npx"
args = ["-y", "geo-optimizer-mcp"]
```

Then ask: `Check the GEO score for example.com`. Config-file setup for other clients (Cursor, Windsurf, Claude Desktop) is below.

**Scope.** One-off local checks and fix generation are free here. Continuous work — scheduled re-checks, score history, monitoring of answers from 4 AI engines (ChatGPT, Claude, Gemini, Grok), reports — runs on [causabi.com](https://causabi.com).

---

## Tools

| Tool | When to use |
|------|-------------|
| `get_product_guide` | Start here — complete guide + step-by-step workflow for any scenario |
| `analyze_geo_score` | Check GEO score 0–100 + breakdown for an existing domain |
| `get_geo_fixes` | Get copy-paste robots.txt, Schema.org, FAQ, and llms.txt fixes |
| `make_site_geo_ready` | Generate all GEO assets for a new site in one shot (no API key needed) |
| `suggest_monitoring_config` | Draft a monitoring config (target audiences, location, suggested queries) from a business description — returns JSON plus the API calls to apply it on causabi.com |
| `get_site_report` | Client-ready report: pass `report_slug` for the full AI mention-rate breakdown (no API key needed), or just `domain` for a crawlability-score-only summary |

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
Draft a monitoring config for a dental clinic in Austin, TX called "Bright Smiles Dental"
Give me a report on clientsite.com — here's the share link: causabi.com/report/abc123
```

### `suggest_monitoring_config` example

```
suggest_monitoring_config({
  business_name: "Bright Smiles Dental",
  business_description: "A dental clinic in Austin, TX offering general and cosmetic dentistry for families.",
  location: "Austin, TX"
})
```

Returns target audience descriptions, a monitoring location, and suggested queries as ready-to-use JSON — plus the exact `PUT /api/v1/monitor/{site_id}/settings` and `PUT /api/v1/monitor/{site_id}/queries` calls to apply it (requires a causabi.com account/API token; this tool itself makes no API call).

### `get_site_report` example

```
get_site_report({ report_slug: "abc123" })
```

Returns the full mention-rate breakdown (ChatGPT, Claude, Gemini, Grok), competitors named instead of the client, and per-query results — no API key needed, since Visibility Report share links are public.

```
get_site_report({ domain: "example.com" })
```

Without a `report_slug`, this only returns the public crawlability score (same data as `analyze_geo_score`) plus a note on how to get the full mention-rate report — there is currently no API-key-authenticated way to pull monitoring history from the MCP server; that requires either a share-slug or a causabi.com login.

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
- **FAQ Schema** — FAQPage JSON-LD (associated with +41% citation rate in research)
- **Content depth** — Enough text for AI to cite
- **Brand signals** — NAP (Name, Address, Phone)
- **Freshness** — dateModified signals

## Full audit & monitoring

For multi-page crawl, scheduled re-checks, and monitoring of how 4 AI engines (ChatGPT, Claude, Gemini, Grok) answer questions about your brand:

→ **[causabi.com](https://causabi.com)** — free public score + deep audit after signup

## Python CLI

Same checks as a standalone CLI: [github.com/SHADRINMMM/causabi-geo](https://github.com/SHADRINMMM/causabi-geo)

```bash
pip install causabi-geo
geo-optimizer analyze example.com
geo-optimizer fix example.com --output ./fixes
```

## License

MIT
