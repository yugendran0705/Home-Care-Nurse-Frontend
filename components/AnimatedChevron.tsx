import { ChevronDown } from "lucide-react-native";
import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type AnimatedChevronProps = {
  expanded: boolean;
  color: string;
  size?: number;
  /** Rotation duration in ms. */
  duration?: number;
};

/**
 * A chevron that rotates between pointing down (collapsed) and up (expanded)
 * instead of swapping icons, so the toggle reads as one continuous motion.
 */
export function AnimatedChevron({
  expanded,
  color,
  size = 20,
  duration = 220,
}: AnimatedChevronProps) {
  const progress = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, expanded, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ChevronDown size={size} color={color} />
    </Animated.View>
  );
}
