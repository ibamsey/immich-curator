import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    /** Playwright specs live under e2e/; Vitest must not load them. */
    exclude: ["**/node_modules/**", "**/e2e/**", "**/dist/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
