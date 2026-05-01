"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { Wallet } from "../types";

export type WithdrawMethod = "UPI" | "BANK_TRANSFER";

export interface WithdrawInput {
  amount_inr: number;
  method: WithdrawMethod;
  upi_id?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  ifsc?: string | null;
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WithdrawInput) =>
      api<Wallet>("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (wallet) => {
      qc.setQueryData(["wallet"], wallet);
      qc.invalidateQueries({ queryKey: ["wallet", "txns"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
