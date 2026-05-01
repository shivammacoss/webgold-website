"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { Portfolio } from "../types";

export const portfolioQueryKey = ["portfolio"] as const;

export function usePortfolio() {
  return useQuery({
    queryKey: portfolioQueryKey,
    queryFn: () => api<Portfolio>("/portfolio"),
  });
}
