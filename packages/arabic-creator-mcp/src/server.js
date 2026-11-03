#!/usr/bin/env node
// Arabic Creator Kit as an MCP server over stdio (newline-delimited JSON-RPC 2.0).
// Add it to Claude Desktop, Claude Code or any MCP client: npx -y arabic-creator-mcp
// Only protocol messages go to stdout.
import { createInterface } from "node:readline";
import { reply } from "./protocol.js";

createInterface({ input: process.stdin }).on("line", (line) => {
  for (const msg of reply(line)) process.stdout.write(`${JSON.stringify(msg)}\n`);
});
