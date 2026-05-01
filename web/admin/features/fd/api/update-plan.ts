"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminFDPlan } from "../types";

import { plansQueryKey } from "./list-plans";

export interface UpdatePlanInput {
  name?: string;
  lock_in_days?: number;
  apr_pct?: number;
  min_grams?: number;
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlanInput }) =>
      api<AdminFDPlan>(`/admin/fd-plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansQueryKey });
    },
  });
}
