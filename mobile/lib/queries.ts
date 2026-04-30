import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import type {
  FD, FDPlan, GoldRate, Portfolio, ReferralSummary,
  Transaction, User, Wallet,
} from "./types";

export const qk = {
  me: ["me"] as const,
  rate: ["gold", "rate"] as const,
  wallet: ["wallet"] as const,
  txns: ["wallet", "txns"] as const,
  fdPlans: ["fd", "plans"] as const,
  fds: ["fd", "list"] as const,
  portfolio: ["portfolio"] as const,
  referrals: ["referrals"] as const,
};

export const useMe = () =>
  useQuery({ queryKey: qk.me, queryFn: () => api<User>("/auth/me") });

export const useRate = () =>
  useQuery({
    queryKey: qk.rate,
    queryFn: () => api<GoldRate>("/gold/rate", { auth: false }),
    refetchInterval: 60_000,
  });

export const useWallet = () =>
  useQuery({ queryKey: qk.wallet, queryFn: () => api<Wallet>("/wallet") });

export const useTransactions = () =>
  useQuery({ queryKey: qk.txns, queryFn: () => api<Transaction[]>("/wallet/transactions") });

export const useFDPlans = () =>
  useQuery({ queryKey: qk.fdPlans, queryFn: () => api<FDPlan[]>("/fd/plans") });

export const useFDs = () =>
  useQuery({ queryKey: qk.fds, queryFn: () => api<FD[]>("/fd") });

export const usePortfolio = () =>
  useQuery({ queryKey: qk.portfolio, queryFn: () => api<Portfolio>("/portfolio") });

export const useReferrals = () =>
  useQuery({ queryKey: qk.referrals, queryFn: () => api<ReferralSummary>("/referrals") });

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.wallet });
    qc.invalidateQueries({ queryKey: qk.txns });
    qc.invalidateQueries({ queryKey: qk.portfolio });
    qc.invalidateQueries({ queryKey: qk.fds });
  };
}

export const useDeposit = () => {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (amount_inr: number) =>
      api<Wallet>("/wallet/deposit", { method: "POST", body: JSON.stringify({ amount_inr }) }),
    onSuccess: inv,
  });
};

export const useWithdraw = () => {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (amount_inr: number) =>
      api<Wallet>("/wallet/withdraw", { method: "POST", body: JSON.stringify({ amount_inr }) }),
    onSuccess: inv,
  });
};

export const useBuyGold = () => {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (amount_inr: number) =>
      api<Wallet>("/invest/gold/buy", { method: "POST", body: JSON.stringify({ amount_inr }) }),
    onSuccess: inv,
  });
};

export const useStartFD = () => {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (input: { plan_id: number; grams: number }) =>
      api<FD>("/fd/start", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: inv,
  });
};

export const useBreakFD = () => {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (id: number) => api<FD>(`/fd/${id}/break`, { method: "POST" }),
    onSuccess: inv,
  });
};
