import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  /** Evita incluir `public/portfolio-media` en bundles serverless (cientos de MB; las URLs son estáticas). */
  outputFileTracingExcludes: {
    "*": ["./public/portfolio-media/**/*"],
  },
  /** Evita 404 si alguien escribe /login/admin/... en lugar de /admin/... */
  async redirects() {
    return [
      { source: "/login/admin", destination: "/admin/login", permanent: false },
      { source: "/login/admin/:path*", destination: "/admin/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
