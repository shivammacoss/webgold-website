"use client";

import { useMutation } from "@tanstack/react-query";

import { env } from "@/config/env";
import { api } from "@/lib/api-client";

import type { ImpersonateResponse } from "../types";

export function useImpersonate() {
  return useMutation({
    mutationFn: (userId: string) =>
      api<ImpersonateResponse>(`/admin/users/${userId}/impersonate`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      // Hand off the freshly-minted user tokens to the customer app via a
      // bridge route. The bridge writes them into localStorage under the user
      // app's keys, then redirects to /home.
      const url = new URL("/auth-bridge", env.userAppUrl);
      url.searchParams.set("access", data.access_token);
      url.searchParams.set("refresh", data.refresh_token);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    },
  });
}
