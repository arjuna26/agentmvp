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

  const highs = days.map((d) => d.high);
  const lows = days.filter((d) => d.low !== null).map((d) => d.low);
  const maxHigh = Math.max(...highs);
  const minHigh = Math.min(...highs);
  const rangeHigh = maxHigh - minHigh || 1;
  const maxLow = lows.length ? Math.max(...lows) : 0;
  const minLow = lows.length ? Math.min(...lows) : 0;
  const rangeLow = maxLow - minLow || 1;
  const chartHeight = 120;

  return (
    <View style={styles.chartContainer}>
      {days.map((d, idx) => {
        const highHeight = ((d.high - minHigh) / rangeHigh) * chartHeight;
        const lowHeight = d.low !== null ? ((d.low - minLow) / rangeLow) * chartHeight : 0;
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
    marginHorizontal: 4,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
  },
  highBar: {
    width: 10,
    marginHorizontal: 1,
    backgroundColor: '#FF7043',
  },
  lowBar: {
    width: 10,
    marginHorizontal: 1,
    backgroundColor: '#4A90E2',
  },
  label: {
    fontSize: 12,
    color: '#333',
  },
});
