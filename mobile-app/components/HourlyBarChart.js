import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function HourlyBarChart({ periods = [], unit }) {
  if (!periods.length) return null;

  const hours = periods.slice(0, 24).map((p) => {
    const date = new Date(p.startTime);
    const isNow = Math.abs(date - new Date()) < 30 * 60 * 1000;
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit' }),
      temp: convertTemperature(p.temperature, p.temperatureUnit, unit),
      icon: getWeatherIcon(p.shortForecast),
      isNow,
    };
  });

  const temps = hours.map((h) => h.temp);
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const range = max - min || 1;
  const chartHeight = 80;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {hours.map((h, idx) => {
        const height = Math.max(((h.temp - min) / range) * chartHeight, 8);
        return (
          <View key={idx} style={[styles.hourContainer, h.isNow && styles.nowContainer]}>
            <Text style={[styles.timeLabel, h.isNow && styles.nowLabel]}>
              {h.isNow ? 'Now' : h.time}
            </Text>
            <View style={styles.iconContainer}>
              {h.icon}
            </View>
            <Text style={[styles.tempLabel, h.isNow && styles.nowTemp]}>
              {h.temp}°
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.temperatureBar,
                  { height },
                  h.isNow && styles.nowBar
                ]}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 10,
  },
  hourContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 55,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  nowContainer: {
    backgroundColor: 'rgba(59,130,246,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  timeLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  nowLabel: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 12,
    textShadowColor: 'rgba(59,130,246,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  iconContainer: {
    marginBottom: 10,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  weatherIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  tempLabel: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  nowTemp: {
    fontWeight: '700',
    color: '#60a5fa',
    textShadowColor: 'rgba(59,130,246,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  barContainer: {
    width: 5,
    height: 85,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(148,163,184,0.15)',
    borderRadius: 3,
  },
  temperatureBar: {
    width: 5,
    backgroundColor: 'rgba(148,163,184,0.7)',
    borderRadius: 3,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  nowBar: {
    backgroundColor: '#60a5fa',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});
