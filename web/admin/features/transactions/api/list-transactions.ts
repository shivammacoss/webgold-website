"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminTransaction } from "../types";

export const transactionsQueryKey = ["admin", "transactions"] as const;

/** Backend NOTE: requires GET /admin/transactions (all users, paginated). */
export function useAllTransactions() {
  return useQuery({
    queryKey: transactionsQueryKey,
    queryFn: () => api<AdminTransaction[]>("/admin/transactions"),
    // Tail the ledger live — new deposits / buys / FD lock-ins show within 10s.
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}
