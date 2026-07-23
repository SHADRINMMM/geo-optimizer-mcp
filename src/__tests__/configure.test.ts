import { describe, it, expect } from "@jest/globals";
import { configureHandler, configureToolDef } from "../tools/configure.js";

describe("configureToolDef", () => {
  it("has required fields", () => {
    expect(configureToolDef.name).toBe("suggest_monitoring_config");
    expect(configureToolDef.inputSchema.required).toContain("business_name");
    expect(configureToolDef.inputSchema.required).toContain("business_description");
  });
});

describe("configureHandler", () => {
  it("returns error when business_name is missing", () => {
    const result = configureHandler({ business_description: "We sell widgets" });
    expect(result.isError).toBe(true);
  });

  it("returns error when business_description is missing", () => {
    const result = configureHandler({ business_name: "Acme" });
    expect(result.isError).toBe(true);
  });

  it("returns a config with audiences, location, and queries for a dental clinic", () => {
    const result = configureHandler({
      business_name: "Bright Smiles Dental",
      business_description: "A dental clinic in Austin offering general and cosmetic dentistry.",
      location: "Austin, TX",
    });

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Bright Smiles Dental");
    expect(text).toContain("Austin, TX");
    expect(text).toContain("### Suggested queries");
    expect(text).toContain("PUT /api/v1/monitor/{site_id}/settings");
    expect(text).toContain("PUT /api/v1/monitor/{site_id}/queries");
  });

  it("infers a location from the business description when none is given", () => {
    const result = configureHandler({
      business_name: "Клиника Здоровье",
      business_description: "Стоматологическая клиника в Москве для всей семьи.",
    });

    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Москва");
  });

  it("respects existing target_queries when 5 or more are provided", () => {
    const existing = ["q1", "q2", "q3", "q4", "q5"];
    const result = configureHandler({
      business_name: "Acme",
      business_description: "We sell widgets online.",
      target_queries: existing,
    });

    const text = (result.content[0] as { text: string }).text;
    for (const q of existing) {
      expect(text).toContain(q);
    }
  });
});
