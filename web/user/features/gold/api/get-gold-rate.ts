"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { RATE_REFETCH_INTERVAL_MS } from "@/lib/constants";

import type { GoldRate } from "../types";

export const goldRateQueryKey = ["gold", "rate"] as const;

export function useGoldRate() {
  return useQuery({
    queryKey: goldRateQueryKey,
    queryFn: () => api<GoldRate>("/gold/rate", { auth: false }),
    refetchInterval: RATE_REFETCH_INTERVAL_MS,
  });
}
