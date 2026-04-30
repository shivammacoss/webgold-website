import { TextInput, type TextInputProps } from "react-native";

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="rgba(225,224,204,0.4)"
      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-brand-fg"
      {...props}
    />
  );
}
