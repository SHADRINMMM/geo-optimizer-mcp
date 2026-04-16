import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { analyzeHandler, analyzeToolDef } from "../tools/analyze.js";

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const SCORE_RESPONSE = {
  domain: "example.com",
  score: 87,
  grade: "A",
  breakdown: {
    robots_txt: 20,
    schema_org: 25,
    faq_schema: 20,
    content_depth: 12,
    brand_signals: 8,
    freshness: 2,
  },
  issues: [
    {
      category: "freshness",
      severity: "info",
      message: "No freshness signals",
      fix: "Add dateModified to schema",
    },
  ],
  updated_at: "2026-04-14T00:00:00Z",
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("analyzeToolDef", () => {
  it("has required fields", () => {
    expect(analyzeToolDef.name).toBe("analyze_geo_score");
    expect(analyzeToolDef.inputSchema.required).toContain("domain");
  });
});

describe("analyzeHandler", () => {
  it("returns formatted score for valid domain", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SCORE_RESPONSE,
    } as Response);

    const result = await analyzeHandler({ domain: "example.com" });
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("87/100");
    expect(text).toContain("Grade: A");
    expect(text).toContain("example.com");
  });

  it("normalizes domain with https:// prefix", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SCORE_RESPONSE,
    } as Response);

    await analyzeHandler({ domain: "https://www.example.com" });
    const calledUrl = (mockFetch.mock.calls[0][0] as string);
    expect(calledUrl).toContain("/api/score/example.com");
  });

  it("returns scanning message for 202 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "scanning", domain: "new.com" }),
    } as Response);

    const result = await analyzeHandler({ domain: "new.com" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("scan");
  });

  it("returns error for API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const result = await analyzeHandler({ domain: "example.com" });
    expect(result.isError).toBe(true);
  });

  it("returns error for empty domain", async () => {
    const result = await analyzeHandler({ domain: "" });
    expect(result.isError).toBe(true);
  });

  it("includes issue list in output", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...SCORE_RESPONSE,
        issues: [
          { category: "faq_schema", severity: "critical", message: "No FAQ schema", fix: "Add FAQPage JSON-LD" },
        ],
      }),
    } as Response);

    const result = await analyzeHandler({ domain: "example.com" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("No FAQ schema");
  });
});
