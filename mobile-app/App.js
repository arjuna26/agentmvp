import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';

// AsyncStorage has been extracted from React Native core.  Use the
// community package provided by @react-native-async-storage/async-storage
// to persist user preferences like favourites.  This import will be
// automatically resolved by Expo or React Native CLI.
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Convert temperatures between Fahrenheit and Celsius.  The NWS API returns
// temperatures in degrees Fahrenheit by default.  When the user selects
// Celsius, convert the value accordingly.  If the units are the same or
// the input is undefined, the original value is returned.  Values are
// rounded to the nearest integer for a clean display.
function convertTemperature(value, fromUnit, toUnit) {
  if (value === undefined || value === null) return value;
  if (fromUnit === toUnit) return value;
  // Convert from Fahrenheit to Celsius
  if (fromUnit === 'F' && toUnit === 'C') {
    return Math.round(((value - 32) * 5) / 9);
  }
  // Convert from Celsius to Fahrenheit
  if (fromUnit === 'C' && toUnit === 'F') {
    return Math.round((value * 9) / 5 + 32);
  }
  return value;
}

// Select a simple emoji to represent common weather conditions.  The NWS
// "shortForecast" property contains phrases like "Sunny", "Mostly Cloudy",
// "Chance of Rain", etc.  This helper maps keywords to icons.  If no
// keyword matches, a default weather symbol is returned.
function getWeatherIcon(description = '') {
  const text = description.toLowerCase();
  if (/(sunny|clear)/.test(text)) return '☀️';
  if (/(partly cloudy|mostly cloudy|cloudy|overcast)/.test(text)) return '⛅️';
  if (/(rain|showers|drizzle)/.test(text)) return '🌧️';
  if (/(thunder|storm)/.test(text)) return '⛈️';
  if (/(snow|flurries|blizzard)/.test(text)) return '❄️';
  if (/(fog|mist|haze)/.test(text)) return '🌫️';
  return '🌡️';
}

