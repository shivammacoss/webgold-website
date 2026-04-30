import { Text, TouchableOpacity } from "react-native";

type Variant = "primary" | "gold" | "ghost" | "outline" | "danger";

const variants: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-brand-fg", text: "text-black" },
  gold: { container: "bg-brand-gold", text: "text-black" },
  ghost: { container: "bg-white/5", text: "text-brand-fg" },
  outline: { container: "border border-brand-fg/30 bg-transparent", text: "text-brand-fg" },
  danger: { container: "bg-red-500", text: "text-white" },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  children: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
}) {
  const v = variants[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className={`h-12 items-center justify-center rounded-full px-6 ${v.container} ${disabled ? "opacity-50" : ""}`}
    >
      <Text className={`text-base font-semibold ${v.text}`}>{children}</Text>
    </TouchableOpacity>
  );
}
