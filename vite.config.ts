/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({ 
      include: ["lib"],
      rollupTypes: true,
      tsconfigPath: './tsconfig.lib.json',
    })
  ],
  build: {
    lib: {
      entry: 'lib/main.ts',
      formats: ["es"],
      fileName: 'main',
    },
  },
  test: {
    environment: 'node',
  }
});
