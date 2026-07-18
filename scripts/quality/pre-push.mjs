import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const commands = JSON.parse(readFileSync(new URL("./commands.json", import.meta.url), "utf8"));
for (const [name, entries] of Object.entries(commands.prePush)) {
  if (!Array.isArray(entries) || entries.length === 0) {
    console.log(`${name}: not configured yet (stack decision pending).`);
    continue;
  }
  for (const entry of entries) run(entry.command, entry.args);
}
console.log("Pre-push configured checks completed.");

function run(command, args) {
  const executable = process.platform === "win32" && ["npm", "npx"].includes(command) ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { stdio: "inherit", env: { ...process.env, CI: process.env.CI ?? "true" } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
