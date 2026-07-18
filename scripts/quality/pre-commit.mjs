import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const commands = readCommands();
const files = stagedFiles();

if (files.length === 0) {
  console.log("No staged files to check.");
  process.exit(0);
}

run("git", ["diff", "--cached", "--check"]);
secretScan(files);
runConfigured("formatter", commands.preCommit.formatter, { files });
runConfigured("lint", commands.preCommit.lint, { files });
console.log(`Pre-commit checks passed for ${files.length} staged file(s).`);

function stagedFiles() {
  return execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
}

function secretScan(fileNames) {
  const patterns = [
    { name: "private key", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
    { name: "GitHub token", expression: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
    { name: "AWS access key", expression: /AKIA[0-9A-Z]{16}/ },
    { name: "generic secret assignment", expression: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"'\s]{8,}/i },
  ];
  for (const file of fileNames) {
    if (/\.(?:png|jpe?g|gif|webp|woff2?)$/i.test(file)) continue;
    const content = execFileSync("git", ["show", `:${file}`], { encoding: "utf8" });
    for (const pattern of patterns) {
      if (pattern.expression.test(content)) throw new Error(`Possible ${pattern.name} in staged file: ${file}`);
    }
  }
}

function readCommands() {
  return JSON.parse(readFileSync(new URL("./commands.json", import.meta.url), "utf8"));
}

function runConfigured(name, entries, context) {
  if (!Array.isArray(entries) || entries.length === 0) {
    console.log(`${name}: not configured yet (stack decision pending).`);
    return;
  }
  for (const entry of entries) {
    const args = entry.args.map((arg) => (arg === "{files}" ? context.files : arg)).flat();
    run(entry.command, args);
  }
}

function run(command, args) {
  const executable = process.platform === "win32" && ["npm", "npx"].includes(command) ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
