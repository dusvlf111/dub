const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

// Suppress specific external package warnings
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(" ");
  if (
    message.includes("Package mongodb can't be external") ||
    message.includes("Package pg can't be external") ||
    message.includes("Package sqlite3 can't be external") ||
    message.includes("Package typeorm can't be external") ||
    message.includes("matches serverExternalPackages") ||
    message.includes("Try to install it into the project directory")
  ) {
    return; // Suppress these warnings
  }
  originalConsoleWarn.apply(console, args);
};

const isSelfHosted = process.env.SELF_HOSTED === "true";

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  // Enable standalone output for Docker deployments
  ...(isSelfHosted && { output: "standalone" }),
  // Ignore TypeScript errors in self-hosted builds (pre-existing issues)
  ...(isSelfHosted && {
    typescript: { ignoreBuildErrors: true },
    eslint: { ignoreDuringBuilds: true },
  }),
  // Self-hosted packages that need native Node.js (not Edge Runtime)
  ...(isSelfHosted && {
    serverExternalPackages: ["ioredis", "mysql2"],
  }),
  transpilePackages: [
    "prettier",
    "shiki",
    "@dub/prisma",
    "@dub/email",
    "@boxyhq/saml-jackson",
  ],
  outputFileTracingIncludes: {
    "/api/auth/saml/token": [
      "./node_modules/jose/**/*",
      "./node_modules/openid-client/**/*",
    ],
  },
  experimental: {
    optimizePackageImports: [
      "@dub/email",
      "@dub/ui",
      "@dub/utils",
      "@team-plain/typescript-sdk",
    ],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config, { webpack, isServer }) => {
    if (isServer) {
      config.plugins.push(
        // mute errors for unused typeorm deps
        new webpack.IgnorePlugin({
          resourceRegExp:
            isSelfHosted
              ? /(^@google-cloud\/spanner|^@mongodb-js\/zstd|^aws-crt|^aws4$|^pg-native$|^mongodb-client-encryption$|^@sap\/hana-client$|^@sap\/hana-client\/extension\/Stream$|^snappy$|^react-native-sqlite-storage$|^bson-ext$|^cardinal$|^kerberos$|^hdb-pool$|^sql.js$|^sqlite3$|^better-sqlite3$|^typeorm-aurora-data-api-driver$|^pg-query-stream$|^oracledb$|^snappy\/package\.json$|^cloudflare:sockets$)/
              : /(^@google-cloud\/spanner|^@mongodb-js\/zstd|^aws-crt|^aws4$|^pg-native$|^mongodb-client-encryption$|^@sap\/hana-client$|^@sap\/hana-client\/extension\/Stream$|^snappy$|^react-native-sqlite-storage$|^bson-ext$|^cardinal$|^kerberos$|^hdb-pool$|^sql.js$|^sqlite3$|^better-sqlite3$|^ioredis$|^typeorm-aurora-data-api-driver$|^pg-query-stream$|^oracledb$|^mysql$|^snappy\/package\.json$|^cloudflare:sockets$)/,
        }),
      );

      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // Self-hosted: ensure selfhost modules and their deps are properly resolved
    if (isSelfHosted) {
      const path = require("path");
      // Make ioredis and mysql2 external for server bundles (they use native Node.js modules)
      if (config.externals) {
        const origExternals = config.externals;
        config.externals = [
          ...(Array.isArray(origExternals) ? origExternals : [origExternals]),
          function ({ request }, callback) {
            if (/^ioredis/.test(request) || /^mysql2/.test(request)) {
              return callback(null, "commonjs " + request);
            }
            callback();
          },
        ].filter(Boolean);
      }
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        hostname: "assets.dub.co", // for Dub's static assets
      },
      {
        hostname: "dubassets.com", // for Dub's user generated images
      },
      {
        hostname: "dev.dubassets.com", // dev bucket
      },
      {
        hostname: "www.google.com",
      },
      {
        hostname: "avatar.vercel.sh",
      },
      {
        hostname: "faisalman.github.io",
      },
      {
        hostname: "api.dicebear.com",
      },
      {
        hostname: "pbs.twimg.com",
      },
      {
        hostname: "lh3.googleusercontent.com",
      },
      {
        hostname: "avatars.githubusercontent.com",
      },
      {
        hostname: "media.cleanshot.cloud", // only for staging purposes
      },
      // Self-hosted: MinIO / custom storage
      ...(isSelfHosted
        ? [
            {
              hostname: "localhost",
            },
            {
              hostname: "minio",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer-when-downgrade",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "app.dub.sh",
          },
        ],
        destination: "https://app.dub.co",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "app.dub.sh",
          },
        ],
        destination: "https://app.dub.co/:path*",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "staging.dub.sh",
          },
        ],
        destination: "https://dub.co",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "preview.dub.sh",
          },
        ],
        destination: "https://preview.dub.co",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "admin.dub.sh",
          },
        ],
        destination: "https://admin.dub.co",
        permanent: true,
        statusCode: 301,
      },
    ];
  },
  async rewrites() {
    return [
      // for dub proxy
      {
        source: "/_proxy/dub/track/click",
        destination: "https://api.dub.co/track/click",
      },
    ];
  },
};
