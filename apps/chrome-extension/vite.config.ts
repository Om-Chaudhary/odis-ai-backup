import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/chrome-extension",

  plugins: [react(), nxViteTsPaths()],

  build: {
    outDir: "../../dist/apps/chrome-extension",
    emptyOutDir: true,
    sourcemap: mode === "development",
    minify: mode === "production",
    rollupOptions: {
      input: {
        background: resolve(import.meta.dirname, "src/background/index.ts"),
        content: resolve(import.meta.dirname, "src/content/index.ts"),
        popup: resolve(import.meta.dirname, "src/popup/index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "content.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },

  // Copy manifest and icons
  publicDir: resolve(import.meta.dirname, "public"),

  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
}));
