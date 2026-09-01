import { createServer as createHttpServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  operatorSnapshotSchema,
  renderInputSchema,
  snapshotOutputSchema,
  type OperatorView,
} from "./contracts.js";
import { demoProvider } from "./provider.js";

const SERVER_NAME = "never86-operator-os";
const SERVER_VERSION = "0.1.0";
const MCP_PATH = "/mcp";
const TEMPLATE_URI = "ui://never86/operator-console-v1.html";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const widgetHtml = readFileSync(
  path.resolve(__dirname, "../public/operator-console.html"),
  "utf8"
);

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;

const logicByDomain = {
  action_shift: {
    promise: "Yesterday -> one action -> night proof.",
    rules: [
      "Rank controllable leaks by confidence, impact and operator effort.",
      "Assign no more than three actions; default to the single best action.",
      "Require proof that closes the loop before the learning is trusted.",
    ],
  },
  labor: {
    promise: "Match labor shape to the sales curve, not just a daily percentage.",
    rules: [
      "Inspect labor by time window before changing schedules.",
      "Prefer a precise cut or shift move over broad understaffing.",
      "Verify the next comparable shift before promoting a rule to a playbook.",
    ],
  },
  voids: {
    promise: "Find unusual behavior, then require the receipt trail.",
    rules: [
      "Separate operational exceptions from repeat patterns.",
      "Use employee, time, reason and post-payment context together.",
      "Escalate evidence, not accusations.",
    ],
  },
  invoices: {
    promise: "Make every invoice line usable for cost and variance decisions.",
    rules: [
      "Normalize vendor, SKU, pack, unit and extended cost before comparison.",
      "Do not compare price drift across unmatched pack sizes or units.",
      "Keep the original invoice as evidence and the normalized line as fact.",
    ],
  },
  vendors: {
    promise: "Catch price creep before the next order compounds it.",
    rules: [
      "Compare against the last clean baseline for the same SKU and pack.",
      "Rank drift by both percentage change and expected dollar exposure.",
      "Attach the vendor response or corrected price as proof of resolution.",
    ],
  },
  inventory: {
    promise: "Prevent the 86 without buying blind.",
    rules: [
      "Use physical count, par, recent usage and next delivery timing together.",
      "When a count is stale, verify before creating spend.",
      "Convert repeat 86 events into par or process changes only after evidence.",
    ],
  },
} as const;

type LogicDomain = keyof typeof logicByDomain;

async function snapshotResult(view: OperatorView, message: string) {
  const snapshot = await demoProvider.getSnapshot(view);
  return {
    structuredContent: { snapshot },
    content: [{ type: "text" as const, text: message }],
  };
}

