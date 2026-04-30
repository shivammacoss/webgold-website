import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { CURRENCIES, useCurrency } from "../../lib/currency";
import { useMe, useRate } from "../../lib/queries";
import { tokenStore } from "../../lib/storage";

export default function SettingsScreen() {
  const { data: me } = useMe();
  const { data: rate } = useRate();
  const { currency, setCurrency } = useCurrency();

  const logout = async () => {
    await tokenStore.clear();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <View className="gap-1 mb-2">
          <Text className="text-[10px] uppercase tracking-[3px] text-brand-fg/50 font-medium">
            Account
          </Text>
          <Text className="text-5xl text-brand-fg" style={{ fontFamily: "serif", fontWeight: "300" }}>
            Settings.
          </Text>
          <Text className="text-brand-fg/60 mt-1">Profile, preferences, and security.</Text>
        </View>

        {/* Profile */}
        <Card className="gap-4">
          <View>
            <Text className="text-2xl text-brand-fg" style={{ fontFamily: "serif" }}>
              {me?.full_name ?? "—"}
            </Text>
            <Text className="text-sm text-brand-fg/60">{me?.email ?? ""}</Text>
          </View>

          <View className="gap-3">
            <Field label="Phone" value={me?.phone || "—"} />
            <Field
              label="Member since"
              value={me ? new Date(me.created_at).toLocaleDateString() : "—"}
            />
            <Field label="Referral code" value={me?.referral_code ?? "—"} mono />
          </View>
        </Card>

        {/* Currency picker */}
        <Card className="gap-3">
          <Text className="text-xl text-brand-fg" style={{ fontFamily: "serif" }}>
            Display currency
          </Text>
          <Text className="text-sm text-brand-fg/60">
            Wallet balance is stored in INR and converted at the live market rate.
          </Text>

          <View className="flex-row flex-wrap gap-2 mt-2">
            {CURRENCIES.map((c) => {
              const inrPer = rate?.fx?.[c.code];
              const active = currency === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => setCurrency(c.code)}
                  className={`rounded-xl border px-3 py-2 ${
                    active
                      ? "border-brand-gold bg-brand-gold/10"
                      : "border-white/10 bg-white/5"
                  }`}
                  style={{ minWidth: 90 }}
                >
                  <View className="flex-row items-center gap-1.5">
                    <Text style={{ fontSize: 14 }}>{c.flag}</Text>
                    <Text className="font-medium text-sm text-brand-fg tracking-wider">
                      {c.code}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-brand-fg/60 mt-0.5">{c.name}</Text>
                  {inrPer !== undefined && c.code !== "INR" && (
                    <Text className="text-[9px] text-brand-fg/40 mt-0.5">
                      1 {c.code} = ₹{inrPer < 1 ? inrPer.toFixed(4) : inrPer.toFixed(2)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-[11px] text-brand-fg/50 mt-2">
            Live FX from Yahoo Finance · refreshed every minute
          </Text>
        </Card>

        {/* Sign out */}
        <Card className="gap-3">
          <Text className="text-xl text-brand-fg" style={{ fontFamily: "serif" }}>
            Sign out
          </Text>
          <Text className="text-sm text-brand-fg/60">
            You'll need to log in again to access your wallet.
          </Text>
          <Button variant="danger" onPress={logout}>Log out</Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View>
      <Text className="text-[10px] uppercase tracking-widest text-brand-fg/50">{label}</Text>
      <Text className={`mt-1 text-sm text-brand-fg ${mono ? "font-mono tracking-widest" : ""}`}>
        {value}
      </Text>
    </View>
  );
}
