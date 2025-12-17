import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PluginOption } from 'vite';

const manifestFile = resolve(import.meta.dirname, '..', 'manifest.ts');
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_FIREFOX = process.env.FIREFOX === 'true';

// Read version from root package.json
const packageJsonPath = resolve(import.meta.dirname, '../../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

/**
 * Generate manifest object
 */
function getManifest(): chrome.runtime.ManifestV3 {
  return {
    manifest_version: 3,
    default_locale: 'en',
    name: '__MSG_extensionName__',
    browser_specific_settings: {
      gecko: {
        id: 'extension@odisai.net',
        strict_min_version: '109.0',
      },
    },
    version: packageJson.version,
    description: '__MSG_extensionDescription__',
    host_permissions: ['<all_urls>', 'https://*.supabase.co/*', 'https://odisai.net/*'],
    permissions: ['storage', 'scripting', 'tabs', 'notifications', 'sidePanel'],
    options_page: 'options/index.html',
    background: {
      service_worker: 'background.js',
      type: 'module' as const,
    },
    action: {
      default_popup: 'popup/index.html',
      default_icon: 'icon-34.png',
    },
    icons: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
    content_scripts: [
      {
        matches: ['http://*/*', 'https://*/*', '<all_urls>'],
        js: ['content/index.js'],
      },
      {
        matches: ['http://*/*', 'https://*/*', '<all_urls>'],
        js: ['content-ui/all.iife.js'],
      },
      {
        matches: [
          'https://*.idexxneo.com/*',
          'https://*.idexxneocloud.com/*',
          'https://neo.vet/*',
          'https://*.neosuite.com/*',
        ],
        js: ['content-ui/idexx.iife.js'],
        css: ['content-ui/idexx.css'],
      },
      {
        matches: ['http://*/*', 'https://*/*', '<all_urls>'],
        css: ['content.css'],
      },
    ],
    devtools_page: 'devtools/index.html',
    web_accessible_resources: [
      {
        resources: ['*.js', '*.css', '*.svg', 'icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png', 'icon-34.png'],
        matches: ['*://*/*'],
      },
    ],
    side_panel: {
      default_path: 'side-panel/index.html',
    },
  } as chrome.runtime.ManifestV3;
}

/**
 * Simplified manifest parser for Chrome/Firefox compatibility
 */
function convertManifestToString(manifest: chrome.runtime.ManifestV3, isFirefox: boolean): string {
  const manifestCopy = JSON.parse(JSON.stringify(manifest));

  if (isFirefox) {
    // Remove Chrome-only features for Firefox
    delete manifestCopy.side_panel;

    // Firefox uses different permissions format
    if (manifestCopy.permissions?.includes('sidePanel')) {
      manifestCopy.permissions = manifestCopy.permissions.filter(
        (p: string) => p !== 'sidePanel'
      );
    }
  } else {
    // Remove Firefox-specific settings for Chrome
    delete manifestCopy.browser_specific_settings;
  }

  return JSON.stringify(manifestCopy, null, 2);
}

export default (config: { outDir: string }): PluginOption => {
  const makeManifest = (manifest: chrome.runtime.ManifestV3, to: string) => {
    if (!existsSync(to)) {
      mkdirSync(to, { recursive: true });
    }

    const manifestPath = resolve(to, 'manifest.json');
    writeFileSync(manifestPath, convertManifestToString(manifest, IS_FIREFOX));

    console.log(`[make-manifest] Manifest file created: ${manifestPath}`);
  };

  return {
    name: 'make-manifest',
    buildStart() {
      this.addWatchFile(manifestFile);
    },
    writeBundle() {
      const outDir = config.outDir;
      const manifest = getManifest();
      makeManifest(manifest, outDir);
    },
  };
};
