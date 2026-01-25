import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "ODIS AI Docs",
  tagline: "AI Voice Agents for Veterinary Clinics",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://docs.odis.ai",
  baseUrl: "/",

  organizationName: "odis-ai",
  projectName: "docs",

  // We don't want docs links to block builds.
  onBrokenLinks: "ignore",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "ignore",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  stylesheets: [
    {
      href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
      type: "text/css",
    },
  ],

  plugins: ["docusaurus-plugin-sass", "./plugins/tailwind-plugin.js"],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          editUrl:
            "https://github.com/odis-ai/odis-ai-web/tree/main/apps/docs/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.scss",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/og-image.png",
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: "ODIS AI",
      logo: {
        alt: "ODIS AI Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          href: "https://odis.ai",
          label: "Main Site",
          position: "right",
        },
        {
          href: "https://github.com/odis-ai/odis-ai-web",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Product",
          items: [
            { label: "Main Website", href: "https://odis.ai" },
            { label: "Dashboard", href: "https://odis.ai/dashboard" },
          ],
        },
        {
          title: "Connect",
          items: [
            { label: "Twitter", href: "https://twitter.com/odisai" },
            { label: "LinkedIn", href: "https://linkedin.com/company/odis-ai" },
            { label: "GitHub", href: "https://github.com/odis-ai" },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} ODIS AI, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "typescript", "json", "sql"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
