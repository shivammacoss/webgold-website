"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Wallet } from "@/features/wallet/types";

export type PaymentMethod = "MANUAL" | "UPI" | "CARD" | "BANK_TRANSFER";

export interface BuyGoldInput {
  amount_inr: number;
  method?: PaymentMethod;
  method_ref?: string | null;
}

export function useBuyGold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BuyGoldInput | number) => {
      const body: BuyGoldInput =
        typeof input === "number" ? { amount_inr: input, method: "MANUAL" } : input;
      return api<Wallet>("/invest/gold/buy", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (wallet) => {
      qc.setQueryData(["wallet"], wallet);
      qc.invalidateQueries({ queryKey: ["wallet", "txns"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
