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

/**
 * Resolves an image URL to an absolute URL suitable for the current host.
 *
 * Images are stored in the DB as relative paths like `/api/storage/objects/…`.
 * On Replit, the browser proxy forwards those to the local API server.
 * On GitHub Pages (or any other host), they must be prefixed with the
 * deployed Replit API base URL so the browser fetches them from the right server.
 *
 * - Absolute URLs (http/https) and data URIs pass through unchanged.
 * - Null / undefined / empty string return undefined (renders no src attribute).
 * - Relative paths get prefixed with API_BASE.
 */
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const separator = url.startsWith("/") ? "" : "/";
  return `${DEPLOYED_API}${separator}${url}`;
}

/**
 * Converts an objectPath returned by the upload API (e.g. /objects/uploads/uuid)
 * into the absolute serving URL that is stored in the database.
 *
 * Always uses the deployed Replit API as the origin so that stored URLs are
 * absolute and work from any frontend host (GitHub Pages, custom domains, etc.)
 * without any runtime patching.
 */
export function toStorageUrl(objectPath: string): string {
  return `${DEPLOYED_API}/api/storage${objectPath}`;
}

const ADMIN_TOKEN_KEY = "hook_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
