import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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

export function getWeatherIcon(description = '', size = 24, color = '#60a5fa') {
  const text = description.toLowerCase();
  
  if (/(sunny|clear)/.test(text)) {
    return <Ionicons name="sunny" size={size} color="#fbbf24" />;
  }
  if (/(partly cloudy|mostly cloudy)/.test(text)) {
    return <Ionicons name="partly-sunny" size={size} color="#60a5fa" />;
  }
  if (/(cloudy|overcast)/.test(text)) {
    return <Ionicons name="cloudy" size={size} color="#9ca3af" />;
  }
  if (/(rain|showers|drizzle)/.test(text)) {
    return <Ionicons name="rainy" size={size} color="#3b82f6" />;
  }
  if (/(thunder|storm)/.test(text)) {
    return <Ionicons name="thunderstorm" size={size} color="#7c3aed" />;
  }
  if (/(snow|flurries|blizzard)/.test(text)) {
    return <Ionicons name="snow" size={size} color="#e5e7eb" />;
  }
  if (/(fog|mist|haze)/.test(text)) {
    return <MaterialCommunityIcons name="weather-fog" size={size} color="#9ca3af" />;
  }
  
  // Default weather icon
  return <Ionicons name="partly-sunny" size={size} color={color} />;
}

// For backward compatibility - returns emoji string
export function getWeatherEmoji(description = '') {
  const text = description.toLowerCase();
  if (/(sunny|clear)/.test(text)) return '☀️';
  if (/(partly cloudy|mostly cloudy|cloudy|overcast)/.test(text)) return '⛅️';
  if (/(rain|showers|drizzle)/.test(text)) return '🌧️';
  if (/(thunder|storm)/.test(text)) return '⛈️';
  if (/(snow|flurries|blizzard)/.test(text)) return '❄️';
  if (/(fog|mist|haze)/.test(text)) return '🌫️';
  return '🌡️';
}
