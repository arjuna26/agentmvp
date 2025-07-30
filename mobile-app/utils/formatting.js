// Utility functions for formatting weather data

export function convertTemperature(value, fromUnit, toUnit) {
  if (value === undefined || value === null) return value;
  if (fromUnit === toUnit) return Math.round(value);
  if (fromUnit === 'F' && toUnit === 'C') {
    return Math.round(((value - 32) * 5) / 9);
  }
  if (fromUnit === 'C' && toUnit === 'F') {
    return Math.round((value * 9) / 5 + 32);
  }
  return Math.round(value);
}

export function getWeatherIcon(description = '') {
  const text = description.toLowerCase();
  if (/(sunny|clear)/.test(text)) return '☀️';
  if (/(partly cloudy|mostly cloudy|cloudy|overcast)/.test(text)) return '⛅️';
  if (/(rain|showers|drizzle)/.test(text)) return '🌧️';
  if (/(thunder|storm)/.test(text)) return '⛈️';
  if (/(snow|flurries|blizzard)/.test(text)) return '❄️';
  if (/(fog|mist|haze)/.test(text)) return '🌫️';
  return '🌡️';
}
