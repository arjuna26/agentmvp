import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { convertTemperature, getWeatherIcon } from "../utils/formatting";
import GlowingTemp from "./GlowingTemp";

export default function WeatherHero({
  currentWeather,
  selectedLocation,
  unit,
  hourly,
}) {
  if (!selectedLocation) {
    return (
      <View style={styles.heroContainer}>
        <Text style={styles.locationName}>Loading...</Text>
      </View>
    );
  }

  const currentConditions =
    hourly && hourly.length > 0
      ? hourly.find((hour) => {
          const hourTime = new Date(hour.startTime);
          const now = new Date();
          const timeDiff = Math.abs(now - hourTime);
          return timeDiff <= 30 * 60 * 1000;
        }) || hourly[0]
      : currentWeather;

  if (!currentConditions) {
    return (
      <View style={styles.heroContainer}>
        <View style={styles.locationSection}>
          <Ionicons name="location" size={16} color="#60a5fa" />
          <Text style={styles.locationName} numberOfLines={2}>
            {selectedLocation.name}
          </Text>
        </View>
        <Text style={styles.loadingText}>Getting weather data...</Text>
      </View>
    );
  }

  const currentTemp = convertTemperature(
    currentConditions.temperature,
    currentConditions.temperatureUnit,
    unit
  );

  const weatherIcon = getWeatherIcon(currentConditions.shortForecast, 64);

  return (
    <View style={styles.heroContainer}>
      <View style={styles.locationSection}>
        <Ionicons name="location" size={16} color="#60a5fa" />
        <Text style={styles.locationName} numberOfLines={2}>
          {selectedLocation.name}
        </Text>
      </View>

      <GlowingTemp value={currentTemp} unit={unit} fontSize={36} />

      <View style={styles.conditionSection}>
        <Text style={styles.timeLabel}>
          {hourly && hourly.length > 0
            ? "Current conditions"
            : "Today's forecast"}
        </Text>

        <Text style={styles.weatherCondition}>
          {currentConditions.shortForecast}
        </Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <Ionicons name="flag" size={14} color="#94a3b8" />
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>
            {currentConditions.windSpeed || "N/A"}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="compass" size={14} color="#94a3b8" />
          <Text style={styles.detailLabel}>Direction</Text>
          <Text style={styles.detailValue}>
            {currentConditions.windDirection || "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    padding: 32,
    margin: 16,
    backgroundColor: "rgba(42, 15, 15, 0)",
    borderRadius: 32,
    alignItems: "center",
    backdropFilter: "blur(40px)",
    borderTopWidth: 2,
    borderTopColor: "rgba(59,130,246,0.3)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 25,
    position: "relative",
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
    color: "#60a5fa",
  },
  locationName: {
    fontSize: 19,
    color: "#f8fafc",
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 250,
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  weatherSection: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 50,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  currentTemp: {
    fontSize: 96,
    color: "#ffffff",
    fontWeight: "100",
    lineHeight: 96,
    letterSpacing: -4,
  },
  tempUnit: {
    fontSize: 36,
    color: "#60a5fa",
    fontWeight: "100",
    marginLeft: 8,
    letterSpacing: 1,
    textShadowColor: "rgba(59,130,246,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  conditionSection: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 16,
  },
  weatherCondition: {
    fontSize: 22,
    marginTop: 12,
    color: "#f8fafc",
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.4,
  },
  timeLabel: {
    fontSize: 13,
    color: "#60a5fa",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  loadingText: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "500",
    marginTop: 20,
  },
  detailsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(59,130,246,0.4)",
    padding: 20,
    marginTop: 16,
    elevation: 12,
  },
  detailItem: {
    alignItems: "center",
    padding: 14,
    minWidth: 85,
    elevation: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
    marginBottom: 4,
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#f8fafc",
    fontWeight: "600",
  },
});
