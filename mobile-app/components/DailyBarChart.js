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
    paddingHorizontal: 12,
  },
  dayContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
    minWidth: 65,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  todayContainer: {
    backgroundColor: 'rgba(59,130,246,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  dayLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  todayLabel: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 13,
  },
  iconContainer: {
    marginBottom: 14,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  weatherIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  temperatureContainer: {
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'space-between',
  },
  highTemp: {
    fontSize: 17,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  lowTemp: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 10,
    letterSpacing: 0.2,
  },
  todayTemp: {
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
  todayBar: {
    backgroundColor: '#60a5fa',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});
