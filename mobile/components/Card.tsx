import { Text, View } from "react-native";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`}
    >
      {children}
    </View>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <Text className="text-[10px] uppercase tracking-widest text-brand-fg/50">{label}</Text>
      <Text className="mt-2 text-3xl text-brand-fg" style={{ fontFamily: "serif" }}>
        {value}
      </Text>
      {hint && <Text className="mt-1 text-xs text-brand-fg/60">{hint}</Text>}
    </Card>
  );
}
