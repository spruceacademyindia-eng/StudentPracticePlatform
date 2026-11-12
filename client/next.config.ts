import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Next.js to call the Render backend during SSR if needed
  // (all API calls are client-side so this is a safeguard)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
