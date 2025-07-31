import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function ForecastCard({ period, unit }) {
  if (!period) return null;
  const temp = convertTemperature(period.temperature, period.temperatureUnit, unit);
  const icon = getWeatherIcon(period.shortForecast);
  return (
    <Card style={styles.card} mode="contained">
      <Card.Content>
        <Text style={styles.period}>{period.name}</Text>
        <Text style={styles.temp}>{temp}°{unit}</Text>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.desc}>{period.shortForecast}</Text>
        {period.windSpeed && (
          <Text style={styles.detail}>Wind: {period.windSpeed} {period.windDirection}</Text>
        )}
        {period.probabilityOfPrecipitation && period.probabilityOfPrecipitation.value !== null && (
          <Text style={styles.detail}>Precipitation: {period.probabilityOfPrecipitation.value}%</Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  period: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  temp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  icon: {
    fontSize: 20,
    marginRight: 6,
  },
  desc: {
    flexShrink: 1,
    color: '#CCCCCC',
  },
  detail: {
    color: '#CCCCCC',
    marginTop: 2,
  },
});
