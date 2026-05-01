"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminGoldRate, AdminGoldRatePoint } from "../types";

export const rateQueryKey = ["admin", "gold", "rate"] as const;
export const historyQueryKey = (range: string) =>
  ["admin", "gold", "history", range] as const;

export function useGoldRate() {
  return useQuery({
    queryKey: rateQueryKey,
    queryFn: () => api<AdminGoldRate>("/gold/rate", { auth: false }),
    refetchInterval: 60_000,
  });
}

export function useGoldHistory(range: "1d" | "1w" | "1m" | "1y" = "1m") {
  return useQuery({
    queryKey: historyQueryKey(range),
    queryFn: () =>
      api<AdminGoldRatePoint[]>(`/gold/rate/history?range=${range}`, { auth: false }),
  });
}
