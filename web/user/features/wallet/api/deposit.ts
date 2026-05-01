"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { Wallet } from "../types";

export type PaymentMethod = "MANUAL" | "UPI" | "CARD" | "BANK_TRANSFER";

export interface DepositInput {
  amount_inr: number;
  method?: PaymentMethod;
  method_ref?: string | null;
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DepositInput | number) => {
      const body: DepositInput =
        typeof input === "number" ? { amount_inr: input, method: "MANUAL" } : input;
      return api<Wallet>("/wallet/deposit", {
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
