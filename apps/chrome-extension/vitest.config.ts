import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'node:path';

export default defineConfig({
  root: __dirname,
  plugins: [react(), nxViteTsPaths()],
  resolve: {
    alias: {
      '@src': resolve(__dirname, './src'),
      '@root': resolve(__dirname),
    },
  },
  test: {
    name: 'chrome-extension',
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/chrome-extension',
      provider: 'v8',
    },
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
  },
});
