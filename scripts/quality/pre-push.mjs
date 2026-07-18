import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const commands = JSON.parse(readFileSync(new URL("./commands.json", import.meta.url), "utf8"));
for (const [name, entries] of Object.entries(commands.prePush)) {
  if (!Array.isArray(entries) || entries.length === 0) {
    console.log(`[NOT CONFIGURED] ${name}: no command is registered.`);
    continue;
  }
  for (const entry of entries) run(entry.command, entry.args);
}
console.log("[PASS] Pre-push configured checks completed.");

function run(command, args) {
  const isWindowsPackageCommand = process.platform === "win32" && ["npm", "npx"].includes(command);
  const options = { stdio: "inherit", env: { ...process.env, CI: process.env.CI ?? "true" } };
  const result = isWindowsPackageCommand
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", `${command}.cmd`, ...args], options)
    : spawnSync(command, args, options);
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
