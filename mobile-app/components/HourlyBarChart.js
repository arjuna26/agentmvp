import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { convertTemperature, getWeatherIcon } from '../utils/formatting';

export default function HourlyBarChart({ periods = [], unit }) {
  if (!periods.length) return null;
  
  const hours = periods.slice(0, 24).map((p) => {
    const date = new Date(p.startTime);
    const isNow = Math.abs(date - new Date()) < 30 * 60 * 1000; // Within 30 minutes
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
            <Text style={styles.weatherIcon}>{h.icon}</Text>
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
    paddingHorizontal: 8,
  },
  hourContainer: {
    alignItems: 'center',
    marginHorizontal: 6,
    minWidth: 50,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  nowContainer: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
  },
  timeLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
  },
  nowLabel: {
    color: '#60a5fa',
    fontWeight: '700',
  },
  weatherIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  tempLabel: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 8,
  },
  nowTemp: {
    fontWeight: '700',
    color: '#60a5fa',
  },
  barContainer: {
    width: 4,
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  temperatureBar: {
    width: 4,
    backgroundColor: 'rgba(148,163,184,0.6)',
    borderRadius: 2,
  },
  nowBar: {
    backgroundColor: '#60a5fa',
  },
});
