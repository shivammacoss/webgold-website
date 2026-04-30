import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { Card, StatCard } from "../../components/Card";
import { SectionHeader } from "../../components/SectionHeader";
import { useCurrency } from "../../lib/currency";
import { useReferrals } from "../../lib/queries";

export default function ReferralsScreen() {
  const { data } = useReferrals();
  const [copied, setCopied] = useState(false);
  const { formatMoney } = useCurrency();

  const copy = async () => {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <SectionHeader
          eyebrow="Invite"
          title="Referrals."
          subtitle={`Bring friends — both of you get ${formatMoney(50)} on their first deposit.`}
        />

        <Card className="gap-4">
          <Text className="text-xs uppercase tracking-widest text-brand-fg/50">Your code</Text>
          <Text className="text-5xl text-brand-fg" style={{ fontFamily: "serif", letterSpacing: 4 }}>
            {data?.code ?? "—"}
          </Text>
          <Button variant="ghost" onPress={copy}>
            {copied ? "Copied" : "Copy code"}
          </Button>
        </Card>

        <StatCard
          label="Total earned"
          value={data ? formatMoney(data.total_bonus_inr) : "—"}
          hint={`${data?.referrals.length ?? 0} friends joined`}
        />

        <Card>
          <Text className="mb-4 text-2xl text-brand-fg" style={{ fontFamily: "serif" }}>
            Referred friends
          </Text>
          {!data || data.referrals.length === 0 ? (
            <Text className="text-sm text-brand-fg/60">Share your code to start earning.</Text>
          ) : (
            data.referrals.map((r) => (
              <View
                key={r.referee_email}
                className="flex-row items-center justify-between border-b border-white/5 py-3"
              >
                <View>
                  <Text className="text-sm text-brand-fg">{r.referee_email}</Text>
                  <Text className="text-[11px] text-brand-fg/50">
                    Joined {new Date(r.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text className={r.status === "PAID" ? "text-emerald-400" : "text-brand-fg/60"}>
                  {r.status === "PAID" ? formatMoney(r.bonus_inr) : "Pending"}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
