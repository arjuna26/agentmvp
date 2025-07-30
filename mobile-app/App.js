import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

// Import the mobile version of the weather API client. This lives within
// the mobile-app folder to avoid bundler resolution issues.  We also
// import the alerts helper to retrieve active weather alerts.
import {
  getForecast,
  getHourlyForecast,
  getAlerts,
} from './utils/weatherApi';

// Curated list of national park locations.  Each entry has an id,
// name, latitude and longitude.  See utils/locations.js for details.
import locations from './utils/locations';

export default function App() {
  // Selected location from our curated list.  Default to the first entry.
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [daily, setDaily] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch data whenever the selected location changes.
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { lat, lon } = selectedLocation;
        const dailyResp = await getForecast(lat, lon);
        setDaily(dailyResp.properties.periods);
        const hourlyResp = await getHourlyForecast(lat, lon);
        setHourly(hourlyResp.properties.periods);
        const alertsResp = await getAlerts(lat, lon);
        setAlerts(alertsResp);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedLocation]);

  // Render error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  // Render loading state
  if (loading || !daily || !hourly) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00704A" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Location selector */}
      <View style={styles.selectorContainer}>
        {locations.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            onPress={() => setSelectedLocation(loc)}
            style={[
              styles.locationItem,
              selectedLocation.id === loc.id && styles.selectedLocationItem,
            ]}
          >
            <Text
              style={[
                styles.locationText,
                selectedLocation.id === loc.id && styles.selectedLocationText,
              ]}
            >
              {loc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alerts section */}
      {alerts && alerts.features && alerts.features.length > 0 && (
        <View style={styles.alertContainer}>
          <Text style={styles.heading}>Active Alerts</Text>
          {alerts.features.map((a, idx) => (
            <View key={idx} style={styles.alertCard}>
              <Text style={styles.alertTitle}>{a.properties.event}</Text>
              <Text style={styles.alertDesc}>
                {a.properties.headline || a.properties.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Daily forecast section */}
      <Text style={styles.heading}>Daily Forecast</Text>
      {daily.map((p) => (
        <View key={p.number} style={styles.card}>
          <Text style={styles.period}>{p.name}</Text>
          <Text>
            {p.temperature}°{p.temperatureUnit} – {p.windSpeed} {p.windDirection}
          </Text>
          {p.probabilityOfPrecipitation &&
          p.probabilityOfPrecipitation.value !== null && (
            <Text>
              Precipitation: {p.probabilityOfPrecipitation.value}%
            </Text>
          )}
          <Text>{p.shortForecast}</Text>
          <Text>{p.detailedForecast}</Text>
        </View>
      ))}

      {/* Hourly forecast section */}
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
            {p.temperature}°{p.temperatureUnit} – {p.windSpeed}{' '}
            {p.windDirection}
          </Text>
          {p.probabilityOfPrecipitation &&
          p.probabilityOfPrecipitation.value !== null && (
            <Text>
              Precipitation: {p.probabilityOfPrecipitation.value}%
            </Text>
          )}
          <Text>{p.shortForecast}</Text>
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
  // Container for the list of selectable locations.
  selectorContainer: {
    marginBottom: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  // Default styling for each location item.
  locationItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 4,
    backgroundColor: '#f5f5f5',
  },
  // Additional styling applied when a location is selected.
  selectedLocationItem: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  // Base text styling for location names.
  locationText: {
    color: '#333',
  },
  // Text styling for selected location names.
  selectedLocationText: {
    color: '#fff',
  },
  // Container for alerts.
  alertContainer: {
    backgroundColor: '#FFF4E5',
    borderColor: '#F5C26B',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  alertCard: {
    marginBottom: 8,
  },
  alertTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 12,
    color: '#333',
  },
});