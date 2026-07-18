import { execFileSync } from "node:child_process";

execFileSync("git", ["config", "--local", "core.hooksPath", ".githooks"], {
  stdio: "inherit",
});
console.log("Configured Git hooks path to .githooks.");
