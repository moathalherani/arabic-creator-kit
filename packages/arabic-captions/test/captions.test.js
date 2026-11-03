import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseTimestamp,
  formatTimestamp,
  parseSubtitles,
  toSrt,
  toVtt,
  toLatinDigits,
  fixBidi,
  removeFillers,
  pickKeyword,
  keywordCaptions,
  hexToAssColor,
  toAss,
} from "../src/index.js";

const SRT = "\uFEFF1\r\n00:00:00,000 --> 00:00:03,000\r\nيعني جرّبت هالشي ٣٠ يوم\r\n\r\n2\r\n00:00:03,000 --> 00:00:06,500\r\nوالنتيجة <i>صدمتني</i> بصراحة\r\n";
const VTT = "WEBVTT\n\nNOTE made by hand\n\n00:01.000 --> 00:02.500 align:start\nI tried the BYD Seal\n\n00:02.500 --> 00:04.000\nfor 30 days\n";

test("timestamps", () => {
  assert.equal(parseTimestamp("00:01:02,500"), 62500);
  assert.equal(parseTimestamp("01:02.5"), 62500);
  assert.equal(parseTimestamp("1:00:00.004"), 3600004);
  assert.throws(() => parseTimestamp("nope"));
  assert.equal(formatTimestamp(3723004), "01:02:03,004");
  assert.equal(formatTimestamp(62500, "."), "00:01:02.500");
});

test("parses SRT with BOM, CRLF and tags", () => {
  const cues = parseSubtitles(SRT);
  assert.equal(cues.length, 2);
  assert.deepEqual(cues[1], { start: 3000, end: 6500, text: "والنتيجة صدمتني بصراحة" });
});

test("parses VTT with header, notes and settings", () => {
  const cues = parseSubtitles(VTT);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 1000);
  assert.equal(cues[0].end, 2500);
});

test("round trips SRT and VTT", () => {
  const cues = parseSubtitles(SRT);
  assert.deepEqual(parseSubtitles(toSrt(cues)), cues);
  assert.deepEqual(parseSubtitles(toVtt(cues)), cues);
  assert.ok(toVtt(cues).startsWith("WEBVTT\n\n00:00:00.000"));
});

test("digits, fillers, bidi", () => {
  assert.equal(toLatinDigits("٣٠ يوم و۵"), "30 يوم و5");
  assert.equal(removeFillers("يعني جرّبت، يعني، هالشي um 30 يوم"), "جرّبت، هالشي 30 يوم");
  assert.equal(removeFillers("المعنى واضح"), "المعنى واضح", "does not cut inside words");
  const fixed = fixBidi("جرّبت iPhone 17 لمدة 30 يوم");
  assert.equal(fixed, "جرّبت \u2066iPhone 17\u2069 لمدة \u206630\u2069 يوم");
  assert.equal(fixBidi("English only 30"), "English only 30");
  assert.equal(fixBidi(fixed), fixed, "idempotent");
});

test("keyword picking prefers numbers, then English, then long words", () => {
  assert.equal(pickKeyword(["جرّبت", "هالشي", "30", "يوم"]), 2);
  assert.equal(pickKeyword(["سيارة", "BYD", "الجديدة"]), 1);
  assert.equal(pickKeyword(["في", "الاستراتيجية", "هاي"]), 1);
  assert.equal(pickKeyword(["في", "من"]), -1);
});

test("keyword captions split and time correctly", () => {
  const caps = keywordCaptions(parseSubtitles(SRT), { maxWords: 2 });
  assert.equal(caps[0].text, "جرّبت هالشي");
  assert.equal(caps[1].text, "30 يوم");
  assert.equal(caps[1].keyword, 0);
  assert.equal(caps[0].start, 0);
  assert.equal(caps[1].end, 3000);
  for (let i = 1; i < caps.length; i++) assert.ok(caps[i].start >= caps[i - 1].start);
  for (const c of caps) assert.ok(c.end > c.start, JSON.stringify(c));
  // no lonely last word: 3 words with maxWords 2 → one chunk of 3
  const merged = keywordCaptions([{ start: 0, end: 1000, text: "واحد اثنين ثلاثة" }], { maxWords: 2 });
  assert.equal(merged.length, 1);
  assert.throws(() => keywordCaptions([], { maxWords: 0 }), RangeError);
});

test("ASS output colors the keyword and keeps tags intact", () => {
  assert.equal(hexToAssColor("#7FB069"), "&H0069B07F&");
  assert.throws(() => hexToAssColor("green"));
  const ass = toAss(keywordCaptions(parseSubtitles("1\n00:00:00,000 --> 00:00:02,000\nجرّبت BYD Seal 30 يوم\n")));
  assert.match(ass, /PlayResX: 1080/);
  assert.match(ass, /^Style: Default,.*,-1$/m, "encoding -1 so Arabic lines keep right-to-left order");
  assert.match(ass, /Dialogue: 0,0:00:00\.00,/);
  assert.match(ass, /\{\\c&H0069B07F&\}\u206630\u2069\{\\c&H00FFFFFF&\}/);
  assert.ok(!/\u2066[^\u2069]*\{/.test(ass), "isolates never wrap override tags");
});

test("CLI converts a file", () => {
  const dir = mkdtempSync(join(tmpdir(), "ac-"));
  const file = join(dir, "in.srt");
  writeFileSync(file, SRT);
  const cli = join(dirname(fileURLToPath(import.meta.url)), "../src/cli.js");
  const out = execFileSync(process.execPath, [cli, file, "-w", "2", "--no-bidi"], { encoding: "utf8" });
  assert.match(out, /^1\n00:00:00,000 --> /);
  assert.match(out, /30 يوم/);
  const vtt = execFileSync(process.execPath, [cli, file, "-f", "vtt"], { encoding: "utf8" });
  assert.ok(vtt.startsWith("WEBVTT"));
});
