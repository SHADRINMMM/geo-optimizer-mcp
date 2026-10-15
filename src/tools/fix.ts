import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { USER_AGENT } from "../version.js";

const BASE_URL = process.env.CAUSABI_API_URL ?? "https://ai.causabi.com";

export const fixToolDef: Tool = {
  name: "get_geo_fixes",
  description:
    "Get specific copy-paste fix instructions for a website's GEO (AI search) issues. " +
    "Returns ready-to-use code for robots.txt, Organization Schema JSON-LD, FAQ Schema, " +
    "and llms.txt — tailored to that site's current score and issues. " +
    "Call this AFTER analyze_geo_score to get actionable fixes for an existing site.",
  inputSchema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        description: "Domain to get fixes for (e.g. 'example.com')",
      },
    },
    required: ["domain"],
  },
};

export async function fixHandler(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const domain = normalizeDomain(String(args.domain ?? ""));
  if (!domain) {
    return errorResult("Invalid domain");
  }

  // Fetch current score to base fixes on
  let data: ScoreResponse;
  try {
    const resp = await fetch(`${BASE_URL}/api/score/${domain}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!resp.ok) {
      return errorResult(`API error ${resp.status}`);
    }
    data = (await resp.json()) as ScoreResponse;
  } catch (e) {
    return errorResult(`Failed to reach API: ${String(e)}`);
  }

  if (data.status === "scanning") {
    return {
      content: [{
        type: "text",
        text: `Score not yet available for **${domain}** — scan in progress. Try again in 30–60 seconds.`,
      }],
    };
  }

  return { content: [{ type: "text", text: formatFixes(domain, data) }] };
}

function formatFixes(domain: string, d: ScoreResponse): string {
  const issues = d.issues ?? [];
  const breakdown = d.breakdown ?? {};

  const lines: string[] = [
    `## GEO Fix Guide: ${domain}`,
    ``,
    `Current score: **${d.score ?? "?"}/100 Grade ${d.grade ?? "?"}**`,
    ``,
    `### Fixes (by priority)`,
    ``,
  ];

  // robots.txt fix
  if ((breakdown["robots_txt"] ?? 20) < 20) {
    lines.push(
      `#### 1. robots.txt — AI crawlers blocked`,
      ``,
      `Add to your \`/robots.txt\`:`,
      `\`\`\``,
      `# AI Search Engine Crawlers`,
      `User-agent: GPTBot`,
      `Allow: /`,
      ``,
      `User-agent: ClaudeBot`,
      `Allow: /`,
      ``,
      `User-agent: PerplexityBot`,
      `Allow: /`,
      ``,
      `User-agent: Google-Extended`,
      `Allow: /`,
      ``,
      `User-agent: Bytespider`,
      `Allow: /`,
      ``,
      `User-agent: CCBot`,
      `Allow: /`,
      `\`\`\``,
      ``,
    );
  }

  // FAQ schema fix
  if ((breakdown["faq_schema"] ?? 0) < 15) {
    lines.push(
      `#### 2. FAQ Schema — missing or thin`,
      ``,
      `Add to your homepage \`<head>\`:`,
      `\`\`\`html`,
      `<script type="application/ld+json">`,
      `{`,
      `  "@context": "https://schema.org",`,
      `  "@type": "FAQPage",`,
      `  "mainEntity": [`,
      `    {`,
      `      "@type": "Question",`,
      `      "name": "What does ${domain} do?",`,
      `      "acceptedAnswer": {`,
      `        "@type": "Answer",`,
      `        "text": "Describe your main service/product here (2-3 sentences)."`,
      `      }`,
      `    },`,
      `    {`,
      `      "@type": "Question",`,
      `      "name": "How much does it cost?",`,
      `      "acceptedAnswer": { "@type": "Answer", "text": "Your pricing here." }`,
      `    },`,
      `    {`,
      `      "@type": "Question",`,
      `      "name": "Why choose ${domain}?",`,
      `      "acceptedAnswer": { "@type": "Answer", "text": "Your differentiators here." }`,
      `    }`,
      `  ]`,
      `}`,
      `</script>`,
      `\`\`\``,
      `> **Tip:** Add 5-7 Q&A pairs for best coverage. Use \`geo-optimizer fix ${domain}\` to auto-generate with AI.`,
      ``,
    );
  }

  // Schema.org fix
  if ((breakdown["schema_org"] ?? 0) < 15) {
    lines.push(
      `#### 3. Schema.org — missing or sparse`,
      ``,
      `Add Organization schema to \`<head>\`:`,
      `\`\`\`html`,
      `<script type="application/ld+json">`,
      `{`,
      `  "@context": "https://schema.org",`,
      `  "@type": "Organization",`,
      `  "name": "Your Business Name",`,
      `  "url": "https://${domain}",`,
      `  "description": "What you do in 1-2 sentences.",`,
      `  "telephone": "+1-555-000-0000",`,
      `  "email": "contact@${domain}",`,
      `  "sameAs": ["https://linkedin.com/company/...", "https://twitter.com/..."]`,
      `}`,
      `</script>`,
      `\`\`\``,
      ``,
    );
  }

  // llms.txt fix
  lines.push(
    `#### 4. llms.txt — AI agent readable description`,
    ``,
    `Create \`https://${domain}/llms.txt\`:`,
    `\`\`\`markdown`,
    `# Your Business Name`,
    ``,
    `> One-line tagline`,
    ``,
    `## About`,
    `2-3 paragraph description of what you do, who you serve, what makes you different.`,
    ``,
    `## Services`,
    `- Service 1: description`,
    `- Service 2: description`,
    ``,
    `## Contact`,
    `- Website: https://${domain}`,
    `- Email: contact@${domain}`,
    `\`\`\``,
    ``,
  );

  lines.push(
    `---`,
    ``,
    `**Automate with CLI:**`,
    `\`\`\`bash`,
    `pip install causabi-geo`,
    `geo-optimizer fix ${domain} --output ./fixes`,
    `\`\`\``,
    ``,
    `[Full audit -> causabi.com/score/${domain}](https://causabi.com/score/${domain})`,
  );

  // If no issues, everything is good
  if (issues.length === 0 && (d.score ?? 0) >= 80) {
    return [
      `## GEO Fixes: ${domain}`,
      ``,
      `**Score: ${d.score}/100 Grade ${d.grade}** — site is well-optimized for AI search!`,
      ``,
      `No critical fixes needed. Monitor your AI visibility at:`,
      `[causabi.com/score/${domain}](https://causabi.com/score/${domain})`,
    ].join("\n");
  }

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
  return { content: [{ type: "text", text: `${msg}` }], isError: true };
}

interface ScoreResponse {
  status?: string;
  score?: number;
  grade?: string;
  breakdown?: Record<string, number>;
  issues?: Array<{ category: string; severity: string; message: string; fix: string }>;
  updated_at?: string;
}
