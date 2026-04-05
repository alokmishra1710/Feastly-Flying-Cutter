import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth":   { target: "http://backend:8000", changeOrigin: true },
      "/food":   { target: "http://backend:8000", changeOrigin: true },
      "/cart":   { target: "http://backend:8000", changeOrigin: true },
      "/orders": { target: "http://backend:8000", changeOrigin: true },
      "/users":  { target: "http://backend:8000", changeOrigin: true },
    },
  },
});
