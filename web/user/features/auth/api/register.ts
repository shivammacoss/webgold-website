"use client";

import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import { tokenStore } from "../store/auth-store";
import type { RegisterInput, TokenPair } from "../types";

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api<TokenPair>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
        auth: false,
      }),
    onSuccess: (data) => tokenStore.set(data.access_token, data.refresh_token),
  });
}
