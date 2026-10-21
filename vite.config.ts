import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (mode === "production" && env.VITE_MSW === "true") {
    throw new Error("VITE_MSW=true is not allowed in a production environment");
  }

  return {
    server: {
      host: "localhost",
      port: 4321,
      strictPort: true,
      hmr: {
        host: "localhost",
        port: 4321,
        protocol: "ws",
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "strip-msw-from-production",
        apply: "build" as const,
        closeBundle() {
          if (mode !== "production") return;
          const worker = path.resolve(process.cwd(), "dist", "mockServiceWorker.js");
          if (fs.existsSync(worker)) fs.rmSync(worker);
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "query-vendor": ["@tanstack/react-query"],
            "ui-vendor": ["lucide-react", "react-hot-toast"],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      exclude: ["e2e/**", "node_modules/**", "dist/**"],
    },
  };
});
