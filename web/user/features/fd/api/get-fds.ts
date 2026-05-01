"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { FD } from "../types";

export const fdsQueryKey = ["fd", "list"] as const;

export function useFDs() {
  return useQuery({
    queryKey: fdsQueryKey,
    queryFn: () => api<FD[]>("/fd"),
  });
}
