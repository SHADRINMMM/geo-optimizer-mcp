/**
 * make_site_geo_ready — generate all GEO assets for a new or existing site.
 *
 * This is the primary tool for AI website builders (Lovable, Bolt, Replit, v0).
 * When a user asks "make my site visible to ChatGPT" or "add AI search optimization",
 * call this tool to get ready-to-paste Organization schema, FAQ schema, llms.txt,
 * and robots.txt — all in one shot, no API key required.
 */
import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const generateToolDef: Tool = {
  name: "make_site_geo_ready",
  description:
    "Generate all GEO (AI search optimization) assets for a website in one shot. " +
    "Returns ready-to-use Organization Schema JSON-LD, FAQ Schema JSON-LD, llms.txt, " +
    "and robots.txt snippet — so AI search engines like ChatGPT, Gemini, Grok, and Claude " +
    "can find, understand, and cite the site. " +
    "Use this when building or updating a website and the user wants AI search visibility. " +
    "No API key required.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Business or site name (e.g. 'Acme Corp')",
      },
      url: {
        type: "string",
        description: "Site URL (e.g. 'https://acme.com')",
      },
      description: {
        type: "string",
        description: "What the business does — 1-3 sentences",
      },
      services: {
        type: "array",
        items: { type: "string" },
        description: "List of services or products (e.g. ['Web design', 'SEO', 'Hosting'])",
      },
      email: {
        type: "string",
        description: "Contact email (optional)",
      },
      phone: {
        type: "string",
        description: "Contact phone (optional)",
      },
      faq: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer:   { type: "string" },
          },
          required: ["question", "answer"],
        },
        description: "FAQ pairs (optional — 3-7 Q&A recommended)",
      },
    },
    required: ["name", "url", "description"],
  },
};

interface FAQItem { question: string; answer: string; }

interface GenerateArgs {
  name:        string;
  url:         string;
  description: string;
  services?:   string[];
  email?:      string;
  phone?:      string;
  faq?:        FAQItem[];
}

export function generateHandler(args: Record<string, unknown>): CallToolResult {
  const { name, url, description, services = [], email, phone, faq = [] } =
    args as unknown as GenerateArgs;

  if (!name || !url || !description) {
    return {
      content: [{ type: "text", text: "name, url, and description are required" }],
      isError: true,
    };
  }

  const domain = extractDomain(url);

  const orgSchema   = buildOrgSchema({ name, url, description, email, phone });
  const faqSchema   = faq.length >= 3 ? buildFaqSchema(faq) : null;
  const llmsTxt     = buildLlmsTxt({ name, url, domain, description, services, email });
  const robotsPatch = buildRobotsPatch();

  const lines: string[] = [
    `# GEO Assets for ${name}`,
    ``,
    `All assets are ready to copy-paste. Adding these makes your site visible to ChatGPT, Gemini, Grok, Claude, and other AI search engines.`,
    ``,
    `---`,
    ``,
    `## 1. Organization Schema — add to \`<head>\``,
    ``,
    `**What it does:** tells AI your business name, website, and contact info. Required for AI to cite you correctly.`,
    ``,
    `\`\`\`html`,
    `<script type="application/ld+json">`,
    JSON.stringify(orgSchema, null, 2),
    `</script>`,
    `\`\`\``,
    ``,
  ];

  if (faqSchema) {
    lines.push(
      `## 2. FAQ Schema — add to homepage \`<head>\``,
      ``,
      `**What it does:** FAQ markup gives AI engines clean question-and-answer pairs to quote.`,
      ``,
      `\`\`\`html`,
      `<script type="application/ld+json">`,
      JSON.stringify(faqSchema, null, 2),
      `</script>`,
      `\`\`\``,
      ``,
    );
  } else {
    lines.push(
      `## 2. FAQ Schema — add 3+ Q&A pairs`,
      ``,
      `Call \`make_site_geo_ready\` again with a \`faq\` array (3-7 items) to generate FAQ Schema.`,
      `Example:`,
      `\`\`\`json`,
      `"faq": [`,
      `  {"question": "What does ${name} do?", "answer": "${description}"},`,
      `  {"question": "How much does it cost?", "answer": "..."},`,
      `  {"question": "Why choose ${name}?", "answer": "..."}`,
      `]`,
      `\`\`\``,
      ``,
    );
  }

  lines.push(
    `## 3. llms.txt — upload to \`${url}/llms.txt\``,
    ``,
    `**What it does:** AI agents (like Claude when browsing the web) read this file to understand your site instantly.`,
    ``,
    `\`\`\`markdown`,
    llmsTxt,
    `\`\`\``,
    ``,
    `## 4. robots.txt — add to your \`/robots.txt\``,
    ``,
    `**What it does:** allows AI crawlers to read your site. Many sites block them by accident.`,
    ``,
    `\`\`\``,
    robotsPatch,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## Checklist`,
    ``,
    `- [ ] Organization Schema added to \`<head>\` on all pages`,
    faqSchema
      ? `- [ ] FAQ Schema added to homepage \`<head>\``
      : `- [ ] Add FAQ Schema (call \`make_site_geo_ready\` with \`faq\` array)`,
    `- [ ] \`llms.txt\` uploaded to site root`,
    `- [ ] robots.txt updated to allow AI crawlers`,
    ``,
    `**Verify your score:** https://causabi.com/score/${domain}`,
  );

  return { content: [{ type: "text", text: lines.join("\n") }] };
}


// --- Builders ---

function buildOrgSchema(p: { name: string; url: string; description: string; email?: string; phone?: string }) {
  const schema: Record<string, unknown> = {
    "@context":   "https://schema.org",
    "@type":      "Organization",
    "name":       p.name,
    "url":        p.url,
    "description": p.description,
  };
  if (p.email) schema["email"]     = p.email;
  if (p.phone) schema["telephone"] = p.phone;
  return schema;
}

function buildFaqSchema(faq: FAQItem[]) {
  return {
    "@context":   "https://schema.org",
    "@type":      "FAQPage",
    "mainEntity": faq.map(({ question, answer }) => ({
      "@type": "Question",
      "name":  question,
      "acceptedAnswer": { "@type": "Answer", "text": answer },
    })),
  };
}

function buildLlmsTxt(p: {
  name: string; url: string; domain: string;
  description: string; services: string[]; email?: string;
}) {
  const lines = [
    `# ${p.name}`,
    ``,
    `> ${p.description}`,
  ];
  if (p.services.length > 0) {
    lines.push(``, `## Services`);
    for (const s of p.services) lines.push(`- ${s}`);
  }
  lines.push(``, `## Links`, `- Website: ${p.url}`);
  if (p.email) lines.push(`- Email: ${p.email}`);
  return lines.join("\n");
}

function buildRobotsPatch() {
  return [
    "# AI Search Engine Crawlers — allow all",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
    "User-agent: Bytespider",
    "Allow: /",
    "",
    "User-agent: CCBot",
    "Allow: /",
  ].join("\n");
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  }
}
