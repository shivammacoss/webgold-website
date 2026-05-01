"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { GoldRatePoint, RateRange } from "../types";

export const historyQueryKey = (range: RateRange) =>
  ["gold", "history", range] as const;

export function useGoldHistory(range: RateRange = "1w") {
  return useQuery({
    queryKey: historyQueryKey(range),
    queryFn: () =>
      api<GoldRatePoint[]>(`/gold/rate/history?range=${range}`, { auth: false }),
  });
}
