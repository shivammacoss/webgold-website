import { Text, View } from "react-native";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

/** Mobile equivalent of the web's `SectionHero`. Uppercase eyebrow + light
 * serif title — Robinhood Gold-style. */
export function SectionHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <View className="gap-1 mb-2">
      {eyebrow && (
        <Text className="text-[10px] uppercase tracking-[3px] text-brand-fg/50 font-medium">
          {eyebrow}
        </Text>
      )}
      <Text
        className="text-5xl text-brand-fg"
        style={{ fontFamily: "serif", fontWeight: "300", letterSpacing: -1 }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text className="text-brand-fg/60 mt-1 text-base">{subtitle}</Text>
      )}
    </View>
  );
}
