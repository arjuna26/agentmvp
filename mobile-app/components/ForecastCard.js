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
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  period: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '500',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  temp: {
    fontSize: 24,
    fontWeight: '600',
    color: '#60a5fa',
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 22,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },
});
