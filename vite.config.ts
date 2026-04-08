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
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: React + Router
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          // Animation
          'vendor-motion':  ['framer-motion'],
          // Charts
          'vendor-charts':  ['recharts'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // State
          'vendor-state':   ['zustand'],
        },
      },
    },
  },
});
