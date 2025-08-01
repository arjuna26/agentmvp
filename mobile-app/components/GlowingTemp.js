import { Text, View } from "react-native";
import GlowingText, { GlowingTextPresets } from "./GlowingText";

export default function GlowingTemp({ value, unit, fontSize = 36 }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <GlowingText {...GlowingTextPresets.temperature}>
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
