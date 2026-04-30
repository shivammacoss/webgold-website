import { Link, router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { WordsPullUp } from "../../components/WordsPullUp";
import { api } from "../../lib/api";
import { tokenStore } from "../../lib/storage";
import type { TokenPair } from "../../lib/types";

export default function SignupScreen() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    referral_code: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await api<TokenPair>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          referral_code: form.referral_code || null,
        }),
        auth: false,
      });
      await tokenStore.set(data.access_token, data.refresh_token);
      router.replace("/(tabs)/home");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}>
        <WordsPullUp text="Start saving in gold" textClassName="text-4xl" className="mb-2" />
        <Text className="mb-8 text-brand-fg/60">Two minutes to your first gram.</Text>

        <View className="gap-4">
          <Input placeholder="Full name" value={form.full_name} onChangeText={set("full_name")} />
          <Input
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={set("email")}
          />
          <Input
            placeholder="Phone (optional)"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={set("phone")}
          />
          <Input
            placeholder="Password (min 6 chars)"
            secureTextEntry
            value={form.password}
            onChangeText={set("password")}
          />
          <Input
            placeholder="Referral code (optional)"
            autoCapitalize="characters"
            value={form.referral_code}
            onChangeText={set("referral_code")}
          />
          {err && <Text className="text-red-400">{err}</Text>}
          <Button onPress={submit} disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </View>

        <Text className="mt-6 text-sm text-brand-fg/60">
          Already a member?{" "}
          <Link href="/(auth)/login" className="text-brand-fg underline">
            Sign in
          </Link>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
