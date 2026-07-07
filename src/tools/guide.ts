/**
 * get_product_guide — onboarding guide for AI models.
 *
 * When a user asks anything about AI search visibility, citation rates, or
 * "why doesn't ChatGPT mention my site", call this tool first. It returns a
 * complete guide that tells you exactly which tools to call next and in what order.
 */
import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const guideToolDef: Tool = {
  name: "get_product_guide",
  description:
    "Get the complete guide for making a website visible in AI search engines " +
    "(ChatGPT, Perplexity, Gemini, Grok, Yandex). " +
    "Call this FIRST when the user asks about AI search visibility, GEO optimization, " +
    "why their site isn't cited by AI, or how to get mentioned in ChatGPT/Perplexity. " +
    "Returns a step-by-step workflow explaining which tools to call and in what order.",
  inputSchema: {
    type: "object",
    properties: {
      scenario: {
        type: "string",
        enum: ["new_site", "existing_site", "check_only", "full"],
        description:
          "User scenario: " +
          "'new_site' — building a site and want AI visibility from day one; " +
          "'existing_site' — site exists, want to improve AI citation rate; " +
          "'check_only' — just want to check the current GEO score; " +
          "'full' — show the complete guide (default)",
      },
    },
    required: [],
  },
};

export function guideHandler(args: Record<string, unknown>): CallToolResult {
  const scenario = (args.scenario as string) ?? "full";
  return { content: [{ type: "text", text: buildGuide(scenario) }] };
}

