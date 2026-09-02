import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Fija la raíz del proyecto cuando hay otro `package-lock.json` en carpetas padre
 * (p. ej. `C:\\Users\\…`). Sin esto Next puede inferir mal el workspace y afectar
 * bundler / trazas y, en algunos casos, el aspecto en local.
 */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
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
      { source: "/studio", destination: "/creative-studio", permanent: true },
    ];
  },
};

export default nextConfig;
