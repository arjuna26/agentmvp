import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNetInfo } from '@react-native-community/netinfo';
import LocationSearch from '../components/LocationSearch';
import WeatherHero from '../components/WeatherHero';
import DailyBarChart from '../components/DailyBarChart';
import HourlyBarChart from '../components/HourlyBarChart';
import ForecastModal from '../components/ForecastModal';
import WeatherAlerts from '../components/WeatherAlerts';

export default function ForecastScreen({
  selectedLocation,
  setSelectedLocation,
  daily,
  hourly,
  alerts,
  unit,
  setUnit,
  refreshing,
  onRefresh,
  notifyAlerts,
  useCurrentLocation,
}) {
  const [viewMode, setViewMode] = useState('daily');
  const [detailVisible, setDetailVisible] = useState(false);
  const netInfo = useNetInfo();

  const currentWeather = daily && daily[0];
  const periods = viewMode === 'daily' ? daily : hourly;

  const getGradientColors = () => {
    // Dark theme with blue gradient accents
    if (!currentWeather) return ['#0f172a', '#1e293b', '#334155'];
    
    const condition = currentWeather.shortForecast.toLowerCase();
    if (condition.includes('sunny') || condition.includes('clear')) {
      return ['#1e293b', '#3b82f6', '#60a5fa'];
    }
    if (condition.includes('rain') || condition.includes('storm')) {
      return ['#0f172a', '#1e40af', '#3730a3'];
    }
    if (condition.includes('snow')) {
      return ['#374151', '#6b7280', '#9ca3af'];
    }
    if (condition.includes('cloud')) {
      return ['#1f2937', '#4b5563', '#6b7280'];
    }
    return ['#0f172a', '#1e293b', '#334155'];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={getGradientColors()} style={styles.gradient}>
        {netInfo && netInfo.isConnected === false && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineIcon}>📡</Text>
            <Text style={styles.offlineText}>Offline - Showing cached data</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
              progressBackgroundColor="#1e293b"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <LocationSearch
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            useCurrentLocation={useCurrentLocation}
            unit={unit}
            setUnit={setUnit}
          />

          <WeatherHero
            currentWeather={currentWeather}
            selectedLocation={selectedLocation}
            unit={unit}
            hourly={hourly}
          />

          <WeatherAlerts
            alerts={alerts}
            notifyAlerts={notifyAlerts}
          />

          <View style={styles.forecastSection}>
            <View style={styles.forecastHeader}>
              <Text style={styles.sectionTitle}>
                {viewMode === 'daily' ? '7-Day' : '24-Hour'}
              </Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    viewMode === 'daily' && styles.activeToggle,
                  ]}
                  onPress={() => setViewMode('daily')}
                >
                  <Text
                    style={[
                      styles.toggleLabel,
                      viewMode === 'daily' && styles.toggleLabelActive,
                    ]}
                  >
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    viewMode === 'hourly' && styles.activeToggle,
                  ]}
                  onPress={() => setViewMode('hourly')}
                >
                  <Text
                    style={[
                      styles.toggleLabel,
                      viewMode === 'hourly' && styles.toggleLabelActive,
                    ]}
                  >
                    Hourly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.chartContainer}>
              {viewMode === 'daily' ? (
                <DailyBarChart periods={daily} unit={unit} />
              ) : (
                <HourlyBarChart periods={hourly} unit={unit} />
              )}
            </View>

            <Button
              mode="outlined"
              style={styles.detailButton}
              onPress={() => setDetailVisible(true)}
              labelStyle={styles.detailButtonLabel}
            >
              View Detailed Forecast →
            </Button>
          </View>
        </ScrollView>

        <ForecastModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          periods={periods}
          unit={unit}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  offlineBanner: {
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  offlineIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#f87171',
  },
  offlineText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  forecastSection: {
    margin: 16,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 20,
    padding: 20,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeToggle: {
    backgroundColor: 'rgba(59,130,246,0.8)',
  },
  toggleLabel: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleLabelActive: {
    color: '#f8fafc',
  },
  chartContainer: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.1)',
  },
  detailButton: {
    alignSelf: 'center',
    borderColor: 'rgba(59,130,246,0.6)',
  },
  detailButtonLabel: {
    color: '#60a5fa',
    fontWeight: '600',
  },
});
