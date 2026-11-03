import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tools, designLink, STUDIO } from "../src/tools.js";
import { reply } from "../src/protocol.js";

const call = (name, args) => tools.find((t) => t.name === name).run(args);
const decode = (url) => JSON.parse(Buffer.from(url.split("#d=")[1], "base64url").toString("utf8"));

test("design_reel makes a studio link the studio can read", () => {
  const { url, used, skipped } = designLink({
    scenes: [
      { template: "hook", text: "3 ثواني بتقرر", keyword: "3" },
      { template: "steps", title: "كيف", steps: ["شيل السلام", "ابدأ برقم"] },
      { template: "nope" },
      { template: "follow" },
    ],
    style: { background: "grid-dark", accent: "#C6F432", evil: "x" },
  });
  assert.ok(url.startsWith(`${STUDIO}#d=`));
  assert.deepEqual(used, ["hook", "steps", "follow"]);
  assert.equal(skipped.length, 1);
  const d = decode(url);
  assert.equal(d.v, 1);
  assert.deepEqual(d.s, { background: "grid-dark", accent: "#C6F432" });
  assert.equal(d.sc[1].p.steps, "شيل السلام\nابدأ برقم");
  assert.throws(() => designLink({ scenes: [{ template: "nope" }] }));
});

test("every template the tool lists has a known field set", () => {
  const desc = tools.find((t) => t.name === "design_reel").description;
  for (const id of ["hook", "chat", "notification", "ranking", "follow"]) assert.match(desc, new RegExp(`- ${id} \\(`));
});

test("the other tools answer", () => {
  assert.match(call("score_hook", { text: "مرحبا يا جماعة" }), /Score: \d+\/100/);
  assert.match(call("find_hooks", { dialect: "jo", limit: 2 }), /^- \[/);
  assert.match(call("amount_in_words", { amount: 1500, currency: "AED" }), /درهم/);
  assert.match(call("check_post", { text: "سلام #ريلز", platform: "instagram" }), /Instagram/i);
  const srt = "1\n00:00:00,000 --> 00:00:02,000\nجربت هالأداة لمدة 30 يوم\n";
  assert.match(call("keyword_captions", { subtitles: srt }), /-->[\s\S]*Keywords/);
  assert.throws(() => call("keyword_captions", { subtitles: "hello" }));
});

test("protocol: initialize, list, call, errors and notifications", () => {
  const [init] = reply(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } }));
  assert.equal(init.result.protocolVersion, "2025-06-18");
  assert.ok(init.result.capabilities.tools);
  assert.deepEqual(reply(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })), []);
  const [list] = reply(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }));
  assert.ok(list.result.tools.length >= 6);
  for (const t of list.result.tools) assert.equal(t.inputSchema.type, "object");
  const [bad] = reply(JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "design_reel", arguments: { scenes: [] } } }));
  assert.equal(bad.result.isError, true);
  const [missing] = reply(JSON.stringify({ jsonrpc: "2.0", id: 4, method: "nope" }));
  assert.equal(missing.error.code, -32601);
  assert.equal(reply("{not json")[0].error.code, -32700);
});

test("server speaks over stdio", async () => {
  const child = spawn(process.execPath, [fileURLToPath(new URL("../src/server.js", import.meta.url))]);
  let buf = "";
  const got = new Promise((resolve) => child.stdout.on("data", (d) => { buf += d; if (buf.split("\n").length > 2) resolve(); }));
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2099-01-01" } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "score_hook", arguments: { text: "ليش 90% من الريلز بتفشل؟" } } })}\n`);
  await got;
  child.kill();
  const [a, b] = buf.trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(a.result.protocolVersion, "2025-11-25");
  assert.match(b.result.content[0].text, /Score/);
});
