import { existsSync, readFileSync, statSync } from "node:fs";

const requiredFiles = [
  "README.md", "AGENTS.md", "CONTRIBUTING.md", ".editorconfig", ".gitattributes",
  ".github/PULL_REQUEST_TEMPLATE.md", ".github/workflows/ci.yml",
  "docs/development/foundation-plan.md", "docs/development/workflow.md", "docs/development/validation-policy.md",
  "docs/data/data-sources.md", "data/README.md", ".githooks/pre-commit", ".githooks/pre-push",
  "scripts/quality/commands.json",
];
const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) throw new Error(`Missing required foundation files:\n${missing.join("\n")}`);

const commands = JSON.parse(readFileSync("scripts/quality/commands.json", "utf8"));
for (const phase of ["preCommit", "prePush"]) {
  if (!commands[phase] || typeof commands[phase] !== "object") throw new Error(`commands.json is missing ${phase}.`);
}
for (const hook of [".githooks/pre-commit", ".githooks/pre-push"]) {
  if (statSync(hook).size === 0) throw new Error(`${hook} must not be empty.`);
}
console.log("Repository foundation validation passed.");
