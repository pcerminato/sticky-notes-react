import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    // 2. Keep default exclusions (like node_modules) and explicitly add 'e2e'
    exclude: [...configDefaults.exclude, "e2e/**/*"],
  },
});
