import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { tokenStore } from "../lib/storage";

const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await tokenStore.getAccess();
      if (token) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(auth)/login");
      }
      setReady(true);
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <View className="flex-1 bg-brand-bg">
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0A0A" } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
