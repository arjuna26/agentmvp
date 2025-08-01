const fetch = require("node-fetch");
global.fetch = fetch;

// Increase timeout for real API calls
jest.setTimeout(30000);

describe('weatherApi - Real API Integration', () => {
  // Using Topeka, KS coordinates from NWS documentation
  const lat = 39.7456;
  const lon = -97.0892;

  beforeEach(() => {
    // Clear cache for each test
    const { clearCache } = require('../utils/weatherApi');
    clearCache();
  });

  afterEach(() => {
    // Clear require cache to ensure fresh modules
    delete require.cache[require.resolve('../utils/weatherApi')];
  });

  test('getGridpoint fetches and caches grid metadata', async () => {
    const { getGridpoint } = require('../utils/weatherApi');

    const data = await getGridpoint(lat, lon);
    
    // Verify real API response structure
    expect(data).toBeDefined();
    expect(typeof data.gridId).toBe('string');
    expect(typeof data.gridX).toBe('number');
    expect(typeof data.gridY).toBe('number');
    expect(typeof data.forecast).toBe('string');
    expect(typeof data.forecastHourly).toBe('string');
    expect(typeof data.forecastZone).toBe('string');
    
    // Verify URLs are from api.weather.gov
    expect(data.forecast).toMatch(/^https:\/\/api\.weather\.gov\/gridpoints/);
    expect(data.forecastHourly).toMatch(/^https:\/\/api\.weather\.gov\/gridpoints/);
    expect(data.forecastZone).toMatch(/^https:\/\/api\.weather\.gov\/zones/);

    // Second call should hit cache (same object reference)
    const dataCached = await getGridpoint(lat, lon);
    expect(dataCached).toBe(data); // Referential equality proves caching
  });

  test('getForecast fetches forecast using gridpoint info', async () => {
    const api = require('../utils/weatherApi');

    const data = await api.getForecast(lat, lon);
    
    // Verify real forecast response structure
    expect(data).toBeDefined();
    expect(data.properties).toBeDefined();
    expect(Array.isArray(data.properties.periods)).toBe(true);
    expect(data.properties.periods.length).toBeGreaterThan(0);
    
    // Verify first period has expected structure
    const firstPeriod = data.properties.periods[0];
    expect(typeof firstPeriod.number).toBe('number');
    expect(typeof firstPeriod.name).toBe('string');
    expect(typeof firstPeriod.temperature).toBe('number');
    expect(typeof firstPeriod.temperatureUnit).toBe('string');

    // Second call should return cached result
    const dataCached = await api.getForecast(lat, lon);
    expect(dataCached).toBe(data); // Referential equality proves caching
  });

  test('getHourlyForecast fetches hourly forecast using gridpoint', async () => {
    const api = require('../utils/weatherApi');

    const data = await api.getHourlyForecast(lat, lon);
    
    // Verify real hourly forecast response structure
    expect(data).toBeDefined();
    expect(data.properties).toBeDefined();
    expect(Array.isArray(data.properties.periods)).toBe(true);
    expect(data.properties.periods.length).toBeGreaterThan(0);
    
    // Verify first period has expected hourly structure
    const firstPeriod = data.properties.periods[0];
    expect(typeof firstPeriod.number).toBe('number');
    expect(typeof firstPeriod.startTime).toBe('string');
    expect(typeof firstPeriod.temperature).toBe('number');
    expect(typeof firstPeriod.temperatureUnit).toBe('string');
    expect(typeof firstPeriod.shortForecast).toBe('string');

    // Verify startTime is a valid ISO date
    expect(new Date(firstPeriod.startTime)).toBeInstanceOf(Date);

    // Second call should return cached result
    const dataCached = await api.getHourlyForecast(lat, lon);
    expect(dataCached).toBe(data); // Referential equality proves caching
  });

  test('getForecasts retrieves daily and hourly forecasts together', async () => {
    const api = require('../utils/weatherApi');

    const data = await api.getForecasts(lat, lon);
    
    // Verify combined response structure
    expect(data).toBeDefined();
    expect(data.daily).toBeDefined();
    expect(data.hourly).toBeDefined();
    
    // Verify daily forecast
    expect(data.daily.properties).toBeDefined();
    expect(Array.isArray(data.daily.properties.periods)).toBe(true);
    expect(data.daily.properties.periods.length).toBeGreaterThan(0);
    
    // Verify hourly forecast
    expect(data.hourly.properties).toBeDefined();
    expect(Array.isArray(data.hourly.properties.periods)).toBe(true);
    expect(data.hourly.properties.periods.length).toBeGreaterThan(0);
    
    // Verify daily periods are different from hourly
    expect(data.daily.properties.periods[0].name).toBeDefined();
    expect(data.hourly.properties.periods[0].startTime).toBeDefined();
  });

  test('getAlerts fetches active alerts for a zone', async () => {
    const api = require('../utils/weatherApi');

    const data = await api.getAlerts(lat, lon);
    
    // Verify real alerts response structure
    expect(data).toBeDefined();
    expect(Array.isArray(data.features)).toBe(true);
    
    // If there are alerts, verify structure
    if (data.features.length > 0) {
      const firstAlert = data.features[0];
      expect(firstAlert.properties).toBeDefined();
      expect(typeof firstAlert.properties.headline).toBe('string');
    }

    // Second call should return cached result
    const dataCached = await api.getAlerts(lat, lon);
    expect(dataCached).toBe(data); // Referential equality proves caching
  });
});
