import { convertTemperature, getWeatherEmoji } from '../utils/formatting';

describe('convertTemperature', () => {
  test('returns value unchanged when units match', () => {
    expect(convertTemperature(70, 'F', 'F')).toBe(70);
  });

  test('converts Fahrenheit to Celsius', () => {
    expect(convertTemperature(32, 'F', 'C')).toBe(0);
  });

  test('converts Celsius to Fahrenheit', () => {
    expect(convertTemperature(0, 'C', 'F')).toBe(32);
  });

  test('handles undefined value', () => {
    expect(convertTemperature(undefined, 'F', 'C')).toBeUndefined();
  });
});

describe('getWeatherEmoji', () => {
  test('returns emoji for sunny conditions', () => {
    expect(getWeatherEmoji('Sunny')).toBe('☀️');
  });

  test('returns emoji for cloudy conditions', () => {
    expect(getWeatherEmoji('Mostly Cloudy')).toBe('⛅️');
  });

  test('returns generic emoji when unrecognized', () => {
    expect(getWeatherEmoji('Alien Weather')).toBe('🌡️');
  });
});
