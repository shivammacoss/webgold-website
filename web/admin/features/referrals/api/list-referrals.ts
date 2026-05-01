"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminReferralRow } from "../types";

export const referralsQueryKey = ["admin", "referrals"] as const;

export function useAdminReferrals() {
  return useQuery({
    queryKey: referralsQueryKey,
    queryFn: () => api<AdminReferralRow[]>("/admin/referrals"),
  });
}
