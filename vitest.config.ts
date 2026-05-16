import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://backend:5050",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://backend:5050",
        ws: true,
        changeOrigin: true,
      },
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,

    exclude: [
      "node_modules",
      "dist",
      "e2e/**",
      "playwright.config.ts",
    ],

    coverage: {
  provider: "v8",
  reporter: ["text", "html"],

  include: [
    "src/api/client.tsx",
    "src/components/WeatherWidget.tsx",
    "src/components/NavBtn.tsx",
  ],

  exclude: [
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "e2e/**",
    "**/*.module.css",
    "**/*.css",
    "src/main.tsx",
    "src/vite-env.d.ts",
  ],

  thresholds: {
    lines: 70,
    functions: 70,
    statements: 70,
    branches: 60,
  },
},
  },
});