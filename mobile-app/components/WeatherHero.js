import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function WeatherHero({ currentWeather, selectedLocation, unit, hourly }) {
  if (!selectedLocation) {
    return (
      <View style={styles.heroContainer}>
        <Text style={styles.locationName}>Loading...</Text>
      </View>
    );
  }

  // Use the current hour's data for real current conditions
  // Find the hour that's closest to now
  const currentConditions = hourly && hourly.length > 0 ? 
    hourly.find(hour => {
      const hourTime = new Date(hour.startTime);
      const now = new Date();
      const timeDiff = Math.abs(now - hourTime);
      return timeDiff <= 30 * 60 * 1000; // Within 30 minutes
    }) || hourly[0] // Fallback to first hour if no close match
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
      
      <View style={styles.weatherSection}>
        <View style={styles.iconContainer}>
          {weatherIcon}
        </View>
        <Text style={styles.currentTemp}>{currentTemp}°</Text>
        <Text style={styles.tempUnit}>{unit}</Text>
      </View>
      
      <View style={styles.conditionSection}>
        <Text style={styles.weatherCondition}>{currentConditions.shortForecast}</Text>
        <Text style={styles.timeLabel}>
          {hourly && hourly.length > 0 ? 'Current conditions' : 'Today\'s forecast'}
        </Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <Ionicons name="flag" size={14} color="#94a3b8" />
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>{currentConditions.windSpeed || 'N/A'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="compass" size={14} color="#94a3b8" />
          <Text style={styles.detailLabel}>Direction</Text>
          <Text style={styles.detailValue}>{currentConditions.windDirection || 'N/A'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    padding: 24,
    margin: 16,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 24,
    alignItems: 'center',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#60a5fa',
  },
  locationName: {
    fontSize: 18,
    color: '#f8fafc',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 250,
    marginLeft: 8,
  },
  weatherSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  currentTemp: {
    fontSize: 72,
    color: '#f8fafc',
    fontWeight: '200',
    lineHeight: 72,
  },
  tempUnit: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: '300',
    marginLeft: 4,
  },
  conditionSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherCondition: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 20,
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,130,246,0.2)',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '600',
  },
});
