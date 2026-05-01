"use client";

import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { type GeoCoords, geoHeaders } from "@/lib/geolocation";

import { tokenStore } from "../store/auth-store";
import type { LoginInput, TokenPair } from "../types";

interface AdminLoginArgs {
  input: LoginInput;
  geo?: GeoCoords | null;
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: ({ input, geo }: AdminLoginArgs) =>
      api<TokenPair>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
        auth: false,
        headers: geoHeaders(geo ?? null),
      }),
    onSuccess: (data) => tokenStore.set(data.access_token, data.refresh_token),
  });
}
