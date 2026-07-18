import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        participant: fileURLToPath(new URL("./index.html", import.meta.url)),
        venue: fileURLToPath(new URL("./venue.html", import.meta.url)),
      },
    },
  },
});
