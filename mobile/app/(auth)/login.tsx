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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await api<TokenPair>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
      });
      await tokenStore.set(data.access_token, data.refresh_token);
      router.replace("/(tabs)/home");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}>
        <WordsPullUp text="Welcome back" textClassName="text-5xl" className="mb-2" />
        <Text className="mb-8 text-brand-fg/60">Log in to your mysafeGold wallet.</Text>

        <View className="gap-4">
          <Input
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {err && <Text className="text-red-400">{err}</Text>}
          <Button onPress={submit} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </View>

        <Text className="mt-6 text-sm text-brand-fg/60">
          New here?{" "}
          <Link href="/(auth)/signup" className="text-brand-fg underline">
            Create an account
          </Link>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
