"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { FD } from "../types";

export function useBreakFD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<FD>(`/fd/${id}/break`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet", "txns"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["fd", "list"] });
    },
  });
}
