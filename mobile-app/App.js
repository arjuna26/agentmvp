import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './utils/supabase';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';

import { getForecast, getHourlyForecast, getAlerts } from './utils/weatherApi';
import locations from './utils/locations';
import ForecastScreen from './screens/ForecastScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    secondary: '#60a5fa',
    surface: '#1e293b',
    background: '#1e293b',
    onSurface: '#f8fafc',
    onBackground: '#f8fafc',
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [session, setSession] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [favorites, setFavorites] = useState([]);
  const [daily, setDaily] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [unit, setUnit] = useState('F');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    async function loadStoredData() {
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
        console.error('Failed to load data from storage', err);
      }
    }
    loadStoredData();
  }, []);

  useEffect(() => {
    async function saveFavorites() {
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (err) {
        console.error('Failed to save favorites to storage', err);
      }
    }
    saveFavorites();
  }, [favorites]);

  useEffect(() => {
    async function saveSelectedLocation() {
      try {
        if (selectedLocation && !selectedLocation.id.startsWith('current-')) {
          await AsyncStorage.setItem('lastSelectedLocation', selectedLocation.id);
        }
      } catch (err) {
        console.error('Failed to persist selected location', err);
      }
    }
    saveSelectedLocation();
  }, [selectedLocation]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      const dailyKey = `daily-${selectedLocation.id}`;
      const hourlyKey = `hourly-${selectedLocation.id}`;

      try {
        const [cachedDaily, cachedHourly] = await Promise.all([
          AsyncStorage.getItem(dailyKey),
          AsyncStorage.getItem(hourlyKey),
        ]);

        if (!cancelled) {
          if (cachedDaily) {
            try {
              setDaily(JSON.parse(cachedDaily));
            } catch {}
          }
          if (cachedHourly) {
            try {
              setHourly(JSON.parse(cachedHourly));
            } catch {}
          }
        }
      } catch (err) {
        console.error('Error loading cached forecast', err);
      }

      try {
        const { lat, lon } = selectedLocation;
        const [dailyResp, hourlyResp, alertsResp] = await Promise.all([
          getForecast(lat, lon),
          getHourlyForecast(lat, lon),
          getAlerts(lat, lon),
        ]);

        if (!cancelled) {
          const newDaily = dailyResp.properties.periods;
          const newHourly = hourlyResp.properties.periods;

          setDaily(newDaily);
          setHourly(newHourly);
          setAlerts(alertsResp);

          try {
            await AsyncStorage.setItem(dailyKey, JSON.stringify(newDaily));
            await AsyncStorage.setItem(hourlyKey, JSON.stringify(newHourly));
          } catch (err) {
            console.error('Failed to cache forecast data', err);
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

    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  if (error) {
    return (
      <SafeAreaProvider>
      <PaperProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
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
      </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // Loading state
  if (loading && !daily && !hourly) {
    return (
      <SafeAreaProvider>
      <PaperProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </PaperProvider>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignupScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  // Main app
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <PaperProvider theme={theme}>
        <NavigationContainer theme={theme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: '#60a5fa',
              tabBarInactiveTintColor: '#94a3b8',
              tabBarLabelStyle: styles.tabBarLabel,
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Forecast') {
                  iconName = focused ? 'cloud' : 'cloud-outline';
                } else if (route.name === 'Favorites') {
                  iconName = focused ? 'heart' : 'heart-outline';
                } else if (route.name === 'Profile') {
                  iconName = focused ? 'person' : 'person-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Forecast">
              {() => (
                <ForecastScreen
                  selectedLocation={selectedLocation}
                  setSelectedLocation={setSelectedLocation}
                  daily={daily}
                  hourly={hourly}
                  alerts={alerts}
                  unit={unit}
                  setUnit={setUnit}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  notifyAlerts={notifyAlerts}
                  useCurrentLocation={useCurrentLocation}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Favorites" component={FavoritesScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0f172a',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 28,
    color: '#f8fafc',
    marginBottom: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  errorMessage: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '400',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 24,
    fontSize: 18,
    color: '#f8fafc',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabBar: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,130,246,0.15)',
    elevation: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingBottom: 8,
    paddingTop: 8,
    height: 75,
    backdropFilter: 'blur(20px)',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
});
