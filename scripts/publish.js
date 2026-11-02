// Stages every workspace package whose current version is not on npm yet, with
// `npm stage publish`. A maintainer then approves each staged version with 2FA on
// npmjs.com (Staged Packages) or with `npm stage approve <id>`.
// Run in CI with NODE_AUTH_TOKEN set. Pass --dry-run to only print what would happen.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dry = process.argv.includes("--dry-run");
const root = new URL("../packages/", import.meta.url).pathname;

for (const dir of readdirSync(root)) {
  const pkgDir = join(root, dir);
  const { name, version, private: isPrivate } = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  if (isPrivate) continue;
  let exists = false;
  try {
    execFileSync("npm", ["view", `${name}@${version}`, "version"], { stdio: ["ignore", "pipe", "ignore"] });
    exists = true;
  } catch {
    exists = false;
  }
  if (exists) {
    console.log(`skip ${name}@${version} (already published)`);
    continue;
  }
  console.log(`${dry ? "would stage" : "staging"} ${name}@${version}`);
  if (!dry) {
    execFileSync("npm", ["stage", "publish", "--access", "public", "--provenance"], { cwd: pkgDir, stdio: "inherit" });
  }
}
