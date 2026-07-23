import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { reportHandler, reportToolDef } from "../tools/report.js";

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const VISIBILITY_REPORT = {
  slug: "abc123",
  engines: ["chatgpt", "claude", "gemini", "grok"],
  mention_rate: 42,
  generated_at: "2026-07-01T00:00:00Z",
  competitors_named: ["Rival Co"],
  results: [
    { query: "best dentist austin", engine: "chatgpt", mentioned: true, position: 2 },
  ],
  share_url: "https://causabi.com/report/abc123",
};

const SCORE_RESPONSE = {
  domain: "example.com",
  score: 61,
  grade: "B",
  issues: [
    { category: "faq_schema", severity: "warning", message: "No FAQ schema", fix: "Add FAQPage JSON-LD" },
  ],
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("reportToolDef", () => {
  it("has the right name and no required fields", () => {
    expect(reportToolDef.name).toBe("get_site_report");
    expect(reportToolDef.inputSchema.required).toEqual([]);
  });
});

describe("reportHandler", () => {
  it("returns an error when neither report_slug nor domain is given", async () => {
    const result = await reportHandler({});
    expect(result.isError).toBe(true);
  });

  it("fetches the visibility report when report_slug is given", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => VISIBILITY_REPORT,
    } as Response);

    const result = await reportHandler({ report_slug: "abc123" });

    expect(result.isError).toBeFalsy();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/v1/reports/abc123");
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("42%");
    expect(text).toContain("Rival Co");
    expect(text).toContain("best dentist austin");
  });

  it("returns a not-found message for a 404 slug", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    const result = await reportHandler({ report_slug: "missing" });
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("No report found");
  });

  it("falls back to the score-only report when only domain is given", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => SCORE_RESPONSE,
    } as Response);

    const result = await reportHandler({ domain: "example.com" });

    expect(result.isError).toBeFalsy();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/score/example.com");
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("61/100");
    expect(text).toContain("No AI mention-monitoring data available");
  });

  it("returns a scanning message for an unscored domain", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "scanning", domain: "new.com" }),
    } as Response);

    const result = await reportHandler({ domain: "new.com" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Scan started");
  });

  it("returns an error when the score API fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const result = await reportHandler({ domain: "example.com" });
    expect(result.isError).toBe(true);
  });

  it("normalizes a domain passed as a full URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => SCORE_RESPONSE,
    } as Response);

    await reportHandler({ domain: "https://www.example.com/path" });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/score/example.com");
  });
});
