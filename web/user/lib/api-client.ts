"use client";

import { env } from "@/config/env";
import { tokenStore } from "@/features/auth/store/auth-store";

const API_URL = `${env.apiUrl.replace(/\/+$/, "")}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function refresh(): Promise<string | null> {
  const refresh_token = tokenStore.getRefresh();
  if (!refresh_token) return null;
  const r = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  if (!r.ok) {
    tokenStore.clear();
    return null;
  }
  const data = await r.json();
  tokenStore.set(data.access_token, data.refresh_token);
  return data.access_token;
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
    const token = tokenStore.getAccess();
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
