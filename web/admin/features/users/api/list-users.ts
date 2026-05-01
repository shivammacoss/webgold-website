"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { AdminUserRow } from "../types";

export const usersQueryKey = ["admin", "users"] as const;

/** Backend NOTE: requires GET /admin/users (paginated user list). */
export function useUsers() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: () => api<AdminUserRow[]>("/admin/users"),
    // Live dashboard — pick up new signups / deposits / buys within ~15s.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}