export default function App() {
  // Selected location from our curated list.  Default to the first entry.
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  // Track a list of favourite location IDs. These are shown at the top of the
  // selector and can be toggled on each list item.  The list is persisted
  // across app restarts using AsyncStorage, so users' favourite parks are
  // saved automatically.
  const [favorites, setFavorites] = useState([]);
  // User input for searching arbitrary locations.  This string is bound to
  // a TextInput component.  Pressing the search button or submitting the
  // input will trigger a geocode lookup via the OpenStreetMap Nominatim API.
  const [searchQuery, setSearchQuery] = useState('');
  // Results returned from the geocode lookup. Each entry has id, name,
  // latitude and longitude properties.  Selecting a search result will
  // update the current selectedLocation.
  const [searchResults, setSearchResults] = useState([]);
  const [daily, setDaily] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // On initial mount, attempt to load any previously saved favourites from
  // persistent storage.  If a saved list exists, parse it and update the
  // state accordingly.  AsyncStorage.getItem returns a Promise that
  // resolves to a string or null.  Errors are logged to console but not
  // displayed to the user.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('favorites');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to load favourites from storage', err);
      }
    })();
  }, []);

  // Whenever the favourites list changes, persist it to AsyncStorage.
  // We stringify the array of IDs and ignore errors silently.  This
  // ensures that user favourites are preserved across app restarts.
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (err) {
        console.error('Failed to save favourites to storage', err);
      }
    })();
  }, [favorites]);

  // User‑selected temperature unit.  Supported values are 'F' for Fahrenheit
  // and 'C' for Celsius.  The default is Fahrenheit to match the NWS API.
  const [unit, setUnit] = useState('F');

  // Geocode the current searchQuery using the Nominatim API.  The API
  // accepts a query string and returns an array of places with lat/long
  // coordinates.  We limit results to 5 to avoid overwhelming the UI.
  async function searchLocation() {
    const query = searchQuery.trim();
    if (!query) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=5`;
      const resp = await fetch(url, {
        headers: {
          // Provide a basic User‑Agent to satisfy Nominatim usage policy.
          'User-Agent': 'ParkCastMobile/1.0 (https://github.com/arjuna26/agentmvp)',
        },
      });
      const data = await resp.json();
      const results = data.map((item) => ({
        id: `search-${item.lat}-${item.lon}`,
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
      setSearchResults(results);
    } catch (err) {
      console.error('Search error', err);
    }
  }

  // Fetch data whenever the selected location changes.  Before
  // requesting fresh data from the API we attempt to load any
  // previously cached forecast from persistent storage.  Cached
  // results are keyed by the location id and loaded synchronously
  // within this effect so that the UI can render immediately.  We
  // then fetch fresh data in the background and overwrite both the
  // state and the cache when successful.  If the network request
  // fails, the app continues to display the cached data (if any) and
  // exposes the error state for user feedback.
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      // Try to load cached daily and hourly forecasts for this location.
      try {
        const dailyKey = `daily-${selectedLocation.id}`;
        const hourlyKey = `hourly-${selectedLocation.id}`;
        const [cachedDaily, cachedHourly] = await Promise.all([
          AsyncStorage.getItem(dailyKey),
          AsyncStorage.getItem(hourlyKey),
        ]);
        if (!cancelled) {
          if (cachedDaily) {
            try {
              const parsedDaily = JSON.parse(cachedDaily);
              setDaily(parsedDaily);
            } catch (err) {
              // ignore JSON parsing errors
            }
          }
          if (cachedHourly) {
            try {
              const parsedHourly = JSON.parse(cachedHourly);
              setHourly(parsedHourly);
            } catch (err) {
              // ignore JSON parsing errors
            }
          }
        }
      } catch (err) {
        // Failure to read the cache shouldn’t block the network call
        console.error('Error loading cached forecast', err);
      }

      try {
        const { lat, lon } = selectedLocation;
        const dailyResp = await getForecast(lat, lon);
        const newDaily = dailyResp.properties.periods;
        const hourlyResp = await getHourlyForecast(lat, lon);
        const newHourly = hourlyResp.properties.periods;
        const alertsResp = await getAlerts(lat, lon);
        if (!cancelled) {
          setDaily(newDaily);
          setHourly(newHourly);
          setAlerts(alertsResp);
          // Persist the fresh forecasts to cache.
          try {
            await AsyncStorage.setItem(
              `daily-${selectedLocation.id}`,
              JSON.stringify(newDaily)
            );
            await AsyncStorage.setItem(
              `hourly-${selectedLocation.id}`,
              JSON.stringify(newHourly)
            );
          } catch (err) {
            console.error('Failed to write forecast to cache', err);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
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
      {/* Search bar for arbitrary locations */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchLocation}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      {searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          {searchResults.map((res) => {
            const isSelected = selectedLocation.id === res.id;
            return (
              <TouchableOpacity
                key={res.id}
                onPress={() => {
                  setSelectedLocation(res);
                  setSearchResults([]);
                  setSearchQuery(res.name);
                }}
                style={[
                  styles.locationItem,
                  isSelected && styles.selectedLocationItem,
                ]}
              >
                <Text
                  style={[
                    styles.locationText,
                    isSelected && styles.selectedLocationText,
                  ]}
                >
                  {res.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {/* Temperature unit toggle */}
      <View style={styles.unitToggleContainer}>
        {['F', 'C'].map((u) => {
          const selected = unit === u;
          return (
            <TouchableOpacity
              key={u}
              onPress={() => setUnit(u)}
              style={[
                styles.unitButton,
                selected && styles.selectedUnitButton,
              ]}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  selected && styles.selectedUnitButtonText,
                ]}
              >
                °{u}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Location selector */}
      <View style={styles.selectorContainer}>
        {/* Sort locations so favourites appear first.  A favourite has
            favourites.includes(id) === true. Non‑favourites follow in their
            original order. */}
        {[...locations]
          .sort((a, b) => {
            const aFav = favorites.includes(a.id) ? 0 : 1;
            const bFav = favorites.includes(b.id) ? 0 : 1;
            return aFav - bFav;
          })
          .map((loc) => {
            const isSelected = selectedLocation.id === loc.id;
            const isFavourite = favorites.includes(loc.id);
            return (
              <View key={loc.id} style={styles.locationRow}>
                {/* Touchable area to select this location */}
                <TouchableOpacity
                  onPress={() => setSelectedLocation(loc)}
                  style={[
                    styles.locationItem,
                    isSelected && styles.selectedLocationItem,
                  ]}
                >
                  <Text
                    style={[
                      styles.locationText,
                      isSelected && styles.selectedLocationText,
                    ]}
                  >
                    {loc.name}
                  </Text>
                </TouchableOpacity>
                {/* Star toggle.  A filled star indicates a favourite. */}
                <TouchableOpacity
                  onPress={() => {
                    setFavorites((prev) => {
                      if (prev.includes(loc.id)) {
                        return prev.filter((id) => id !== loc.id);
                      }
                      return [...prev, loc.id];
                    });
                  }}
                  style={styles.favoriteButton}
                >
                  <Text
                    style={isFavourite ? styles.favoriteStar : styles.star}
                  >
                    {isFavourite ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
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
      {daily.map((p) => {
        const temp = convertTemperature(
          p.temperature,
          p.temperatureUnit,
          unit
        );
        const icon = getWeatherIcon(p.shortForecast);
        return (
          <View key={p.number} style={styles.card}>
            <Text style={styles.period}>{p.name}</Text>
            <View style={styles.forecastRow}>
              <Text style={styles.weatherIcon}>{icon}</Text>
              <Text style={styles.forecastText}>
                {temp}°{unit} – {p.windSpeed} {p.windDirection}
              </Text>
            </View>
            {p.probabilityOfPrecipitation &&
            p.probabilityOfPrecipitation.value !== null && (
              <Text>
                Precipitation: {p.probabilityOfPrecipitation.value}%
              </Text>
            )}
            <Text>{p.shortForecast}</Text>
            <Text>{p.detailedForecast}</Text>
          </View>
        );
      })}

      {/* Hourly forecast section */}
      <Text style={styles.heading}>Hourly Forecast (Next 12 Hours)</Text>
      {hourly.slice(0, 12).map((p) => {
        const temp = convertTemperature(
          p.temperature,
          p.temperatureUnit,
          unit
        );
        const icon = getWeatherIcon(p.shortForecast);
        return (
          <View key={p.number} style={styles.card}>
            <Text style={styles.period}>
              {new Date(p.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.forecastRow}>
              <Text style={styles.weatherIcon}>{icon}</Text>
              <Text style={styles.forecastText}>
                {temp}°{unit} – {p.windSpeed} {p.windDirection}
              </Text>
            </View>
            {p.probabilityOfPrecipitation &&
            p.probabilityOfPrecipitation.value !== null && (
              <Text>
                Precipitation: {p.probabilityOfPrecipitation.value}%
              </Text>
            )}
            <Text>{p.shortForecast}</Text>
          </View>
        );
      })}
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
  // Container row for a location entry.  Positions the name button and
  // favourite star horizontally.
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  // Button wrapper for the star. Adds spacing from the location name.
  favoriteButton: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  // Base star style.  Light grey colour for non‑favourites.
  star: {
    fontSize: 18,
    color: '#bbb',
  },
  // Star style for favourites. Darker colour to indicate active state.
  favoriteStar: {
    fontSize: 18,
    color: '#E2A72E',
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
  // Container for the unit toggle buttons.  Displays the Fahrenheit/Celsius
  // options horizontally.
  unitToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  // Base styling for each unit button.
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: '#f5f5f5',
  },
  // Styling applied to the selected unit button.
  selectedUnitButton: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  // Text styling for unit labels.
  unitButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  // Text styling for selected unit labels.
  selectedUnitButtonText: {
    color: '#fff',
  },

  // Row layout for the forecast temperature and wind details. Aligns the
  // weather icon and the descriptive text horizontally.
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  // Styling for the weather emoji. Slightly larger font size and
  // margin to separate it from the text.
  weatherIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  // Styling for the forecast text next to the icon. Use default
  // colour and allow wrapping on smaller screens.
  forecastText: {
    flexShrink: 1,
    color: '#333',
  },

  // Container for the search bar and button.  Align input and button
  // horizontally with some spacing.
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  // Text input used for entering search queries.
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
  },
  // Button displayed next to the search field.  Uses green colour to
  // stand out and invites the user to start the lookup.
  searchButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#00704A',
    borderRadius: 4,
  },
  // Text styling for the search button.
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Container for the list of search results.  Adds a slight
  // separation from the search bar.
  searchResultsContainer: {
    marginBottom: 16,
  },
});