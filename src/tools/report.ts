/**
 * get_site_report — agentic "give me a report on this client site" scenario.
 *
 * Today this can only be served two ways without a Causabi login:
 *   1. `report_slug` — a Visibility Report share link (already public,
 *      unauthenticated: GET /api/v1/reports/{slug}). Full mention-rate
 *      breakdown across AI engines, no API key needed.
 *   2. `domain` only — falls back to the public GEO score (same data as
 *      analyze_geo_score) and tells the model how to get a full report.
 *
 * There is currently NO API-key-authenticated endpoint for "give me the
 * latest monitoring results / visibility score for domain X" the way
 * /api/v1/wp/analyze works with X-Causabi-Key. The /monitor/{site_id}/*
 * and /sites/{site_id}/visibility-report endpoints require a PropelAuth
 * browser session (see backend/app/api/v1/monitor.py, visibility_report.py).
 * This tool documents that gap in its own output rather than silently
 * failing, so agents (and operators reading the transcript) know what's
 * missing.
 */
import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { USER_AGENT } from "../version.js";

const BASE_URL = process.env.CAUSABI_API_URL ?? "https://ai.causabi.com";

export const reportToolDef: Tool = {
  name: "get_site_report",
  description:
    "Get a client-ready report for a site: GEO score breakdown, and — if a " +
    "Visibility Report share link (slug) is available — AI mention-rate results " +
    "across engines (ChatGPT, Claude, Gemini, Grok). " +
    "Use this when the user asks for 'a report on this site', 'how is this client doing', " +
    "or wants something to hand to a client. " +
    "Pass `report_slug` if you have a causabi.com/report/<slug> link (full report, no API key needed). " +
    "Pass only `domain` for a score-only summary (no monitoring history available without a Causabi login).",
  inputSchema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        description: "Domain to report on (e.g. 'example.com'). Required if report_slug is not given.",
      },
      report_slug: {
        type: "string",
        description:
          "Visibility Report slug from a causabi.com/report/<slug> share link. " +
          "When given, returns the full mention-rate report instead of just the score.",
      },
    },
    required: [],
  },
};

export async function reportHandler(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const slug = typeof args.report_slug === "string" ? args.report_slug.trim() : "";
  const domain = normalizeDomain(String(args.domain ?? ""));

  if (!slug && !domain) {
    return errorResult("Provide either report_slug or domain.");
  }

  if (slug) {
    return fetchVisibilityReport(slug, domain);
  }

  return fetchScoreOnlyReport(domain);
}

async function fetchVisibilityReport(slug: string, domainHint: string): Promise<CallToolResult> {
  let data: VisibilityReportResponse;
  try {
    const resp = await fetch(`${BASE_URL}/api/v1/reports/${encodeURIComponent(slug)}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (resp.status === 404) {
      return errorResult(`No report found for slug "${slug}" — check the share link is correct.`);
    }
    if (!resp.ok) {
      return errorResult(`API error ${resp.status} fetching report ${slug}`);
    }
    data = (await resp.json()) as VisibilityReportResponse;
  } catch (e) {
    return errorResult(`Failed to reach Causabi API: ${String(e)}`);
  }

  return { content: [{ type: "text", text: formatVisibilityReport(data, domainHint) }] };
}

async function fetchScoreOnlyReport(domain: string): Promise<CallToolResult> {
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
            `Scan started for **${domain}** — not scored yet. Try again in 30-60 seconds, ` +
            `or check [causabi.com/score/${domain}](https://causabi.com/score/${domain}).`,
        },
      ],
    };
  }

  return { content: [{ type: "text", text: formatScoreOnlyReport(domain, data) }] };
}

function formatVisibilityReport(d: VisibilityReportResponse, domainHint: string): string {
  const title = domainHint ? `Site Report: ${domainHint}` : "Site Report";
  const lines: string[] = [
    `## ${title}`,
    ``,
    `**Mention rate: ${d.mention_rate ?? "?"}%** across ${d.engines?.length ?? 0} AI engine(s): ${(d.engines ?? []).join(", ") || "n/a"}`,
    `Generated: ${d.generated_at ? new Date(d.generated_at).toLocaleString() : "unknown"}`,
    ``,
  ];

  if (d.competitors_named?.length) {
    lines.push(`### Competitors AI mentioned instead`, ``, ...d.competitors_named.map((c) => `- ${c}`), ``);
  }

  const results = d.results ?? [];
  if (results.length > 0) {
    lines.push(`### Per-query results`, ``, `| Query | Engine | Mentioned | Position |`, `|---|---|---|---|`);
    for (const r of results) {
      lines.push(`| ${r.query ?? "?"} | ${r.engine ?? "?"} | ${r.mentioned ? "yes" : "no"} | ${r.position ?? "-"} |`);
    }
    lines.push(``);
  }

  lines.push(
    `---`,
    `Share link: [${d.share_url ?? ""}](${d.share_url ?? ""})`,
    ``,
    `For ongoing monitoring (scheduled re-checks, alerts on change) see the causabi.com dashboard.`
  );

  return lines.join("\n");
}

function formatScoreOnlyReport(domain: string, d: ScoreResponse): string {
  const lines: string[] = [
    `## Site Report: ${domain}`,
    ``,
    `**GEO Score: ${d.score ?? "?"}/100  Grade: ${d.grade ?? "?"}**`,
    ``,
    `No AI mention-monitoring data available for this report — this summary only covers the ` +
    `public crawlability score (robots.txt, Schema.org, FAQ schema, content depth).`,
    ``,
  ];

  const issues = d.issues ?? [];
  if (issues.length > 0) {
    lines.push(`### Top issues`, ``);
    for (const issue of issues.slice(0, 5)) {
      lines.push(`- **${issue.message}** — ${issue.fix}`);
    }
    lines.push(``);
  }

  lines.push(
    `---`,
    `**To include AI mention-rate history (ChatGPT/Claude/Gemini/Grok) in this report:**`,
    `- If you have a causabi.com/report/<slug> link, call get_site_report again with report_slug set.`,
    `- Otherwise, sign in at causabi.com to generate a Visibility Report for ${domain} (requires an active site + business profile).`,
    ``,
    `[Full score -> causabi.com/score/${domain}](https://causabi.com/score/${domain})`
  );

  return lines.join("\n");
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
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}

interface ScoreResponse {
  status?: string;
  domain?: string;
  score?: number;
  grade?: string;
  breakdown?: Record<string, number>;
  issues?: Array<{ category: string; severity: string; message: string; fix: string }>;
  updated_at?: string;
}

interface VisibilityReportResponse {
  slug?: string;
  kind?: string;
  engines?: string[];
  queries?: string[];
  results?: Array<{ query?: string; engine?: string; mentioned?: boolean; position?: number | null }>;
  competitors_named?: string[];
  mention_rate?: number;
  generated_at?: string;
  share_url?: string;
}
