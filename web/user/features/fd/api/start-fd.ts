"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { FD } from "../types";

export function useStartFD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { plan_id: number; grams: number }) =>
      api<FD>("/fd/start", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet", "txns"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["fd", "list"] });
    },
  });
}
