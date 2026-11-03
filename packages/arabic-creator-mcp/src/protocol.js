// MCP request handling, separate from stdio so it can be tested.
import { createRequire } from "node:module";
import { tools } from "./tools.js";

const { version } = createRequire(import.meta.url)("../package.json");
const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const listed = tools.map(({ name, title, description, inputSchema }) => ({ name, title, description, inputSchema }));

/** Handles one request; returns the result (or throws {code, message}). Exported for tests. */
export function handle(method, params = {}) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "arabic-creator-kit", title: "Arabic Creator Kit", version },
        instructions: "Tools for Arabic content creators. To make a reel, call design_reel and give the person the link it returns. Reply in the person's language and dialect.",
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools: listed };
    case "tools/call": {
      const tool = tools.find((t) => t.name === params.name);
      if (!tool) throw { code: -32602, message: `Unknown tool: ${params.name}` };
      try {
        return { content: [{ type: "text", text: String(tool.run(params.arguments ?? {})) }], isError: false };
      } catch (e) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
      }
    }
    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}


/** One line from the client → the reply lines to send (none for notifications). */
export function reply(line) {
  const out = [];
  if (!line.trim()) return out;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    out.push({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return out;
  }
  for (const m of Array.isArray(msg) ? msg : [msg]) {
    if (m.id === undefined || m.id === null) continue; // notifications (initialized, cancelled…) need no reply
    try {
      out.push({ jsonrpc: "2.0", id: m.id, result: handle(m.method, m.params) });
    } catch (e) {
      out.push({ jsonrpc: "2.0", id: m.id, error: { code: e.code ?? -32603, message: e.message ?? "Internal error" } });
    }
  }
  return out;
}
