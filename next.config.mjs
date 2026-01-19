let userConfig = undefined;
try {
  userConfig = await import("./v0-user-next.config");
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "squadco.com" },
      { protocol: "https", hostname: "habaripay.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "logos-world.net" },
    ],
  },
  serverExternalPackages: ["pdfkit", "fontkit"],
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Handle API routes with subdomains
        {
          source: "/api/:path*",
          has: [
            {
              type: "host",
              value: "(?<subdomain>[^.]+)\\.localhost:3000",
            },
          ],
          destination: "/api/:path*",
        },
        // Handle other routes with subdomains
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "(?<subdomain>[^.]+)\\.localhost:3000",
            },
          ],
          destination: "/:path*",
        },
      ],
    };
  },

  // Add hostname configuration for development
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
        ],
      },
    ];
  },
};

mergeConfig(nextConfig, userConfig);

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return;
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === "object" &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

export default nextConfig;
