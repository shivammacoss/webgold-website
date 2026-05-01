"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Wallet } from "@/features/wallet/types";

export function useSellGold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (grams: number) =>
      api<Wallet>("/invest/gold/sell", {
        method: "POST",
        body: JSON.stringify({ grams }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet", "txns"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
