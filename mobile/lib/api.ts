import Constants from "expo-constants";

import { tokenStore } from "./storage";

/** Resolve the backend URL.
 *
 * In dev: Expo gives us `hostUri` like "192.168.1.21:8081" — the LAN IP of
 * the Mac running Metro. We swap the Metro port for our backend port (8000)
 * so the phone can reach the backend without any config edits.
 *
 * In production: falls back to `extra.apiUrl` from app.json (which you'd set
 * to a real https endpoint). */
function resolveApiUrl(): string {
  const explicit = (Constants.expoConfig?.extra?.apiUrl as string) || "";
  const isLocalhost = !explicit || /localhost|127\.0\.0\.1/.test(explicit);
  if (isLocalhost) {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      // @ts-expect-error — older SDKs expose it on manifest2/manifest
      Constants.manifest2?.extra?.expoClient?.hostUri ||
      "";
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost") return `http://${host}:8000`;
  }
  return explicit || "http://localhost:8000";
}

const API_URL = `${resolveApiUrl().replace(/\/+$/, "")}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function refresh(): Promise<string | null> {
  const refresh_token = await tokenStore.getRefresh();
  if (!refresh_token) return null;
  const r = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  if (!r.ok) {
    await tokenStore.clear();
    return null;
  }
  const data = await r.json();
  await tokenStore.set(data.access_token, data.refresh_token);
  return data.access_token as string;
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (auth) {
    const token = await tokenStore.getAccess();
    if (token) h["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_URL}${path}`, { ...rest, headers: h });
  if (res.status === 401 && auth) {
    const newToken = await refresh();
    if (newToken) {
      h["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, { ...rest, headers: h });
    }
  }

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.detail || msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
