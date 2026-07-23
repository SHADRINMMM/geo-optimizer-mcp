import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { USER_AGENT } from "../version.js";

const BASE_URL = process.env.CAUSABI_API_URL ?? "https://ai.causabi.com";

export const analyzeToolDef: Tool = {
  name: "analyze_geo_score",
  description:
    "Check the GEO (Generative Engine Optimization) score for any existing website. " +
    "Returns an AI readiness score 0-100, grade A-F, and a breakdown of specific issues " +
    "that reduce visibility in ChatGPT, Perplexity, Gemini, Grok, and other AI search engines. " +
    "Use this for existing sites. For new or rebuilding sites, use make_site_geo_ready instead. " +
    "After getting the score, call get_geo_fixes to get specific copy-paste fix instructions.",
  inputSchema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        description: "Domain to analyze (e.g. 'example.com' or 'https://example.com')",
      },
    },
    required: ["domain"],
  },
};

export async function analyzeHandler(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const domain = normalizeDomain(String(args.domain ?? ""));
  if (!domain) {
    return errorResult("Invalid domain — provide something like 'example.com'");
  }

  let data: ScoreResponse;
  try {
    const resp = await fetch(`${BASE_URL}/api/score/${domain}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!resp.ok) {
      return errorResult(`API error ${resp.status} for ${domain}`);
    }
    data = (await resp.json()) as ScoreResponse;
  } catch (e) {
    return errorResult(`Failed to reach Causabi API: ${String(e)}`);
  }

  if (data.status === "scanning") {
    return {
      content: [
        {
          type: "text",
          text:
            `🔄 Scan started for **${domain}**\n\n` +
            `The site hasn't been scored yet — a scan has been triggered. ` +
            `Try again in 30–60 seconds.\n\n` +
            `[View live score → causabi.com/score/${domain}](https://causabi.com/score/${domain})`,
        },
      ],
    };
  }

  return { content: [{ type: "text", text: formatScore(domain, data) }] };
}

function formatScore(domain: string, d: ScoreResponse): string {
  const grade = d.grade ?? "?";
  const score = d.score ?? 0;
  const bar = scoreBar(score);
  const updated = d.updated_at
    ? `Last scanned: ${new Date(d.updated_at).toLocaleDateString()}`
    : "";

  const lines: string[] = [
    `## GEO Score: ${domain}`,
    ``,
    `**Score: ${score}/100  Grade: ${grade}**  ${bar}`,
    ``,
    `### Breakdown`,
    `| Category | Score | Max |`,
    `|----------|-------|-----|`,
  ];

  const breakdown = d.breakdown ?? {};
  const labels: Record<string, [string, number]> = {
    robots_txt:    ["robots.txt (AI crawlers allowed)", 20],
    schema_org:    ["Schema.org markup",                25],
    faq_schema:    ["FAQ Schema (+41% citation rate)",  20],
    content_depth: ["Content depth",                   15],
    brand_signals: ["Brand signals (NAP)",              10],
    freshness:     ["Content freshness",                10],
  };

  for (const [key, [label, max]] of Object.entries(labels)) {
    const val = (breakdown as Record<string, number>)[key] ?? 0;
    const icon = val === max ? "✅" : val >= max * 0.5 ? "⚠️" : "❌";
    lines.push(`| ${icon} ${label} | ${val} | ${max} |`);
  }

  const issues: Issue[] = d.issues ?? [];
  if (issues.length > 0) {
    lines.push(``, `### Issues to fix`);
    for (const issue of issues) {
      const sev = issue.severity === "critical" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
      lines.push(`${sev} **${issue.message}**`);
      lines.push(`   → ${issue.fix}`);
      lines.push(``);
    }
  } else {
    lines.push(``, `✅ No critical issues found!`);
  }

  lines.push(``, `🔗 [Full report → causabi.com/score/${domain}](https://causabi.com/score/${domain})`);
  if (updated) lines.push(updated);

  return lines.join("\n");
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function normalizeDomain(raw: string): string {
  raw = raw.trim().toLowerCase();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      return new URL(raw).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }
  return raw.replace(/^www\./, "").split("/")[0];
}

function errorResult(msg: string): CallToolResult {
  return { content: [{ type: "text", text: `❌ ${msg}` }], isError: true };
}

interface ScoreResponse {
  status?: string;
  domain?: string;
  score?: number;
  grade?: string;
  breakdown?: Record<string, number>;
  issues?: Issue[];
  updated_at?: string;
  pages_scanned?: number;
}

interface Issue {
  category: string;
  severity: string;
  message: string;
  fix: string;
}
