import { Tabs } from "expo-router";
import { Coins, Home, Settings, Share2, Wallet } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(11,11,12,0.95)",
          borderTopColor: "rgba(245,241,232,0.07)",
          height: 80,
          paddingTop: 8,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: "#E5B547", // brand gold
        tabBarInactiveTintColor: "rgba(245,241,232,0.45)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{ title: "Portfolio", tabBarIcon: ({ color, size }) => <Coins color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ title: "Wallet", tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="referrals"
        options={{ title: "Referrals", tabBarIcon: ({ color, size }) => <Share2 color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }}
      />
    </Tabs>
  );
}
