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
  Dimensions,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getForecast,
  getHourlyForecast,
  getAlerts,
} from './utils/weatherApi';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useNetInfo } from '@react-native-community/netinfo';

import locations from './utils/locations';
import { convertTemperature, getWeatherIcon } from './utils/formatting';
import ForecastCard from './components/ForecastCard';
import LocationDropdown from './components/LocationDropdown';
import DailyBarChart from './components/DailyBarChart';
import ForecastModal from './components/ForecastModal';
import HourlyBarChart from './components/HourlyBarChart';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [daily, setDaily] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [unit, setUnit] = useState('F');

  const netInfo = useNetInfo();

  async function useCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      const curr = {
        id: `current-${Date.now()}`,
        name: 'Current Location',
        lat: latitude,
        lon: longitude,
      };
      setSelectedLocation(curr);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to get current location', err);
      alert('Unable to determine current location');
    }
  }

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

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (err) {
        console.error('Failed to save favourites to storage', err);
      }
    })();
  }, [favorites]);

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

  async function searchLocation() {
    const query = searchQuery.trim();
    if (!query) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=5`;
      const resp = await fetch(url, {
        headers: {
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

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
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

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    const checkLoaded = () => {
      if (!loading) {
        setRefreshing(false);
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    checkLoaded();
  };

  function clearSearch() {
    setSearchQuery('');
    setSearchResults([]);
  }

  const currentWeather = daily && daily[0];
  const currentTemp = currentWeather ? convertTemperature(currentWeather.temperature, currentWeather.temperatureUnit, unit) : null;

  function ForecastView({ mode }) {
    const [detailVisibleLocal, setDetailVisibleLocal] = useState(false);
    const isDaily = mode === 'daily';
    const periods = isDaily ? daily : hourly;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
      >
        {netInfo && netInfo.isConnected === false && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineIcon}>📡</Text>
            <Text style={styles.offlineText}>Offline - Showing cached data</Text>
          </View>
        )}

        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.locationName}>{selectedLocation.name}</Text>
            {currentTemp && (
              <>
                <Text style={styles.currentTemp}>{currentTemp}°{unit}</Text>
                <Text style={styles.weatherCondition}>{currentWeather.shortForecast}</Text>
                <Text style={styles.weatherIcon}>{getWeatherIcon(currentWeather.shortForecast)}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchLocation}
                returnKeyType="search"
              />
              {searchQuery !== '' && (
                <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.currentLocationButton} onPress={useCurrentLocation}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.currentLocationText}>Use Current Location</Text>
          </TouchableOpacity>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
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
                    style={[styles.searchResultItem, isSelected && styles.selectedSearchResult]}
                  >
                    <Text style={[styles.searchResultText, isSelected && styles.selectedSearchResultText]}>
                      {res.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.unitToggle}>
            {['F', 'C'].map((u) => {
              const selected = unit === u;
              return (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitButton, selected && styles.selectedUnitButton]}
                >
                  <Text style={[styles.unitButtonText, selected && styles.selectedUnitButtonText]}>
                    °{u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

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
        </View>

        {alerts && alerts.features && alerts.features.length > 0 && (
          <View style={styles.section}>
            <View style={styles.alertsContainer}>
              <View style={styles.alertsHeader}>
                <Text style={styles.alertsIcon}>⚠️</Text>
                <Text style={styles.sectionTitle}>Active Weather Alerts</Text>
              </View>
              {alerts.features.map((a, idx) => (
                <View key={idx} style={styles.alertCard}>
                  <Text style={styles.alertTitle}>{a.properties.event}</Text>
                  <Text style={styles.alertDescription}>
                    {a.properties.headline || a.properties.description}
                  </Text>
                </View>
              ))}
              <TouchableOpacity style={styles.alertButton} onPress={notifyAlerts}>
                <Text style={styles.alertButtonIcon}>🔔</Text>
                <Text style={styles.alertButtonText}>Get Alert Notifications</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{isDaily ? '📅' : '⏰'}</Text>
            <Text style={styles.sectionTitle}>{isDaily ? '7-Day Forecast' : 'Hourly Forecast'}</Text>
          </View>
          <View style={styles.chartContainer}>
            {isDaily ? (
              <DailyBarChart periods={daily} unit={unit} />
            ) : (
              <HourlyBarChart periods={hourly} unit={unit} />
            )}
          </View>
          <TouchableOpacity style={styles.viewDetailButton} onPress={() => setDetailVisibleLocal(true)}>
            <Text style={styles.viewDetailButtonText}>View Detailed Forecast</Text>
            <Text style={styles.viewDetailButtonIcon}>→</Text>
          </TouchableOpacity>
        </View>

        <ForecastModal
          visible={detailVisibleLocal}
          onClose={() => setDetailVisibleLocal(false)}
          periods={periods}
          unit={unit}
        />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Weather Unavailable</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => setRefreshTrigger(prev => prev + 1)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading || !daily || !hourly) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen
          name="Daily"
          options={{ tabBarIcon: () => <Text>📅</Text> }}
        >{() => <ForecastView mode="daily" />}</Tab.Screen>
        <Tab.Screen
          name="Hourly"
          options={{ tabBarIcon: () => <Text>⏰</Text> }}
        >{() => <ForecastView mode="hourly" />}</Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: '#FFE4B5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  offlineText: {
    color: '#B8860B',
    fontSize: 14,
    fontWeight: '500',
  },
  heroSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#4A90E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroContent: {
    padding: 32,
    alignItems: 'center',
  },
  locationName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  currentTemp: {
    fontSize: 64,
    color: '#FFFFFF',
    fontWeight: '200',
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 18,
    color: '#E6F2FF',
    fontWeight: '500',
    marginBottom: 8,
  },
  weatherIcon: {
    fontSize: 32,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  currentLocationText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  searchResultItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectedSearchResult: {
    backgroundColor: '#4A90E2',
  },
  searchResultText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  selectedSearchResultText: {
    color: '#FFFFFF',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-end',
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  selectedUnitButton: {
    backgroundColor: '#4A90E2',
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  selectedUnitButtonText: {
    color: '#FFFFFF',
  },
  alertsContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertsIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  alertButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewDetailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  viewDetailButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hourlyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
});