function createNever86Server(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Never86 is a restaurant operator OS: Find the leak. Assign the fix. Keep the receipt. Use preview tools only for synthetic demo data. For an operator card, call the most relevant get_*_preview tool first, then pass its snapshot unchanged to render_operator_console. Private tenant data and any write action require server-side authentication and authorization and are intentionally not implemented in this public preview.",
    }
  );

  server.registerTool(
    "get_operator_system",
    {
      title: "Get Never86 operator system",
      description:
        "Use this when the user asks what Never86 does, how the operator loop works, or which operating surfaces it covers.",
      inputSchema: {},
      outputSchema: {
        promise: z.string(),
        loop: z.array(z.string()),
        surfaces: z.array(z.string()),
        safetyBoundary: z.string(),
      },
      annotations,
    },
    async () => ({
      structuredContent: {
        promise: "Find the leak. Assign the fix. Keep the receipt.",
        loop: [
          "capture",
          "parse",
          "truth-gate",
          "normalize",
          "decide",
          "assign",
          "human approve",
          "prove",
          "learn",
          "repeat",
        ],
        surfaces: [
          "Z/POS",
          "voids",
          "labor",
          "tips",
          "invoices",
          "vendors",
          "beverage",
          "catering",
          "third-party delivery",
          "shift execution",
        ],
        safetyBoundary:
          "Public preview returns synthetic data only. Private restaurant data and writes require authenticated tenant authorization.",
      },
      content: [
        {
          type: "text" as const,
          text: "Never86 turns restaurant evidence into a prioritized operator action and closes the loop with proof.",
        },
      ],
    })
  );

  server.registerTool(
    "get_operator_logic",
    {
      title: "Get Never86 operator logic",
      description:
        "Use this when the user wants the public decision logic for action shift, labor, voids, invoices, vendors, or inventory.",
      inputSchema: {
        domain: z
          .enum(["action_shift", "labor", "voids", "invoices", "vendors", "inventory"])
          .describe("Operator logic domain to inspect"),
      },
      outputSchema: {
        domain: z.string(),
        promise: z.string(),
        rules: z.array(z.string()),
      },
      annotations,
    },
    async ({ domain }) => {
      const logic = logicByDomain[domain as LogicDomain];
      return {
        structuredContent: { domain, ...logic },
        content: [
          {
            type: "text" as const,
            text: `${domain} logic: ${logic.promise}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_action_shift_preview",
    {
      title: "Get Action Shift preview",
      description:
        "Use this when the user wants a synthetic preview of Never86 choosing the single best operator action from a shift.",
      inputSchema: {},
      outputSchema: snapshotOutputSchema,
      annotations,
    },
    async () => snapshotResult("action_shift", "Prepared a synthetic Action Shift preview."),
  );

  server.registerTool(
    "get_vendor_drift_preview",
    {
      title: "Get vendor drift preview",
      description:
        "Use this when the user wants a synthetic preview of vendor price drift, baseline comparison, and supporting invoice evidence.",
      inputSchema: {},
      outputSchema: snapshotOutputSchema,
      annotations,
    },
    async () => snapshotResult("vendor_drift", "Prepared a synthetic vendor drift preview."),
  );

  server.registerTool(
    "get_item_trace_preview",
    {
      title: "Get item trace preview",
      description:
        "Use this when the user wants a synthetic trace from POS item through recipe, ingredient, inventory SKU, vendor SKU, and invoice cost.",
      inputSchema: {},
      outputSchema: snapshotOutputSchema,
      annotations,
    },
    async () => snapshotResult("item_trace", "Prepared a synthetic item trace preview."),
  );

  server.registerTool(
    "get_inventory_risk_preview",
    {
      title: "Get inventory risk preview",
      description:
        "Use this when the user wants a synthetic preview of 86 risk using par, count, usage, and delivery timing.",
      inputSchema: {},
      outputSchema: snapshotOutputSchema,
      annotations,
    },
    async () => snapshotResult("inventory_risk", "Prepared a synthetic inventory risk preview."),
  );

  registerAppTool(
    server,
    "render_operator_console",
    {
      title: "Render Never86 operator console",
      description:
        "Render the Never86 inline operator card. First call the relevant get_*_preview tool, then pass its structuredContent.snapshot to this tool unchanged.",
      inputSchema: renderInputSchema,
      outputSchema: snapshotOutputSchema,
      annotations,
      _meta: {
        ui: { resourceUri: TEMPLATE_URI },
        "openai/toolInvocation/invoking": "Building the operator card...",
        "openai/toolInvocation/invoked": "Operator card ready.",
      },
    },
    async ({ snapshot }) => {
      const validated = operatorSnapshotSchema.parse(snapshot);
      return {
        structuredContent: { snapshot: validated },
        content: [
          {
            type: "text" as const,
            text: `${validated.title} The inline card is a synthetic preview and does not expose private restaurant data.`,
          },
        ],
      };
    }
  );

  registerAppResource(
    server,
    "Never86 Operator Console",
    TEMPLATE_URI,
    {},
    async () => ({
      contents: [
        {
          uri: TEMPLATE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
          },
        },
      ],
    })
  );

  return server;
}

const port = Number(process.env.PORT ?? 8787);

const httpServer = createHttpServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        ok: true,
        service: SERVER_NAME,
        version: SERVER_VERSION,
        dataMode: "synthetic-preview-only",
      })
    );
    return;
  }

  const mcpMethods = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && mcpMethods.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createNever86Server();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Never86 MCP error:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(`Never86 MCP listening on http://localhost:${port}${MCP_PATH}`);
});
