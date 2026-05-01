"use client";

export interface GeoCoords {
  lat: number;
  lng: number;
  /** Browser-reported accuracy radius in meters. <50 = GPS, >1000 = WiFi/IP. */
  accuracy?: number;
}

export type GeoPermissionState = "granted" | "denied" | "prompt" | "unsupported";

/** Reads the current geolocation permission state without asking the user. */
export async function readGeoPermissionState(): Promise<GeoPermissionState> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "unsupported";
  }
  // Permissions API isn't 100% supported but is standard in Chrome/Firefox/Safari.
  if (navigator.permissions?.query) {
    try {
      const res = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return res.state as GeoPermissionState;
    } catch {
      // fall through
    }
  }
  return "prompt";
}

/**
 * Best-effort browser geolocation. Resolves with coords if the user grants
 * permission within the timeout, or `null` on denial / unsupported / timeout.
 * Never rejects — login flows should never block on this.
 *
 * Logs the reason to the console so you can diagnose missing-location bugs
 * by opening DevTools (look for "[geo] ..." messages).
 */
export function tryGetBrowserGeo(timeoutMs = 10_000): Promise<GeoCoords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    console.warn("[geo] navigator.geolocation unavailable in this browser");
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = (val: GeoCoords | null) => {
      if (done) return;
      done = true;
      resolve(val);
    };
    const timer = setTimeout(() => {
      console.warn(`[geo] timed out after ${timeoutMs}ms — no fix returned`);
      finish(null);
    }, timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        console.info(
          `[geo] OK lat=${pos.coords.latitude.toFixed(4)} ` +
            `lng=${pos.coords.longitude.toFixed(4)} ±${Math.round(pos.coords.accuracy)}m`,
        );
        finish({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        clearTimeout(timer);
        const reason =
          err.code === 1
            ? "PERMISSION_DENIED — open the lock icon next to the URL → set Location to Allow → reload"
            : err.code === 2
              ? "POSITION_UNAVAILABLE — device has no GPS/WiFi data"
              : err.code === 3
                ? "TIMEOUT"
                : `code=${err.code}`;
        console.warn(`[geo] failed: ${reason}`, err.message);
        finish(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

export function geoHeaders(geo: GeoCoords | null): Record<string, string> {
  if (!geo) return {};
  const headers: Record<string, string> = {
    "X-Geo-Lat": String(geo.lat),
    "X-Geo-Lng": String(geo.lng),
  };
  if (typeof geo.accuracy === "number") {
    headers["X-Geo-Accuracy"] = String(Math.round(geo.accuracy));
  }
  return headers;
}
