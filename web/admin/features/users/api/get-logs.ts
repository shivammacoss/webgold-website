"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminLoginLogRow } from "../types";

export const userLogsKey = (userId: string) =>
  ["admin", "users", userId, "logs"] as const;

export function useUserLogs(userId: string | null) {
  return useQuery({
    queryKey: userLogsKey(userId ?? "none"),
    queryFn: () => api<AdminLoginLogRow[]>(`/admin/users/${userId}/logs?limit=200`),
    enabled: !!userId,
    // While the modal is open, refetch every 10s so new heartbeats appear live.
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}
