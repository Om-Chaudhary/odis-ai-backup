import { withNx } from "@nx/next/plugins/with-nx.js";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Redirects for renamed routes (cases -> discharges)
  async redirects() {
    return [
      {
        source: "/dashboard/cases",
        destination: "/dashboard/discharges",
        permanent: true,
      },
      {
        source: "/dashboard/cases/batch-discharge",
        destination: "/dashboard/discharges/batch",
        permanent: true,
      },
      {
        source: "/dashboard/cases/:id",
        destination: "/dashboard/discharges/:id",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // SEO and Performance Optimizations
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Headers for SEO and Security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
    ];
  },

  // Compression
  compress: true,

  // Disable ESLint during production build
  // VAPI migration has some type safety improvements pending
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Transpile internal packages to ensure proper handling
  transpilePackages: ["@odis/email", "@odis/services", "@odis/resend"],

  // Exclude react-email packages from server bundle during SSG
  // This prevents the Html context error during static page generation
  serverExternalPackages: [
    "@react-email/body",
    "@react-email/column",
    "@react-email/container",
    "@react-email/head",
    "@react-email/heading",
    "@react-email/hr",
    "@react-email/html",
    "@react-email/img",
    "@react-email/link",
    "@react-email/preview",
    "@react-email/render",
    "@react-email/row",
    "@react-email/section",
    "@react-email/text",
  ],

  // Webpack configuration to handle react-email packages
  webpack: (config, { isServer }) => {
    if (isServer) {
      const reactEmailPackages = [
        "@react-email/body",
        "@react-email/column",
        "@react-email/container",
        "@react-email/head",
        "@react-email/heading",
        "@react-email/hr",
        "@react-email/html",
        "@react-email/img",
        "@react-email/link",
        "@react-email/preview",
        "@react-email/render",
        "@react-email/row",
        "@react-email/section",
        "@react-email/text",
      ];

      // More aggressive externalization using function-based approach
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        (
          /** @type {{ request?: string }} */ { request },
          /** @type {(err: null, result?: string) => void} */ callback,
        ) => {
          if (reactEmailPackages.some((pkg) => request?.startsWith(pkg))) {
            return callback(null, `commonjs ${request}`);
          }
          callback(null);
        },
      ];
    }
    return config;
  },

  // Nx configuration
  nx: {
    svgr: false,
  },
};

export default withNx(config);
