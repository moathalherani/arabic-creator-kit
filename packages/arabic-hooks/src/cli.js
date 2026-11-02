#!/usr/bin/env node
import { CATEGORIES, getHooks, randomHook, scoreHook } from "./index.js";

const HELP = `arabic-hooks: Arabic + English video hooks

Usage:
  npx arabic-hooks                     random hook
  npx arabic-hooks random [category]   random hook from a category
  npx arabic-hooks list [category]     list hooks
  npx arabic-hooks score "<your hook>" score your own opening line
  npx arabic-hooks --en ...            show English instead of Arabic

Categories: ${CATEGORIES.join(", ")}`;

const args = process.argv.slice(2);
const en = args.includes("--en");
const rest = args.filter((a) => a !== "--en");
const [cmd = "random", arg] = rest;
const pick = (h) => (en ? h.en || h.ar : h.ar);

try {
  if (cmd === "-h" || cmd === "--help" || cmd === "help") {
    console.log(HELP);
  } else if (cmd === "random") {
    const h = randomHook({ category: arg });
    console.log(h ? pick(h) : "No hooks found.");
  } else if (cmd === "list") {
    for (const h of getHooks({ category: arg })) console.log(`${h.id}\t${pick(h)}`);
  } else if (cmd === "score") {
    const text = rest.slice(1).join(" ");
    if (!text) throw new Error('Pass the hook text, e.g. arabic-hooks score "جرّبت هالشي 30 يوم"');
    const r = scoreHook(text);
    console.log(`Score: ${r.score}/100 (${r.words} words)`);
    for (const t of r.tips) console.log(`- ${en ? t.en : t.ar}`);
  } else if (CATEGORIES.includes(cmd)) {
    console.log(pick(randomHook({ category: cmd })));
  } else {
    console.log(HELP);
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
