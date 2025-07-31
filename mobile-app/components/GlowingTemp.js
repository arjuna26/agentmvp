import { useRef, useEffect } from "react";
import { Animated, Text, View } from "react-native";

export default function GlowingTemp({ value, unit, fontSize }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const shadowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [5, 20] });

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Animated.Text
        style={{
          fontSize: 96,
          color: "#ffffff",
          fontWeight: "100",
          letterSpacing: -4,
          textShadowColor: "#3b82f6",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: shadowRadius,
        }}
      >
        {value}
      </Animated.Text>
      <Text style={{ fontSize: fontSize, color: "#60a5fa", marginLeft: 8 }}>{unit}</Text>
    </View>
  );
}
