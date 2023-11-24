import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import vitesconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), vitesconfigPaths()],
  server: {
    open: true,
    port: 3001,
  },
});
