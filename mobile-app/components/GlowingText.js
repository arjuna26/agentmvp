import { useRef, useEffect } from "react";
import { Animated, Text, View } from "react-native";

export default function GlowingText({ 
  children, 
  style = {}, 
  glowColor = "#ffffff",
  minGlow = 5,
  maxGlow = 25,
  duration = 2000,
  autoStart = true,
  loop = true,
  intensity = 1,
  naturalGlow = true,
  ...textProps 
}) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!autoStart) return;

    const createAnimation = () => {
      return Animated.sequence([
        Animated.timing(glow, { 
          toValue: intensity, 
          duration: duration, 
          useNativeDriver: false 
        }),
        Animated.timing(glow, { 
          toValue: 0, 
          duration: duration, 
          useNativeDriver: false 
        }),
      ]);
    };

    const animation = loop 
      ? Animated.loop(createAnimation())
      : createAnimation();

    animation.start();

    return () => animation.stop();
  }, [autoStart, duration, intensity, loop]);

  const shadowRadius = glow.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [minGlow, maxGlow] 
  });

  const shadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8]
  });

  if (naturalGlow) {
    // Create multiple layered shadows for a natural, free-flowing glow
    return (
      <View style={{ position: 'relative' }}>
        {/* Background glow layers */}
        <Animated.Text
          style={[
            {
              position: 'absolute',
              textShadowColor: glowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: shadowRadius,
              opacity: shadowOpacity,
            },
            style,
            { color: 'transparent' }
          ]}
          {...textProps}
        >
          {children}
        </Animated.Text>
        <Animated.Text
          style={[
            {
              position: 'absolute',
              textShadowColor: glowColor,
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: glow.interpolate({ 
                inputRange: [0, 1], 
                outputRange: [minGlow * 0.8, maxGlow * 0.8] 
              }),
              opacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.4]
              }),
            },
            style,
            { color: 'transparent' }
          ]}
          {...textProps}
        >
          {children}
        </Animated.Text>
        <Animated.Text
          style={[
            {
              position: 'absolute',
              textShadowColor: glowColor,
              textShadowOffset: { width: -1, height: -1 },
              textShadowRadius: glow.interpolate({ 
                inputRange: [0, 1], 
                outputRange: [minGlow * 0.6, maxGlow * 0.6] 
              }),
              opacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3]
              }),
            },
            style,
            { color: 'transparent' }
          ]}
          {...textProps}
        >
          {children}
        </Animated.Text>
        {/* Main text on top */}
        <Animated.Text
          style={[
            {
              textShadowColor: glowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: glow.interpolate({ 
                inputRange: [0, 1], 
                outputRange: [minGlow * 0.3, maxGlow * 0.4] 
              }),
              textShadowOpacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.6]
              }),
            },
            style
          ]}
          {...textProps}
        >
          {children}
        </Animated.Text>
      </View>
    );
  }

  // Fallback to simple glow for backwards compatibility
  return (
    <Animated.Text
      style={[
        {
          textShadowColor: glowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: shadowRadius,
          textShadowOpacity: shadowOpacity,
        },
        style
      ]}
      {...textProps}
    >
      {children}
    </Animated.Text>
  );
}

// Temperature-specific component
export function GlowingTemp({ value, unit, fontSize = 36 }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <GlowingText 
        glowColor="#3b82f6"
        minGlow={5}
        maxGlow={20}
        duration={1000}
        style={{
          fontSize: 96,
          color: "#ffffff",
          fontWeight: "100",
          letterSpacing: -4,
        }}
      >
        {value}
      </GlowingText>
      <Text style={{ 
        fontSize: fontSize, 
        color: "#60a5fa", 
        marginLeft: 8,
        fontWeight: "100",
        letterSpacing: 1,
        textShadowColor: "rgba(59,130,246,0.6)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      }}>
        {unit}
      </Text>
    </View>
  );
}

// Preset configurations for common use cases
export const GlowingTextPresets = {
  temperature: {
    glowColor: "#3b82f6",
    minGlow: 5,
    maxGlow: 20,
    duration: 1000,
    style: {
      fontSize: 96,
      color: "#ffffff",
      fontWeight: "100",
      letterSpacing: -4,
    }
  },
  title: {
    glowColor: "#60a5fa",
    minGlow: 2,
    maxGlow: 8,
    duration: 1500,
    style: {
      fontSize: 24,
      color: "#f8fafc",
      fontWeight: "700",
    }
  },
  subtitle: {
    glowColor: "#60a5fa",
    minGlow: 1,
    maxGlow: 4,
    duration: 2000,
    style: {
      fontSize: 16,
      color: "#94a3b8",
      fontWeight: "500",
    }
  },
  accent: {
    glowColor: "#fbbf24",
    minGlow: 3,
    maxGlow: 12,
    duration: 800,
    style: {
      color: "#fbbf24",
      fontWeight: "600",
    }
  },
  warning: {
    glowColor: "#ef4444",
    minGlow: 2,
    maxGlow: 10,
    duration: 600,
    style: {
      color: "#fca5a5",
      fontWeight: "600",
    }
  },
  success: {
    glowColor: "#10b981",
    minGlow: 2,
    maxGlow: 8,
    duration: 1200,
    style: {
      color: "#6ee7b7",
      fontWeight: "600",
    }
  }
};
