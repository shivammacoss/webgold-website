"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminFDPlan } from "../types";

export const plansQueryKey = ["admin", "fd", "plans"] as const;

/** Reuses the public /fd/plans endpoint. */
export function useFDPlans() {
  return useQuery({
    queryKey: plansQueryKey,
    queryFn: () => api<AdminFDPlan[]>("/fd/plans"),
  });
}
