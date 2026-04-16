import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { fixHandler, fixToolDef } from "../tools/fix.js";

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const LOW_SCORE = {
  domain: "example.com",
  score: 23,
  grade: "F",
  breakdown: { robots_txt: 0, schema_org: 0, faq_schema: 0, content_depth: 13, brand_signals: 8, freshness: 2 },
  issues: [
    { category: "robots_txt", severity: "critical", message: "GPTBot blocked", fix: "Allow GPTBot" },
    { category: "faq_schema", severity: "critical", message: "No FAQ schema", fix: "Add FAQPage" },
    { category: "schema_org", severity: "warning", message: "No Organization schema", fix: "Add schema" },
  ],
};

const HIGH_SCORE = {
  domain: "good.com",
  score: 94,
  grade: "A",
  breakdown: { robots_txt: 20, schema_org: 25, faq_schema: 20, content_depth: 15, brand_signals: 10, freshness: 4 },
  issues: [],
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fixToolDef", () => {
  it("has required fields", () => {
    expect(fixToolDef.name).toBe("get_geo_fixes");
    expect(fixToolDef.inputSchema.required).toContain("domain");
  });
});

describe("fixHandler", () => {
  it("returns robots.txt fix when bots blocked", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => LOW_SCORE } as Response);

    const result = await fixHandler({ domain: "example.com" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("robots.txt");
    expect(text).toContain("GPTBot");
  });

  it("returns FAQ schema fix when missing", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => LOW_SCORE } as Response);

    const result = await fixHandler({ domain: "example.com" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("FAQPage");
    expect(text).toContain("schema.org");
  });

  it("returns llms.txt fix always", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => LOW_SCORE } as Response);

    const result = await fixHandler({ domain: "example.com" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("llms.txt");
  });

  it("returns 'all good' message for high-scoring site", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => HIGH_SCORE } as Response);

    const result = await fixHandler({ domain: "good.com" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("94/100");
  });

  it("returns scanning message when score not ready", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "scanning", domain: "new.com" }),
    } as Response);

    const result = await fixHandler({ domain: "new.com" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("scan");
  });
});
