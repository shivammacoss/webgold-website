"use client";

import { api, ApiError } from "@/lib/api-client";
import { tryGetBrowserGeo, geoHeaders } from "@/lib/geolocation";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

/** Fire one heartbeat. Silent on every error — we never let this affect the UI. */
async function pingOnce(): Promise<void> {
  try {
    const geo = await tryGetBrowserGeo(8000);
    await api<void>("/audit/heartbeat", {
      method: "POST",
      headers: geoHeaders(geo),
    });
  } catch (e) {
    // 401 means the user is no longer signed in — heartbeat will be torn down
    // by the dashboard guard on the next render. Anything else: ignore.
    if (e instanceof ApiError && e.status === 401) return;
    if (process.env.NODE_ENV !== "production") {
      console.debug("[heartbeat] skipped:", (e as Error)?.message);
    }
  }
}

/**
 * Starts a 2-minute heartbeat loop. Returns a cleanup that stops it.
 * Call from a useEffect inside a layout that's only mounted while authenticated.
 */
export function startHeartbeat(): () => void {
  // Fire one immediately so the admin sees a HEARTBEAT row right after login.
  pingOnce();
  const id = setInterval(pingOnce, HEARTBEAT_INTERVAL_MS);
  return () => clearInterval(id);
}
