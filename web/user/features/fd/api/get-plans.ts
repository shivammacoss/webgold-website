"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { FDPlan } from "../types";

export const fdPlansQueryKey = ["fd", "plans"] as const;

export function useFDPlans() {
  return useQuery({
    queryKey: fdPlansQueryKey,
    queryFn: () => api<FDPlan[]>("/fd/plans"),
  });
}
