"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export interface AdminStats {
  total_users: number;
  total_inr_locked: number;
  total_gold_grams: number;
  active_fds: number;
  matured_fds: number;
  total_referral_payout_inr: number;
}

export const statsQueryKey = ["admin", "stats"] as const;

/** Backend NOTE: requires GET /admin/stats (platform-wide aggregates). */
export function useAdminStats() {
  return useQuery({
    queryKey: statsQueryKey,
    queryFn: () => api<AdminStats>("/admin/stats"),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}
