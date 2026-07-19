import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const e2eEnvironmentPrefix =
  process.platform === "win32"
    ? "set VITE_ENABLE_E2E_MODE=true&& "
    : "VITE_ENABLE_E2E_MODE=true ";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: {
    baseURL,
    colorScheme: "light",
    deviceScaleFactor: 1,
    locale: "ja-JP",
    trace: "on-first-retry",
    timezoneId: "Asia/Tokyo",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `${e2eEnvironmentPrefix}${npmCommand} run dev -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
