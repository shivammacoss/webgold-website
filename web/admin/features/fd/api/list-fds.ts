"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminFD } from "../types";

export const fdsQueryKey = ["admin", "fds"] as const;

/** Backend NOTE: requires GET /admin/fds (all FDs across all users). */
export function useAllFDs() {
  return useQuery({
    queryKey: fdsQueryKey,
    queryFn: () => api<AdminFD[]>("/admin/fds"),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}
