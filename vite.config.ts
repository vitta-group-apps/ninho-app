import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Framer Motion é pesado; silencia o aviso acima de 500 kB
    chunkSizeWarningLimit: 1000,
  },
});
