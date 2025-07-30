import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function DailyBarChart({ periods = [], unit }) {
  if (!periods.length) return null;

  // Pair daytime and nighttime periods
  const days = [];
  for (let i = 0; i < periods.length; i += 2) {
    const day = periods[i];
    const night = periods[i + 1];
    if (!day) continue;
    const date = new Date(day.startTime).toLocaleDateString(undefined, {
      weekday: 'short',
    });
    const high = convertTemperature(day.temperature, day.temperatureUnit, unit);
    const low = night
      ? convertTemperature(night.temperature, night.temperatureUnit, unit)
      : null;
    const emoji = getWeatherIcon(day.shortForecast);
    days.push({ date, high, low, emoji });
  }

  const temps = days
    .flatMap((d) => [d.high, d.low])
    .filter((v) => v !== null);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const range = maxTemp - minTemp || 1;
  const chartHeight = 120;

  return (
    <View style={styles.chartContainer}>
      {days.map((d, idx) => {
        const highHeight = ((d.high - minTemp) / range) * chartHeight;
        const lowHeight = d.low !== null ? ((d.low - minTemp) / range) * chartHeight : 0;
        return (
          <View key={idx} style={styles.group}>
            <View style={styles.bars}>
              <View style={[styles.highBar, { height: highHeight }]} />
              <View style={[styles.lowBar, { height: lowHeight }]} />
            </View>
            <Text style={styles.label}>{d.date}</Text>
            <Text>{d.emoji}</Text>
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
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
  },
  highBar: {
    width: 8,
    marginHorizontal: 1,
    backgroundColor: '#E64A19',
  },
  lowBar: {
    width: 8,
    marginHorizontal: 1,
    backgroundColor: '#1976D2',
  },
  label: {
    fontSize: 12,
  },
});
