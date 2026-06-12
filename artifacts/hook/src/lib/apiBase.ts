/**
 * Runtime API base URL detection.
 *
 * Build-time env vars (VITE_*) are baked in at `pnpm build` time.  When the
 * frontend is served from GitHub Pages the build runs without any custom env
 * vars, so we can't rely on VITE_API_BASE_URL being present.
 *
 * Instead we detect the host at runtime:
 *   - Replit hosts (*.replit.app, *.replit.dev, localhost) → relative URLs,
 *     forwarded by the Replit reverse-proxy to the local API server.
 *   - Every other host (GitHub Pages, custom domains, …) → absolute URL
 *     pointing to the deployed Replit API server.
 */

const REPLIT_HOST =
  typeof window !== "undefined" &&
  (window.location.hostname.endsWith(".replit.app") ||
    window.location.hostname.endsWith(".replit.dev") ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const DEPLOYED_API = "https://fashion-hook.replit.app";

export const API_BASE: string = (
  // 1. Explicit build-time override (highest priority, used by CI/GitHub Actions)
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  // 2. Replit host → use relative URL (Replit proxy handles /api routing)
  (REPLIT_HOST ? import.meta.env.BASE_URL : DEPLOYED_API)
).replace(/\/+$/, "");
