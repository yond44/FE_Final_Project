import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // Guard against a duplicated React copy in dev, which surfaces as the
  // "Uncaught TypeError: destroy is not a function" crash.
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: { include: ["react", "react-dom"] },
});
