import { withNx } from "@nx/next/plugins/with-nx.js";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const config = {
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
    minimumCacheTTL: 31536000, // 1 year for immutable assets
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
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
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Compression
  compress: true,

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    cacheComponents: true, // Partial Prerendering (renamed from ppr in Next.js 16)
  },

  // Transpile internal packages to ensure proper handling
  // Note: Explicitly exclude @odis-ai/email, @odis-ai/services-*, and @odis-ai/resend
  // because they use @react-email packages that conflict with static page generation.
  // These services are only used via dynamic imports in API routes and marked as
  // serverExternalPackages below.
  // Even though empty, we need this to prevent Nx from auto-adding internal packages.
  transpilePackages: [],

  // Server-side packages that should not be bundled
  serverExternalPackages: [
    "resend",
    "import-in-the-middle",
    "require-in-the-middle",
  ],

  // Webpack/Turbopack config to prevent watching .git directory
  webpack: (config, { isServer }) => {
    // Configure watchOptions for both webpack and Turbopack
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.gitbutler/**",
        "**/.nx/**",
        "**/.turbo/**",
        "**/dist/**",
        "**/.next/**",
        "**/.cache/**",
        "**/coverage/**",
      ],
      poll: undefined, // Don't poll files
      aggregateTimeout: 300,
    };

    // Also configure for the snapshot system
    if (config.snapshot) {
      config.snapshot.managedPaths = [
        ...(config.snapshot.managedPaths || []),
      ];
      config.snapshot.immutablePaths = [
        ...(config.snapshot.immutablePaths || []),
      ];
    }

    return config;
  },
};

const sentryOptions = {
  silent: true,
  hideSourceMaps: true,
};

export default withSentryConfig(withNx(config), sentryOptions);
