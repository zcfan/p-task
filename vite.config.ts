/// <reference types="vitest" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ include: ["lib"] })],
  build: {
    lib: {
      entry: 'lib/main.ts',
      formats: ["es"],
      fileName: 'main',
    },
  },
});
