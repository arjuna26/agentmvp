import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function ForecastCard({ period, unit, viewMode, compact = false }) {
  if (!period) return null;
  const temp = convertTemperature(period.temperature, period.temperatureUnit, unit);
  const icon = getWeatherIcon(period.shortForecast);

  const formatTimestamp = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const startTime12 = start.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const endTime12 = end.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${startTime12} - ${endTime12}`;
  };

  const formatDate = (startTime) => {
    const start = new Date(startTime);
    return start.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const isHourly = viewMode === 'hourly';
  const primaryHeader = isHourly ? formatTimestamp(period.startTime, period.endTime) : period.name;
  const secondaryHeader = isHourly ? formatDate(period.startTime) : null;

  return (
    <View style={compact ? styles.compactCard : styles.card}>
      <View style={compact ? styles.compactHeader : styles.header}>
        <View style={styles.titleSection}>
          <Text style={compact ? styles.compactPeriod : styles.period}>{primaryHeader}</Text>
          {secondaryHeader && !compact && (
            <Text style={styles.timestamp}>{secondaryHeader}</Text>
          )}
        </View>
        <View style={styles.tempContainer}>
          <View style={compact ? styles.compactIconContainer : styles.iconContainer}>
            {icon}
          </View>
          <Text style={compact ? styles.compactTemp : styles.temp}>{temp}°{unit}</Text>
        </View>
      </View>

      <Text style={compact ? styles.compactDescription : styles.description}>{period.shortForecast}</Text>

      {!compact && (
        <View style={styles.details}>
          {period.windSpeed && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Wind</Text>
              <Text style={styles.detailValue}>{period.windSpeed} {period.windDirection}</Text>
            </View>
          )}
          {period.probabilityOfPrecipitation && period.probabilityOfPrecipitation.value !== null && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Precipitation</Text>
              <Text style={styles.detailValue}>{period.probabilityOfPrecipitation.value}%</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderRadius: 28,
    padding: 28,
    marginBottom: 24,
    backdropFilter: 'blur(25px)',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.25)',
    elevation: 25,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  period: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  timestamp: {
    fontSize: 13,
    color: '#60a5fa',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  icon: {
    fontSize: 28,
    marginRight: 8,
  },
  temp: {
    fontSize: 28,
    fontWeight: '600',
    color: '#60a5fa',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(59,130,246,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 17,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,130,246,0.1)',
  },
  detailItem: {
    flex: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Compact styles for smaller cards
  compactCard: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backdropFilter: 'blur(25px)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    elevation: 15,
    position: 'relative',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactPeriod: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  compactIconContainer: {
    marginLeft: 8,
    marginRight: 8,
  },
  compactTemp: {
    fontSize: 20,
    fontWeight: '800',
    color: '#60a5fa',
    letterSpacing: 0.3,
  },
  compactDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
});
