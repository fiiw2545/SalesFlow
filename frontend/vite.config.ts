import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  },
});
