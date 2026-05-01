"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { Transaction } from "../types";

export const transactionsQueryKey = ["wallet", "txns"] as const;

export function useTransactions() {
  return useQuery({
    queryKey: transactionsQueryKey,
    queryFn: () => api<Transaction[]>("/wallet/transactions"),
  });
}
