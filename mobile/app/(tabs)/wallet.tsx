import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { Card, StatCard } from "../../components/Card";
import { Input } from "../../components/Input";
import { SectionHeader } from "../../components/SectionHeader";
import { useCurrency } from "../../lib/currency";
import { useDeposit, useTransactions, useWallet, useWithdraw } from "../../lib/queries";
import { formatGrams } from "../../lib/format";
import type { Transaction } from "../../lib/types";

const LABELS: Record<Transaction["type"], string> = {
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdrawal",
  BUY_GOLD: "Bought gold",
  SELL_GOLD: "Sold gold",
  FD_LOCK: "FD locked",
  FD_PAYOUT: "FD matured",
  FD_BREAK: "FD broken",
  REFERRAL_BONUS: "Referral bonus",
};

export default function WalletScreen() {
  const { data: wallet } = useWallet();
  const { data: txns } = useTransactions();
  const deposit = useDeposit();
  const withdraw = useWithdraw();
  const { currency, symbol, formatMoney, toInr } = useCurrency();

  const [dep, setDep] = useState("");
  const [wd, setWd] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <SectionHeader
          eyebrow="Funds"
          title="Wallet."
          subtitle="Add funds, withdraw, track every move."
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCard label={currency} value={wallet ? formatMoney(wallet.inr_balance) : "—"} />
          </View>
          <View className="flex-1">
            <StatCard label="Gold" value={wallet ? formatGrams(wallet.gold_grams) : "—"} />
          </View>
        </View>

        <Card className="gap-3">
          <Text className="text-xl text-brand-fg" style={{ fontFamily: "serif" }}>Add funds</Text>
          <Input
            placeholder={`Amount in ${symbol}`}
            keyboardType="numeric"
            value={dep}
            onChangeText={setDep}
          />
          <Button
            variant="gold"
            onPress={async () => {
              try {
                await deposit.mutateAsync(toInr(parseFloat(dep) || 0));
                setDep("");
              } catch {}
            }}
          >
            {deposit.isPending ? "Adding…" : "Deposit"}
          </Button>
          <Text className="text-xs text-brand-fg/40">Simulated — no real money changes hands.</Text>
        </Card>

        <Card className="gap-3">
          <Text className="text-xl text-brand-fg" style={{ fontFamily: "serif" }}>Withdraw</Text>
          <Input
            placeholder={`Amount in ${symbol}`}
            keyboardType="numeric"
            value={wd}
            onChangeText={setWd}
          />
          <Button
            variant="outline"
            onPress={async () => {
              try {
                await withdraw.mutateAsync(toInr(parseFloat(wd) || 0));
                setWd("");
              } catch {}
            }}
          >
            {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
          </Button>
        </Card>

        <Card>
          <Text className="mb-4 text-2xl text-brand-fg" style={{ fontFamily: "serif" }}>Activity</Text>
          {!txns || txns.length === 0 ? (
            <Text className="text-sm text-brand-fg/60">No activity yet.</Text>
          ) : (
            <View>
              {txns.map((t) => {
                const isDebit = ["WITHDRAW", "BUY_GOLD", "FD_LOCK"].includes(t.type);
                return (
                  <View
                    key={t.id}
                    className="flex-row items-center justify-between border-b border-white/5 py-3"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm text-brand-fg">{LABELS[t.type] ?? t.type}</Text>
                      <Text className="text-[11px] text-brand-fg/50">
                        {new Date(t.created_at).toLocaleString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      {t.amount_inr > 0 && (
                        <Text className={isDebit ? "text-red-400" : "text-emerald-400"}>
                          {isDebit ? "−" : "+"}{formatMoney(t.amount_inr)}
                        </Text>
                      )}
                      {t.gold_grams > 0 && (
                        <Text className="text-xs text-brand-fg/60">{formatGrams(t.gold_grams)}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
