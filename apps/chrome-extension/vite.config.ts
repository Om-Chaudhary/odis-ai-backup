import { resolve } from "node:path";
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import makeManifestPlugin from "./plugins/make-manifest-plugin";

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, "src");
const outDir = resolve(rootDir, "../../dist/apps/chrome-extension");

const IS_DEV = process.env.NODE_ENV === "development";
const IS_PROD = !IS_DEV;

// HTML entry points for popup pages
const htmlEntries = {
  popup: resolve(srcDir, "entries/popup/index.html"),
  options: resolve(srcDir, "entries/options/index.html"),
  dashboard: resolve(srcDir, "entries/dashboard/index.html"),
  "side-panel": resolve(srcDir, "entries/side-panel/index.html"),
  "email-editor": resolve(srcDir, "entries/email-editor/index.html"),
  devtools: resolve(srcDir, "entries/devtools/index.html"),
  "devtools-panel": resolve(srcDir, "entries/devtools-panel/index.html"),
};

export default defineConfig({
  root: srcDir,
  base: "",
  define: {
    "process.env.CEB_SUPABASE_URL": JSON.stringify(
      process.env.CEB_SUPABASE_URL ??
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        "",
    ),
    "process.env.CEB_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.CEB_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        "",
    ),
    "process.env.CEB_API_URL": JSON.stringify(
      process.env.CEB_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "",
    ),
    "process.env.CEB_DEV": JSON.stringify(IS_DEV ? "true" : "false"),
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV ?? "production",
    ),
  },
  resolve: {
    alias: {
      "@src": srcDir,
      "@root": rootDir,
    },
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    nodePolyfills(),
    makeManifestPlugin({ outDir }) as PluginOption,
  ],
  publicDir: resolve(rootDir, "public"),
  build: {
    outDir,
    emptyOutDir: !IS_DEV,
    sourcemap: IS_DEV,
    minify: IS_PROD,
    reportCompressedSize: IS_PROD,
    rollupOptions: {
      input: {
        background: resolve(srcDir, "background/index.ts"),
        content: resolve(srcDir, "content/index.ts"),
        "content-runtime": resolve(srcDir, "content-runtime/index.ts"),
        ...htmlEntries,
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background.js";
          if (chunkInfo.name === "content") return "content/index.js";
          if (chunkInfo.name === "content-runtime")
            return "content-runtime/index.js";
          return "[name]/[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
      external: ["chrome"],
    },
  },
});
