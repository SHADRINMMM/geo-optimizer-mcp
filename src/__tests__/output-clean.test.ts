import { describe, it, expect } from "@jest/globals";
import { guideHandler } from "../tools/guide.js";
import { generateHandler } from "../tools/generate.js";
import { configureHandler } from "../tools/configure.js";

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2500}-\u{259F}\u{FE0F}]/u;
const UNSOURCED = [/\+41%/, /200M\+/, /15M\+/, /73%/, /Yandex/i, /Perplexity(?!Bot)/];

function text(r: { content: Array<{ type: string; text?: string }> }): string {
  return r.content.map((c) => c.text ?? "").join("\n");
}

const outputs: Array<[string, string]> = [
  ["guide full", text(guideHandler({}) as any)],
  ["guide new_site", text(guideHandler({ scenario: "new_site" }) as any)],
  ["guide check_only", text(guideHandler({ scenario: "check_only" }) as any)],
  [
    "generate",
    text(
      generateHandler({
        name: "Acme",
        url: "https://acme.com",
        description: "Analytics for stores.",
        faq: [
          { question: "a?", answer: "b" },
          { question: "c?", answer: "d" },
          { question: "e?", answer: "f" },
        ],
      }) as any
    ),
  ],
  [
    "generate no faq",
    text(generateHandler({ name: "Acme", url: "https://acme.com", description: "Analytics for stores." }) as any),
  ],
  [
    "configure",
    text(configureHandler({ business_name: "Acme", business_description: "Online store for shoes" }) as any),
  ],
];

describe("static tool output", () => {
  it.each(outputs)("%s has no emoji and no unsourced claims", (_name, out) => {
    expect(out).not.toMatch(EMOJI);
    for (const re of UNSOURCED) expect(out).not.toMatch(re);
  });

  it("guide names the canonical engines", () => {
    const out = text(guideHandler({}) as any);
    for (const e of ["ChatGPT", "Gemini", "Grok", "Claude"]) expect(out).toContain(e);
  });
});
