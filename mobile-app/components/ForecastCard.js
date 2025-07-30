import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function ForecastCard({ period, unit }) {
  if (!period) return null;
  const temp = convertTemperature(period.temperature, period.temperatureUnit, unit);
  const icon = getWeatherIcon(period.shortForecast);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.period}>{period.name}</Text>
        <Text style={styles.temp}>{temp}°{unit}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.desc}>{period.shortForecast}</Text>
      </View>
      {period.windSpeed && (
        <Text style={styles.detail}>Wind: {period.windSpeed} {period.windDirection}</Text>
      )}
      {period.probabilityOfPrecipitation && period.probabilityOfPrecipitation.value !== null && (
        <Text style={styles.detail}>Precipitation: {period.probabilityOfPrecipitation.value}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  period: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: '#1C1C1E',
  },
  temp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  icon: {
    fontSize: 20,
    marginRight: 6,
  },
  desc: {
    flexShrink: 1,
    color: '#3C3C43',
  },
  detail: {
    color: '#3C3C43',
    marginTop: 2,
  },
});
