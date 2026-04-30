import { useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { Card, StatCard } from "../../components/Card";
import { Input } from "../../components/Input";
import { SectionHeader } from "../../components/SectionHeader";
import { useCurrency } from "../../lib/currency";
import { useBuyGold, useFDPlans, useMe, usePortfolio, useRate, useStartFD, useWallet } from "../../lib/queries";
import { formatGrams } from "../../lib/format";

export default function HomeScreen() {
  const { data: me } = useMe();
  const { data: portfolio } = usePortfolio();
  const { data: rate } = useRate();
  const { data: wallet } = useWallet();
  const { data: plans } = useFDPlans();
  const buy = useBuyGold();
  const startFD = useStartFD();
  const { currency, symbol, formatMoney, toInr } = useCurrency();

  const [buyOpen, setBuyOpen] = useState(false);
  const [fdOpen, setFdOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [grams, setGrams] = useState("");
  const [planId, setPlanId] = useState<number | null>(null);

  const firstName = me?.full_name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <SectionHeader eyebrow="Dashboard" title={`Welcome back, ${firstName}.`} />

        <View className="gap-1">
          <Text className="text-[10px] uppercase tracking-[3px] text-brand-fg/50 font-medium">
            Live 24K · per gram
          </Text>
          <Text
            className="text-brand-fg tabular-nums"
            style={{ fontFamily: "serif", fontWeight: "300", fontSize: 56, lineHeight: 60, letterSpacing: -1.2 }}
          >
            {rate ? formatMoney(rate.inr_per_gram) : "—"}
          </Text>
          {rate && (
            <Text className="text-xs text-brand-fg/60">
              Buy {formatMoney(rate.buy_inr_per_gram)} · Sell {formatMoney(rate.sell_inr_per_gram)}
            </Text>
          )}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCard
              label="Gold"
              value={portfolio ? formatGrams(portfolio.gold_grams) : "—"}
              hint={portfolio ? `≈ ${formatMoney(portfolio.gold_value_inr)}` : undefined}
            />
          </View>
          <View className="flex-1">
            <StatCard
              label="INR"
              value={portfolio ? formatMoney(portfolio.inr_balance) : "—"}
            />
          </View>
        </View>

        <Card className="gap-3">
          <Text className="text-xs uppercase tracking-widest text-brand-fg/60">Buy gold</Text>
          <Text className="text-2xl text-brand-fg" style={{ fontFamily: "serif" }}>
            Live rate, instant settlement
          </Text>
          <Button variant="gold" onPress={() => setBuyOpen(true)}>
            Buy gold now
          </Button>
        </Card>

        <Card className="gap-3">
          <Text className="text-xs uppercase tracking-widest text-brand-fg/60">Gold FD</Text>
          <Text className="text-2xl text-brand-fg" style={{ fontFamily: "serif" }}>
            Lock in. Earn extra grams.
          </Text>
          <Button variant="primary" onPress={() => setFdOpen(true)}>
            Start a Gold FD
          </Button>
        </Card>
      </ScrollView>

      {/* Buy Gold modal */}
      <Modal visible={buyOpen} transparent animationType="slide" onRequestClose={() => setBuyOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl border border-white/10 bg-brand-bg p-6 gap-4">
            <Text className="text-2xl text-brand-fg" style={{ fontFamily: "serif" }}>Buy gold</Text>
            <Input
              placeholder={`Amount in ${symbol}`}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text className="text-sm text-brand-fg/60">
              You get {rate ? formatGrams(toInr(parseFloat(amount) || 0) / rate.buy_inr_per_gram) : "—"} ·
              Wallet {wallet ? formatMoney(wallet.inr_balance) : "—"}
            </Text>
            <Button
              variant="gold"
              onPress={async () => {
                try {
                  await buy.mutateAsync(toInr(parseFloat(amount) || 0));
                  setAmount("");
                  setBuyOpen(false);
                } catch {}
              }}
            >
              {buy.isPending ? "Buying…" : "Confirm"}
            </Button>
            <Button variant="ghost" onPress={() => setBuyOpen(false)}>Cancel</Button>
          </View>
        </View>
      </Modal>

      {/* Start FD modal */}
      <Modal visible={fdOpen} transparent animationType="slide" onRequestClose={() => setFdOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl border border-white/10 bg-brand-bg p-6 gap-4">
            <Text className="text-2xl text-brand-fg" style={{ fontFamily: "serif" }}>Start a Gold FD</Text>
            <View className="flex-row gap-2">
              {plans?.map((p) => (
                <View key={p.id} className="flex-1">
                  <Button
                    variant={planId === p.id ? "gold" : "outline"}
                    onPress={() => setPlanId(p.id)}
                  >
                    {`${p.lock_in_days}d · ${p.apr_pct}%`}
                  </Button>
                </View>
              ))}
            </View>
            <Input
              placeholder="Grams to lock"
              keyboardType="numeric"
              value={grams}
              onChangeText={setGrams}
            />
            <Text className="text-sm text-brand-fg/60">
              Available {wallet ? formatGrams(wallet.gold_grams) : "—"}
            </Text>
            <Button
              variant="gold"
              disabled={!planId}
              onPress={async () => {
                if (!planId) return;
                try {
                  await startFD.mutateAsync({ plan_id: planId, grams: parseFloat(grams) });
                  setGrams("");
                  setPlanId(null);
                  setFdOpen(false);
                } catch {}
              }}
            >
              {startFD.isPending ? "Locking…" : "Lock in gold"}
            </Button>
            <Button variant="ghost" onPress={() => setFdOpen(false)}>Cancel</Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
