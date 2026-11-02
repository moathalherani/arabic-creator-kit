#!/usr/bin/env node
import { amountToWords, toWords, CURRENCIES } from "./index.js";

const HELP = `arabic-tafqeet: numbers and amounts in Arabic words (تفقيط)

Usage:
  npx arabic-tafqeet 1500                  → ألف وخمسمائة درهم
  npx arabic-tafqeet 25.50 --currency SAR  → خمسة وعشرون ريالًا وخمسون هللة
  npx arabic-tafqeet 1500 --only           → فقط ألف وخمسمائة درهم لا غير
  npx arabic-tafqeet 21 --plain --f        → إحدى وعشرون
Options: --currency <code> (${Object.keys(CURRENCIES).join(", ")}), --only, --plain, --f, --modern (مئة)`;

const args = process.argv.slice(2);
const value = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--currency");
if (!value || args.includes("--help") || args.includes("-h")) {
  console.log(HELP);
  process.exit(value ? 0 : 1);
}
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
try {
  const hundred = args.includes("--modern") ? "مئة" : "مائة";
  const out = args.includes("--plain")
    ? toWords(value.replace(/,/g, ""), { gender: args.includes("--f") ? "f" : "m", hundred })
    : amountToWords(value, { currency: get("--currency") ?? "AED", only: args.includes("--only"), hundred });
  console.log(out);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
