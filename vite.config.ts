import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import vitesconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    open: true,
    port: 3001,
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "auth",
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-router-dom"],
      output: {
        globals: {
          react: "React",
          "react-router-dom": "ReactRouterDOM",
        },
      },
    },
  },
  plugins: [react(), vitesconfigPaths(), dts()],
});
