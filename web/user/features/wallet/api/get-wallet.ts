"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { Wallet } from "../types";

export const walletQueryKey = ["wallet"] as const;

export function useWallet() {
  return useQuery({
    queryKey: walletQueryKey,
    queryFn: () => api<Wallet>("/wallet"),
  });
}
