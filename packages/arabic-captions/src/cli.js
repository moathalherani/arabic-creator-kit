#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { parseSubtitles, keywordCaptions, toSrt, toVtt, toAss, fixBidi } from "./index.js";

const HELP = `arabic-captions: SRT/VTT → short keyword captions for Reels, TikTok and Shorts

Usage:
  npx arabic-captions <input.srt|.vtt> [options]

Options:
  -w, --words <n>        words per caption (default 3)
  -f, --format <fmt>     srt | vtt | ass (default: srt)
  -o, --out <file>       output file (default: stdout)
      --font <name>      ASS font (default Changa)
      --size <px>        ASS font size (default 84)
      --color <hex>      ASS text color (default #FFFFFF)
      --highlight <hex>  ASS keyword color (default #7FB069)
      --keep-fillers     keep يعني / um / uh
      --arabic-digits    keep Arabic-Indic digits (default converts to 0-9)
      --no-bidi          do not add direction isolates around English words

Burn in:
  npx arabic-captions talk.srt -f ass -o talk.ass
  ffmpeg -i talk.mp4 -vf ass=talk.ass -c:a copy out.mp4`;

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
  console.log(HELP);
  process.exit(argv.length === 0 ? 1 : 0);
}

const opts = { words: 3, format: "srt", out: null, fillers: true, latinDigits: true, bidi: true, style: {} };
let input = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => {
    const v = argv[++i];
    if (v === undefined) throw new Error(`${a} needs a value`);
    return v;
  };
  if (a === "-w" || a === "--words") opts.words = Number(next());
  else if (a === "-f" || a === "--format") opts.format = next().toLowerCase();
  else if (a === "-o" || a === "--out") opts.out = next();
  else if (a === "--font") opts.style.font = next();
  else if (a === "--size") opts.style.fontSize = Number(next());
  else if (a === "--color") opts.style.color = next();
  else if (a === "--highlight") opts.style.highlight = next();
  else if (a === "--keep-fillers") opts.fillers = false;
  else if (a === "--arabic-digits") opts.latinDigits = false;
  else if (a === "--no-bidi") opts.bidi = false;
  else if (a.startsWith("-")) throw new Error(`Unknown option ${a}`);
  else input = a;
}

try {
  if (!input) throw new Error("Pass an input .srt or .vtt file");
  const cues = parseSubtitles(readFileSync(input, "utf8"));
  if (cues.length === 0) throw new Error("No cues found in the input file");
  const caps = keywordCaptions(cues, { maxWords: opts.words, fillers: opts.fillers, latinDigits: opts.latinDigits });
  let result;
  if (opts.format === "ass") result = toAss(caps, { ...opts.style, bidi: opts.bidi });
  else {
    const plain = caps.map((c) => ({ ...c, text: opts.bidi ? fixBidi(c.text) : c.text }));
    if (opts.format === "vtt") result = toVtt(plain);
    else if (opts.format === "srt") result = toSrt(plain);
    else throw new Error(`Unknown format "${opts.format}" (use srt, vtt or ass)`);
  }
  if (opts.out) {
    writeFileSync(opts.out, result);
    console.error(`Wrote ${caps.length} captions to ${opts.out}`);
  } else process.stdout.write(result);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
