import { resolve, dirname } from 'node:path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const workspaceRoot = resolve(rootDir, '..', '..');
const srcDir = resolve(rootDir, 'src');
const matchesDir = resolve(srcDir, 'content-ui', 'matches');
const outDir = resolve(workspaceRoot, 'dist', 'apps', 'chrome-extension', 'content-ui');

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Discover content script entry points in the matches directory
 */
function getContentScriptEntries(dir: string): Record<string, string> {
  const entries: Record<string, string> = {};

  if (!existsSync(dir)) {
    console.log(`Matches directory not found: ${dir}`);
    return entries;
  }

  const folders = readdirSync(dir);

  for (const folder of folders) {
    const folderPath = resolve(dir, folder);
    if (!statSync(folderPath).isDirectory()) continue;

    const files = readdirSync(folderPath);
    const entry = files.includes('index.tsx')
      ? resolve(folderPath, 'index.tsx')
      : files.includes('index.ts')
        ? resolve(folderPath, 'index.ts')
        : null;

    if (entry) {
      entries[folder] = entry;
    }
  }

  return entries;
}

/**
 * Build a single content script entry point
 */
async function buildContentScript(name: string, entry: string) {
  const folder = resolve(matchesDir, name);
  const localDistDir = resolve(rootDir, 'dist', 'content-ui', name);

  mkdirSync(localDistDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  // Build CSS using Tailwind v4 CLI
  const cssInputPath = resolve(folder, 'index.css');
  const localCssPath = resolve(localDistDir, 'index.css');

  if (existsSync(cssInputPath)) {
    const { execSync } = await import('node:child_process');
    try {
      // Tailwind v4 uses @tailwindcss/cli
      execSync(
        `pnpm dlx @tailwindcss/cli -i "${cssInputPath}" -o "${localCssPath}"`,
        { stdio: 'inherit', cwd: workspaceRoot }
      );

      // Copy CSS to output directory
      const finalCssPath = resolve(outDir, `${name}.css`);
      copyFileSync(localCssPath, finalCssPath);
      console.log(`[${name}] CSS built: ${finalCssPath}`);
    } catch (error) {
      console.warn(`[${name}] CSS build skipped (Tailwind v4 may need config updates):`, error);
      // Create empty CSS file as fallback
      const { writeFileSync } = await import('node:fs');
      writeFileSync(resolve(outDir, `${name}.css`), '/* CSS placeholder */\n');
    }
  } else {
    // Create empty CSS file if no input exists
    const { writeFileSync } = await import('node:fs');
    writeFileSync(resolve(outDir, `${name}.css`), '/* No CSS input found */\n');
  }

  // Build JavaScript as IIFE
  await build({
    configFile: false,
    root: workspaceRoot,
    base: '',
    define: {
      'process.env.CEB_SUPABASE_URL': JSON.stringify(process.env.CEB_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''),
      'process.env.CEB_SUPABASE_ANON_KEY': JSON.stringify(process.env.CEB_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''),
      'process.env.CEB_API_URL': JSON.stringify(process.env.CEB_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''),
      'process.env.CEB_DEV': JSON.stringify(IS_DEV ? 'true' : 'false'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    resolve: {
      alias: {
        '@src': resolve(srcDir, 'content-ui'),
        // Explicit aliases for extension-specific paths (nxViteTsPaths may not resolve subpaths correctly)
        '@odis-ai/shared/ui/extension': resolve(workspaceRoot, 'libs/shared/ui/src/extension/index.ts'),
        '@odis-ai/db/browser': resolve(workspaceRoot, 'libs/db/src/browser.ts'),
        '@odis-ai/env/browser': resolve(workspaceRoot, 'libs/env/src/browser.ts'),
        '@odis-ai/logger/browser': resolve(workspaceRoot, 'libs/logger/src/browser.ts'),
        '@odis-ai/vapi/browser': resolve(workspaceRoot, 'libs/vapi/src/browser.ts'),
      },
    },
    plugins: [
      react(),
      nxViteTsPaths(),
      nodePolyfills(),
    ],
    build: {
      lib: {
        name,
        formats: ['iife'],
        entry,
        fileName: name,
      },
      outDir,
      emptyOutDir: false,
      sourcemap: IS_DEV,
      minify: !IS_DEV,
      rollupOptions: {
        external: ['chrome'],
        output: {
          entryFileNames: `${name}.iife.js`,
        },
      },
    },
    logLevel: 'info',
  });

  console.log(`[${name}] JS built: ${resolve(outDir, `${name}.iife.js`)}`);
}

// Main execution
async function main() {
  const entries = getContentScriptEntries(matchesDir);
  console.log('Building content scripts:', Object.keys(entries));

  if (Object.keys(entries).length === 0) {
    console.log('No content script entries found.');
    return;
  }

  // Build all content scripts sequentially to avoid race conditions
  for (const [name, entry] of Object.entries(entries)) {
    await buildContentScript(name, entry);
  }

  console.log('Content-UI build complete!');
}

main().catch((error) => {
  console.error('Content-UI build failed:', error);
  process.exit(1);
});
