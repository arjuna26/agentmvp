import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Import the mobile version of the weather API client. This lives within
// the mobile-app folder to avoid bundler resolution issues. If you prefer to
// reuse the Node implementation in src/weatherApi.js, adjust the import
// accordingly.
import {
  getForecast,
  getHourlyForecast,
} from './utils/weatherApi';

export default function App() {
  const [daily, setDaily] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Hardcoded example: Paradise Visitor Center, Mount Rainier National Park
    const lat = 46.7867;
    const lon = -121.7345;
    getForecast(lat, lon)
      .then((data) => setDaily(data.properties.periods))
      .catch((err) => setError(err.message));
    getHourlyForecast(lat, lon)
      .then((data) => setHourly(data.properties.periods))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  if (!daily || !hourly) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00704A" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.heading}>Daily Forecast</Text>
      {daily.map((p) => (
        <View key={p.number} style={styles.card}>
          <Text style={styles.period}>{p.name}</Text>
          <Text>{p.detailedForecast}</Text>
        </View>
      ))}
      <Text style={styles.heading}>Hourly Forecast (Next 12 Hours)</Text>
      {hourly.slice(0, 12).map((p) => (
        <View key={p.number} style={styles.card}>
          <Text style={styles.period}>
            {new Date(p.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text>
            {p.temperature}°{p.temperatureUnit}, {p.shortForecast}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  card: {
    marginBottom: 10,
  },
  period: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  error: {
    color: 'red',
  },
});