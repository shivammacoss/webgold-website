"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminFDPlan } from "../types";

import { plansQueryKey } from "./list-plans";

export interface CreatePlanInput {
  name: string;
  lock_in_days: number;
  apr_pct: number;
  min_grams: number;
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) =>
      api<AdminFDPlan>("/admin/fd-plans", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansQueryKey });
    },
  });
}
