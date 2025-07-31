import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function WeatherHero({ currentWeather, selectedLocation, unit, hourly }) {
  if (!selectedLocation) {
    return (
      <View style={styles.heroContainer}>
        <Text style={styles.locationName}>Loading...</Text>
      </View>
    );
  }

  // Use the first hour's data for current conditions, fall back to daily
  const currentConditions = hourly && hourly[0] ? hourly[0] : currentWeather;
  
  if (!currentConditions) {
    return (
      <View style={styles.heroContainer}>
        <View style={styles.locationSection}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationName} numberOfLines={2}>
            {selectedLocation.name}
          </Text>
        </View>
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  const currentTemp = convertTemperature(
    currentConditions.temperature,
    currentConditions.temperatureUnit,
    unit
  );

  const weatherIcon = getWeatherIcon(currentConditions.shortForecast);

  return (
    <View style={styles.heroContainer}>
      <View style={styles.locationSection}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationName} numberOfLines={2}>
          {selectedLocation.name}
        </Text>
      </View>
      
      <View style={styles.weatherSection}>
        <Text style={styles.weatherIcon}>{weatherIcon}</Text>
        <Text style={styles.currentTemp}>{currentTemp}°</Text>
        <Text style={styles.tempUnit}>{unit}</Text>
      </View>
      
      <View style={styles.conditionSection}>
        <Text style={styles.weatherCondition}>{currentConditions.shortForecast}</Text>
        <Text style={styles.timeLabel}>
          {hourly && hourly[0] ? 'Current conditions' : 'Today\'s forecast'}
        </Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>{currentConditions.windSpeed || 'N/A'}</Text>
        </View>
        <View style={styles.detailItem}>
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
  },
  weatherSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
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
  },
  detailValue: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '600',
  },
});
