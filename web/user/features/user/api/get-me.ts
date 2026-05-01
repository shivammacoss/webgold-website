"use client";

import { useQuery } from "@tanstack/react-query";

import type { User } from "@/features/auth/types";
import { api } from "@/lib/api-client";

export const meQueryKey = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => api<User>("/auth/me"),
  });
}
