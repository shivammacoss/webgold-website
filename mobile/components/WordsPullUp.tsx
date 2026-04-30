import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

interface Props {
  text: string;
  className?: string;
  textClassName?: string;
}

export function WordsPullUp({ text, className = "", textClassName = "" }: Props) {
  const words = text.split(" ");
  return (
    <View className={`flex-row flex-wrap ${className}`}>
      {words.map((w, i) => (
        <Word key={`${w}-${i}`} word={w} delay={i * 80} textClassName={textClassName} />
      ))}
    </View>
  );
}

function Word({ word, delay, textClassName }: { word: string; delay: number; textClassName: string }) {
  const y = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
  }, [delay, opacity, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style} className="mr-2">
      <Text className={`text-brand-fg ${textClassName}`}>{word}</Text>
    </Animated.View>
  );
}
