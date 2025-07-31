import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { convertTemperature } from '../utils/formatting';

export default function HourlyBarChart({ periods = [], unit }) {
  if (!periods.length) return null;
  const hours = periods.slice(0, 24).map((p) => ({
    time: new Date(p.startTime).toLocaleTimeString([], { hour: '2-digit' }),
    temp: convertTemperature(p.temperature, p.temperatureUnit, unit),
  }));
  const temps = hours.map((h) => h.temp);
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const range = max - min || 1;
  const chartHeight = 120;
  return (
    <View style={styles.chartContainer}>
      {hours.map((h, idx) => {
        const height = ((h.temp - min) / range) * chartHeight;
        return (
          <View key={idx} style={styles.group}>
            <View style={[styles.bar, { height }]} />
            <Text style={styles.label}>{h.time}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  group: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: 6,
    backgroundColor: '#bb86fc',
  },
  label: {
    fontSize: 10,
    color: '#FFFFFF',
  },
});
