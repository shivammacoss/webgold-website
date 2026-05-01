"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { ReferralSummary } from "../types";

export const referralsQueryKey = ["referrals"] as const;

export function useReferrals() {
  return useQuery({
    queryKey: referralsQueryKey,
    queryFn: () => api<ReferralSummary>("/referrals"),
  });
}