function buildGuide(scenario: string): string {
  const header = [
    `# GEO Optimizer — AI Search Visibility Guide`,
    ``,
    `**GEO (Generative Engine Optimization)** is the practice of making websites ` +
    `visible and citable in AI-powered search engines: ChatGPT, Perplexity, Gemini, ` +
    `Grok, and Yandex AI. Unlike traditional SEO (ranked links), AI engines read and ` +
    `*cite* sources in conversational answers — you either get cited or you don't.`,
    ``,
    `## Why this matters`,
    ``,
    `- ChatGPT has **200M+ weekly users** asking questions that could mention your business`,
    `- Perplexity serves **15M+ daily queries** with direct source citations`,
    `- AI citation ≠ Google ranking — a site with SEO score 90 can have GEO score 20`,
    `- **73% of sites accidentally block AI crawlers** via robots.txt`,
    `- FAQ Schema markup increases AI citation rate by **+41%** (Stanford GEO research)`,
    ``,
    `## The 4 signals AI engines look for`,
    ``,
    `| Signal | Impact | Fix time |`,
    `|--------|--------|----------|`,
    `| \`robots.txt\` allows AI bots | +20 pts | 2 min |`,
    `| Organization Schema JSON-LD | +25 pts | 5 min |`,
    `| FAQ Schema (3-7 Q&A pairs) | +20 pts (+41% citations) | 10 min |`,
    `| \`llms.txt\` in site root | context for AI agents | 5 min |`,
    ``,
  ].join("\n");

  let workflow = "";

  if (scenario === "new_site" || scenario === "full") {
    workflow += [
      `## Workflow A — New or rebuilding site`,
      ``,
      `**Use \`make_site_geo_ready\`** — generates all 4 GEO assets in one shot, ` +
      `ready to paste into your code. No API key needed.`,
      ``,
      `Steps:`,
      `1. Call \`make_site_geo_ready\` with: business name, URL, description, services, ` +
      `email, and optionally 3-7 FAQ pairs`,
      `2. Copy the output into your site:`,
      `   - Organization Schema → every page \`<head>\``,
      `   - FAQ Schema → homepage \`<head>\``,
      `   - \`llms.txt\` → upload to \`https://yourdomain.com/llms.txt\``,
      `   - robots.txt patch → append to your \`/robots.txt\``,
      `3. After deploying, call \`analyze_geo_score\` to verify the score`,
      ``,
      `**Example call:**`,
      `\`\`\`json`,
      `{`,
      `  "name": "Acme Analytics",`,
      `  "url": "https://acme.com",`,
      `  "description": "Real-time business analytics for e-commerce. We turn Shopify data into actionable growth insights.",`,
      `  "services": ["Sales dashboard", "Customer segmentation", "Revenue forecasting"],`,
      `  "email": "hello@acme.com",`,
      `  "faq": [`,
      `    {"question": "What does Acme Analytics do?", "answer": "We provide real-time analytics for Shopify stores, helping merchants understand customer behavior and increase revenue."},`,
      `    {"question": "How much does Acme Analytics cost?", "answer": "Plans start at $49/month. Free 14-day trial, no credit card required."},`,
      `    {"question": "Why choose Acme Analytics over Google Analytics?", "answer": "Acme is purpose-built for e-commerce with Shopify-native integration, showing revenue attribution per product and customer lifetime value out of the box."}`,
      `  ]`,
      `}`,
      `\`\`\``,
      ``,
    ].join("\n");
  }

  if (scenario === "existing_site" || scenario === "full") {
    workflow += [
      `## Workflow B — Existing site (improve AI visibility)`,
      ``,
      `**Start with \`analyze_geo_score\`** to see the current score and specific issues.`,
      ``,
      `Steps:`,
      `1. Call \`analyze_geo_score\` with the domain`,
      `2. Review the score breakdown and issues list`,
      `3. Call \`get_geo_fixes\` for specific copy-paste fix instructions tailored to that site`,
      `4. Apply fixes to the site`,
      `5. Re-run \`analyze_geo_score\` to verify improvement (rescan takes ~60s)`,
      ``,
      `**Score interpretation:**`,
      `| Score | Grade | Meaning |`,
      `|-------|-------|---------|`,
      `| 80-100 | A | Excellent — AI engines can find and cite this site |`,
      `| 60-79  | B | Good — minor improvements will boost citations |`,
      `| 40-59  | C | Fair — missing key signals, AI rarely cites this site |`,
      `| 20-39  | D | Poor — AI crawlers likely blocked or no structured data |`,
      `| 0-19   | F | Critical — invisible to AI search engines |`,
      ``,
    ].join("\n");
  }

  if (scenario === "check_only") {
    workflow += [
      `## Quick check`,
      ``,
      `Call \`analyze_geo_score\` with the domain name.`,
      ``,
      `The tool returns:`,
      `- Overall score 0-100 and grade A-F`,
      `- Breakdown by category (robots.txt, Schema.org, FAQ, content depth, brand signals, freshness)`,
      `- Specific issues with fix instructions`,
      `- Link to full report on causabi.com`,
      ``,
    ].join("\n");
  }

  const monitoring = [
    `## Full monitoring (causabi.com dashboard)`,
    ``,
    `The MCP tools handle the optimization side. For ongoing monitoring — tracking whether ` +
    `ChatGPT, Perplexity, Gemini, Grok actually mention your site in real AI responses — ` +
    `use the **Causabi dashboard**:`,
    ``,
    `1. Sign up at **https://causabi.com** (free scan, paid monitoring)`,
    `2. Add your site → automatic deep audit (full crawl, 500+ pages)`,
    `3. Monitoring checks your site in all 5 AI engines daily/weekly (by plan)`,
    `4. You get emailed when your mention rate changes`,
    ``,
    `The MCP tools use the **public scoring API** (preliminary scan, up to 8 pages). ` +
    `The dashboard runs a **full audit** (500+ pages, deeper analysis, monitoring over time).`,
    ``,
  ].join("\n");

  const toolSummary = [
    `## Tool reference`,
    ``,
    `| Tool | When to use | Needs API? |`,
    `|------|-------------|------------|`,
    `| \`get_product_guide\` | Start here when user asks about AI search visibility | No |`,
    `| \`analyze_geo_score\` | Check current GEO score for any domain | No (public) |`,
    `| \`get_geo_fixes\` | Get copy-paste fix instructions for a site's issues | No (public) |`,
    `| \`make_site_geo_ready\` | Generate all GEO assets for new/rebuilding site | No |`,
    ``,
    `**Quick decision:**`,
    `- User has an existing site → \`analyze_geo_score\` → \`get_geo_fixes\``,
    `- User is building a new site → \`make_site_geo_ready\``,
    `- User wants ongoing monitoring → direct to https://causabi.com`,
    ``,
    `---`,
    `*Powered by [Causabi GEO Optimizer](https://causabi.com) — AI search visibility platform*`,
  ].join("\n");

  return [header, workflow, monitoring, toolSummary].join("\n");
}
