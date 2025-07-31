import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
    days.push({ date, high, low, icon: emoji, dayName: day.name });
  }

  const allTemps = [
    ...days.map(d => d.high),
    ...days.filter(d => d.low !== null).map(d => d.low)
  ];
  const maxTemp = Math.max(...allTemps);
  const minTemp = Math.min(...allTemps);
  const tempRange = maxTemp - minTemp || 1;
  const chartHeight = 80;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {days.map((d, idx) => {
        const isToday = idx === 0;
        const highHeight = ((d.high - minTemp) / tempRange) * chartHeight;
        const lowHeight = d.low !== null ? ((d.low - minTemp) / tempRange) * chartHeight : 0;
        
        return (
          <View key={idx} style={[styles.dayContainer, isToday && styles.todayContainer]}>
            <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
              {isToday ? 'Today' : d.date}
            </Text>
            <View style={styles.iconContainer}>
              {d.icon}
            </View>
            
            <View style={styles.temperatureContainer}>
              <Text style={[styles.highTemp, isToday && styles.todayTemp]}>
                {d.high}°
              </Text>
              
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.temperatureBar,
                    { height: Math.max(highHeight - lowHeight, 8) },
                    isToday && styles.todayBar
                  ]} 
                />
              </View>
              
              {d.low !== null && (
                <Text style={[styles.lowTemp, isToday && styles.todayTemp]}>
                  {d.low}°
                </Text>
              )}
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
  dayContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 60,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  todayContainer: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
  },
  dayLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
  },
  todayLabel: {
    color: '#60a5fa',
    fontWeight: '700',
  },
  iconContainer: {
    marginBottom: 12,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  temperatureContainer: {
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  highTemp: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 8,
  },
  lowTemp: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 8,
  },
  todayTemp: {
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
  todayBar: {
    backgroundColor: '#60a5fa',
  },
});
