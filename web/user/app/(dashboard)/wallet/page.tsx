"use client";

import { CreditCard, Landmark, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";

import { SectionHero } from "@/components/common/section-hero";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { useCurrency } from "@/features/gold/store/currency-store";
import { useTransactions } from "@/features/wallet/api/get-transactions";
import { useWallet } from "@/features/wallet/api/get-wallet";
import { DepositSheet } from "@/features/wallet/components/deposit-sheet";
import { TransactionList } from "@/features/wallet/components/transaction-list";
import { WithdrawSheet } from "@/features/wallet/components/withdraw-sheet";
import { formatGrams } from "@/lib/utils";

export default function WalletPage() {
  const { data: wallet } = useWallet();
  const { data: txns } = useTransactions();
  const { currency, formatMoney } = useCurrency();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl">
      <SectionHero
        eyebrow="Funds"
        title="Wallet."
        subtitle="Add funds via Razorpay, withdraw to your bank or UPI, and review every transaction."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label={`${currency} balance`}
          value={wallet ? formatMoney(wallet.inr_balance) : "—"}
        />
        <StatCard
          label="Gold balance"
          value={wallet ? formatGrams(wallet.gold_grams) : "—"}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex flex-col justify-between gap-5">
          <div>
            <h2 className="mb-2 font-display font-light text-xl">Add funds</h2>
            <p className="text-sm text-brand-fg/60">
              Pay securely with Razorpay — UPI, debit/credit card, or net banking.
            </p>
            <div className="mt-4 flex items-center gap-3 text-brand-fg/40">
              <span className="flex items-center gap-1.5 text-xs">
                <Smartphone className="h-3.5 w-3.5" /> UPI
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <CreditCard className="h-3.5 w-3.5" /> Card
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Landmark className="h-3.5 w-3.5" /> Net banking
              </span>
            </div>
          </div>
          <Button variant="gold" size="lg" onClick={() => setDepositOpen(true)}>
            Deposit
          </Button>
          <p className="inline-flex items-center gap-1.5 text-xs text-brand-fg/40">
            <ShieldCheck className="h-3 w-3" />
            Powered by Razorpay · test mode
          </p>
        </Card>

        <Card className="flex flex-col justify-between gap-5">
          <div>
            <h2 className="mb-2 font-display font-light text-xl">Withdraw</h2>
            <p className="text-sm text-brand-fg/60">
              Move funds to any UPI ID or bank account via RazorpayX.
            </p>
            <div className="mt-4 flex items-center gap-3 text-brand-fg/40">
              <span className="flex items-center gap-1.5 text-xs">
                <Smartphone className="h-3.5 w-3.5" /> UPI
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Landmark className="h-3.5 w-3.5" /> Bank account
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            disabled={!wallet || wallet.inr_balance <= 0}
            onClick={() => setWithdrawOpen(true)}
          >
            Withdraw
          </Button>
          <p className="text-xs text-brand-fg/40">
            Simulated payouts in dev — RazorpayX requires production access.
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-display font-light text-2xl">Activity</h2>
        <TransactionList items={txns} />
      </Card>

      <DepositSheet open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawSheet
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        maxInr={wallet?.inr_balance ?? 0}
      />
    </div>
  );
}
