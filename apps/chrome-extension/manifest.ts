import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Chrome Manifest V3 type definition
type ManifestType = chrome.runtime.ManifestV3;

// Read version from root package.json
const packageJsonPath = resolve(__dirname, "../../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

/**
 * Chrome Extension Manifest V3
 *
 * @prop default_locale - i18n support, references _locales folder
 * @prop permissions - sidePanel not supported on Firefox
 * @prop content_scripts - css: ['content.css'] // public folder
 */
const manifest = {
  manifest_version: 3,
  default_locale: "en",
  name: "__MSG_extensionName__",
  version: packageJson.version,
  description: "__MSG_extensionDescription__",
  host_permissions: [
    "https://*.idexxneo.com/*",
    "https://*.idexxneocloud.com/*",
    "https://neo.vet/*",
    "https://*.neosuite.com/*",
    "https://*.supabase.co/*",
    "https://odisai.net/*",
  ],
  permissions: ["storage", "scripting", "tabs", "sidePanel"],
  options_page: "options/index.html",
  background: {
    service_worker: "background.js",
    type: "module" as const,
  },
  action: {
    default_popup: "popup/index.html",
    default_icon: "icon-34.png",
  },
  icons: {
    "16": "icon-16.png",
    "32": "icon-32.png",
    "48": "icon-48.png",
    "128": "icon-128.png",
  },
  content_scripts: [
    {
      matches: [
        "https://*.idexxneo.com/*",
        "https://*.idexxneocloud.com/*",
        "https://neo.vet/*",
        "https://*.neosuite.com/*",
      ],
      js: ["content-ui/idexx.iife.js"],
      css: ["content-ui/idexx.css"],
    },
  ],
  devtools_page: "devtools/index.html",
  web_accessible_resources: [
    {
      resources: [
        "*.js",
        "*.css",
        "*.svg",
        "icon-16.png",
        "icon-32.png",
        "icon-48.png",
        "icon-128.png",
        "icon-34.png",
      ],
      matches: [
        "https://*.idexxneo.com/*",
        "https://*.idexxneocloud.com/*",
        "https://neo.vet/*",
        "https://*.neosuite.com/*",
      ],
    },
  ],
  side_panel: {
    default_path: "side-panel/index.html",
  },
} satisfies ManifestType;

export default manifest;
