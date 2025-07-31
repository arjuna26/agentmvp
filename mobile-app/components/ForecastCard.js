import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function ForecastCard({ period, unit, viewMode }) {
  if (!period) return null;
  const temp = convertTemperature(period.temperature, period.temperatureUnit, unit);
  const icon = getWeatherIcon(period.shortForecast);
  
  // Format the timestamp for hourly view
  const formatTimestamp = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // For hourly view, show time range
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

  // Format the date for hourly view primary header
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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.period}>{primaryHeader}</Text>
          {secondaryHeader && (
            <Text style={styles.timestamp}>{secondaryHeader}</Text>
          )}
        </View>
        <View style={styles.tempContainer}>
          <View style={styles.iconContainer}>
            {icon}
          </View>
          <Text style={styles.temp}>{temp}°{unit}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{period.shortForecast}</Text>
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30,41,59,0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    backdropFilter: 'blur(16px)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
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
});
