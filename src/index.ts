#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { analyzeToolDef, analyzeHandler } from "./tools/analyze.js";
import { fixToolDef, fixHandler } from "./tools/fix.js";
import { generateToolDef, generateHandler } from "./tools/generate.js";

const server = new Server(
  { name: "geo-optimizer", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [analyzeToolDef, fixToolDef, generateToolDef],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const safeArgs = (args ?? {}) as Record<string, unknown>;

  switch (name) {
    case "analyze_geo_score":
      return analyzeHandler(safeArgs);
    case "get_geo_fixes":
      return fixHandler(safeArgs);
    case "make_site_geo_ready":
      return generateHandler(safeArgs);
    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
