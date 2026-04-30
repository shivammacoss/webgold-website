import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { Card, StatCard } from "../../components/Card";
import { SectionHeader } from "../../components/SectionHeader";
import { useCurrency } from "../../lib/currency";
import { useBreakFD, useFDs, usePortfolio } from "../../lib/queries";
import { formatGrams } from "../../lib/format";

export default function PortfolioScreen() {
  const { data: portfolio } = usePortfolio();
  const { data: fds } = useFDs();
  const breakFD = useBreakFD();
  const { formatMoney } = useCurrency();

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <SectionHeader
          eyebrow="Holdings"
          title="Portfolio."
          subtitle="Your gold, your FDs, your gains."
        />

        <View className="flex-row flex-wrap gap-3">
          <View className="flex-1 min-w-[45%]">
            <StatCard
              label="Total gold"
              value={portfolio ? formatGrams(portfolio.gold_grams) : "—"}
              hint={portfolio ? `Locked ${formatGrams(portfolio.locked_grams)}` : undefined}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <StatCard
              label="Value"
              value={portfolio ? formatMoney(portfolio.gold_value_inr) : "—"}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <StatCard
              label="Invested"
              value={portfolio ? formatMoney(portfolio.invested_inr) : "—"}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <StatCard
              label="P&L"
              value={portfolio ? `${portfolio.pnl_pct.toFixed(2)}%` : "—"}
              hint={portfolio ? formatMoney(portfolio.pnl_inr) : undefined}
            />
          </View>
        </View>

        <Card>
          <Text className="mb-4 text-2xl text-brand-fg" style={{ fontFamily: "serif" }}>
            Gold FDs
          </Text>
          {!fds || fds.length === 0 ? (
            <Text className="text-sm text-brand-fg/60">No FDs yet.</Text>
          ) : (
            <View className="gap-3">
              {fds.map((fd) => (
                <View
                  key={fd.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <View className="mb-1 flex-row items-center gap-2">
                    <Text className="text-lg text-brand-fg" style={{ fontFamily: "serif" }}>
                      {fd.plan_name}
                    </Text>
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        fd.status === "ACTIVE"
                          ? "bg-emerald-500/20"
                          : fd.status === "MATURED"
                            ? "bg-brand-gold/20"
                            : "bg-white/10"
                      }`}
                    >
                      <Text
                        className={`text-[10px] uppercase ${
                          fd.status === "ACTIVE"
                            ? "text-emerald-300"
                            : fd.status === "MATURED"
                              ? "text-brand-gold"
                              : "text-brand-fg/60"
                        }`}
                      >
                        {fd.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-brand-fg/60">
                    {formatGrams(fd.principal_grams)} · {fd.apr_pct}% APR · matures{" "}
                    {new Date(fd.maturity_date).toLocaleDateString()}
                  </Text>
                  <Text className="text-xs text-brand-fg/50">
                    Projected: {formatGrams(fd.projected_payout_grams)}
                  </Text>
                  {fd.status === "ACTIVE" && (
                    <View className="mt-3">
                      <Button variant="ghost" onPress={() => breakFD.mutate(fd.id)}>
                        Break early
                      </Button>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
