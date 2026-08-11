import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained Docker images (see Dockerfile) — traces only the
  // node_modules this app actually needs into .next/standalone.
  output: "standalone",
  experimental: {
    serverActions: {
      // Résumé uploads (RESUME_MAX_UPLOAD_BYTES, default 5MB) need headroom
      // above Next's default 1MB Server Action body limit.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
