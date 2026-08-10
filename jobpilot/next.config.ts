import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Résumé uploads (RESUME_MAX_UPLOAD_BYTES, default 5MB) need headroom
      // above Next's default 1MB Server Action body limit.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
