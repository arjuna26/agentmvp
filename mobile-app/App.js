import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  RefreshControl,
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

// Expo Location API allows us to request the device's current GPS coordinates.
// When the user taps the "Use Current Location" button we ask for
// foreground permissions and then query the current position.  See the
// Expo documentation for details【503191062379927†L398-L603】.
import * as Location from 'expo-location';
// Expo Notifications API allows us to schedule local notifications.  We'll
// use this to deliver active weather alerts to the user on demand.
import * as Notifications from 'expo-notifications';
// NetInfo allows us to monitor network connectivity and show an offline banner.
import { useNetInfo } from '@react-native-community/netinfo';

// Curated list of national park locations.  Each entry has an id,
// name, latitude and longitude.  See utils/locations.js for details.
import locations from './utils/locations';
import { convertTemperature, getWeatherIcon } from './utils/formatting';
import ForecastCard from './components/ForecastCard';
import LocationDropdown from './components/LocationDropdown';
import DailyBarChart from './components/DailyBarChart';
import ForecastModal from './components/ForecastModal';

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
  // Used to trigger a manual refresh of the forecast.  Each time this
  // counter changes, the data fetching effect will run again.  See
  // onRefresh below.
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);

  // Monitor network connectivity.  The useNetInfo hook from
  // @react-native-community/netinfo returns an object with details about
  // the current network state.  When isConnected is false we know the
  // device is offline and we should display a banner informing the user
  // that cached data is being shown.  See the library documentation on
  // npm for installation and usage【512745355842153†L13-L47】.
  const netInfo = useNetInfo();

  // When the user requests the current location we update the selectedLocation
  // with a special entry representing the device's coordinates.  This
  // function is triggered by the "Use Current Location" button in the UI.
  async function useCurrentLocation() {
    try {
      // Ask for permission to access location in the foreground.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Inform the user that permission was denied.  Because this app does
        // not request background location, we only need foreground access.
        alert('Permission to access location was denied');
        return;
      }
      // Retrieve the current position.  Using default accuracy is fine
      // because the National Weather Service forecasts cover broad areas.
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      // Create a pseudo-location entry with a unique id.  We use the
      // timestamp to avoid collisions and label it "Current Location".
      const curr = {
        id: `current-${Date.now()}`,
        name: 'Current Location',
        lat: latitude,
        lon: longitude,
      };
      // Set the selected location which triggers a fetch via useEffect.
      setSelectedLocation(curr);
      // Clear any existing search results to avoid confusion.
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to get current location', err);
      alert('Unable to determine current location');
    }
  }

  // Send each active alert as a local notification.  We request
  // notification permissions if necessary.  If there are no active
  // alerts the user is informed.  Notifications are scheduled
  // immediately (trigger: null) so they appear right away in the
  // notification tray【920613112976829†L82-L110】.
  async function notifyAlerts() {
    if (!alerts || !alerts.features || alerts.features.length === 0) {
      alert('There are no active alerts for this location.');
      return;
    }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to send notifications was denied');
        return;
      }
      for (const a of alerts.features) {
        const title = a.properties.event || 'Weather Alert';
        const body = (a.properties.headline || a.properties.description || '').slice(0, 200);
        await Notifications.scheduleNotificationAsync({
          content: { title: `Weather Alert: ${title}`, body },
          trigger: null,
        });
      }
      alert('Alert notifications scheduled');
    } catch (err) {
      console.error('Notification error', err);
      alert('Failed to schedule notifications');
    }
  }

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
        // Load the last selected location ID from storage.  If it exists
        // and matches one of our curated locations, set it as the
        // current selection.  Do not persist dynamic current location
        // entries because their coordinates change with each session.
        const lastId = await AsyncStorage.getItem('lastSelectedLocation');
        if (lastId) {
          const found = locations.find((l) => l.id === lastId);
          if (found) {
            setSelectedLocation(found);
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

  // Persist the ID of the currently selected location, except for
  // pseudo dynamic entries representing the device’s current location.
  useEffect(() => {
    (async () => {
      try {
        if (selectedLocation && !selectedLocation.id.startsWith('current-')) {
          await AsyncStorage.setItem(
            'lastSelectedLocation',
            selectedLocation.id
          );
        }
      } catch (err) {
        console.error('Failed to persist selected location', err);
      }
    })();
  }, [selectedLocation]);

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
  }, [selectedLocation, refreshTrigger]);

  // Handler for pull‑to‑refresh gesture.  Increments the refreshTrigger
  // counter which causes the data fetching effect to re‑run.  We set
  // refreshing to true while the refresh is in progress to show the
  // spinner.  Once fetch is done, the effect will reset loading and we
  // stop refreshing.
  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    // Wait until loading state changes back to false.  We poll
    // loading to avoid introducing additional race conditions.
    const checkLoaded = () => {
      if (!loading) {
        setRefreshing(false);
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    checkLoaded();
  };

  // Clear the search input and any existing results.  This is invoked
  // when the user taps the "Clear" button in the search bar.  It resets
  // both the query string and the results array so the list collapses.
  function clearSearch() {
    setSearchQuery('');
    setSearchResults([]);
  }

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
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Offline banner appears when the device has no network connection. */}
      {netInfo && netInfo.isConnected === false && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            You are offline. Displaying cached data.
          </Text>
        </View>
      )}
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
        {/* Show a Clear button only when there is text in the search field */}
        {searchQuery !== '' && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchLocation}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      {/* Button to use the device's current location.  When tapped this
          triggers a permission request and, on success, sets the
          selected location to the current GPS coordinates. */}
      <View style={styles.currentLocationContainer}>
        <TouchableOpacity
          style={styles.currentButton}
          onPress={useCurrentLocation}
        >
          <Text style={styles.currentButtonText}>Use Current Location</Text>
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
      {/* Location selector dropdown */}
      <LocationDropdown
        locations={locations}
        selectedLocation={selectedLocation}
        onSelect={setSelectedLocation}
        favorites={favorites}
        onToggleFavorite={(id) => {
          setFavorites((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
          );
        }}
      />

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
          {/* Button to send all active alerts as local notifications. */}
          <TouchableOpacity
            style={styles.alertButton}
            onPress={notifyAlerts}
          >
            <Text style={styles.alertButtonText}>Notify me of Alerts</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Daily forecast section */}
      <Text style={styles.heading}>Daily Forecast</Text>
      <DailyBarChart periods={daily} unit={unit} />
      <TouchableOpacity
        style={styles.detailButton}
        onPress={() => setDetailVisible(true)}
      >
        <Text style={styles.detailButtonText}>View Detailed</Text>
      </TouchableOpacity>
      <ForecastModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        periods={daily}
        unit={unit}
      />

      {/* Hourly forecast section */}
      <Text style={styles.heading}>Hourly Forecast (Next 12 Hours)</Text>
      {hourly.slice(0, 12).map((p) => (
        <ForecastCard
          key={p.number}
          period={{
            ...p,
            name: new Date(p.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }}
          unit={unit}
        />
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
  error: {
    color: 'red',
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
  // Button inside the alerts card allowing the user to schedule
  // notifications for all current alerts.  Uses the same green colour
  // scheme as other interactive elements.
  alertButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#00704A',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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

  // Container for the "Use Current Location" button.  Adds spacing
  // below the search bar and centres the button horizontally.
  currentLocationContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  // Styling for the current location button.  Uses the same colour
  // palette as the search and toggle buttons for consistency.
  currentButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#00704A',
    borderRadius: 4,
  },
  currentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Button used to clear the search input.  This is shown only when
  // there is a non‑empty query.  Uses a neutral grey palette to
  // differentiate it from the primary search button.
  clearButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#333',
    fontSize: 12,
  },

  detailButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#00704A',
    borderRadius: 4,
    alignSelf: 'center',
  },
  detailButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Banner shown at the top of the screen when there is no network
  // connectivity.  Uses a subtle red tint to indicate that the app
  // is offline and only cached data may be available.
  offlineBanner: {
    backgroundColor: '#FFEBE8',
    borderColor: '#E99A9A',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  offlineText: {
    color: '#A94442',
    textAlign: 'center',
  },
});