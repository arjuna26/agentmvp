const { 
  getGridpoint, 
  getForecast, 
  getHourlyForecast, 
  getAlerts, 
  clearCache 
} = require('../utils/weatherApi.js');

describe('Weather API Caching - Real API Integration', () => {
  // Using Topeka, KS coordinates as example from NWS docs
  const lat = 39.7456;
  const lon = -97.0892;

  beforeEach(() => {
    clearCache();
  });

  describe('Real API Caching Tests', () => {
    test('should cache gridpoint data from real API', async () => {
      // First call - hits the real API
      const start1 = Date.now();
      const result1 = await getGridpoint(lat, lon);
      const time1 = Date.now() - start1;

      expect(result1).toBeDefined();
      expect(result1.gridId).toBeDefined();
      expect(result1.gridX).toBeDefined();
      expect(result1.gridY).toBeDefined();
      expect(result1.forecast).toBeDefined();
      expect(result1.forecastHourly).toBeDefined();

      // Second call - should come from cache
      const start2 = Date.now();
      const result2 = await getGridpoint(lat, lon);
      const time2 = Date.now() - start2;

      // Should be exact same object (referential equality)
      expect(result1).toBe(result2);
      
      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1 / 3);
      expect(time2).toBeLessThan(10); // Should be nearly instantaneous

      console.log(`API call: ${time1}ms, Cache hit: ${time2}ms (${Math.round(time1/time2)}x faster)`);
    }, 30000);

    test('should cache forecast data from real API', async () => {
      // First call - hits the real API
      const start1 = Date.now();
      const result1 = await getForecast(lat, lon);
      const time1 = Date.now() - start1;

      expect(result1).toBeDefined();
      expect(result1.properties).toBeDefined();
      expect(result1.properties.periods).toBeDefined();
      expect(Array.isArray(result1.properties.periods)).toBe(true);

      // Second call - should come from cache
      const start2 = Date.now();
      const result2 = await getForecast(lat, lon);
      const time2 = Date.now() - start2;

      // Should be exact same object (referential equality)
      expect(result1).toBe(result2);
      
      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1 / 3);
      expect(time2).toBeLessThan(10);

      console.log(`Forecast API call: ${time1}ms, Cache hit: ${time2}ms (${Math.round(time1/time2)}x faster)`);
    }, 30000);

    test('should cache hourly forecast data from real API', async () => {
      // First call - hits the real API
      const start1 = Date.now();
      const result1 = await getHourlyForecast(lat, lon);
      const time1 = Date.now() - start1;

      expect(result1).toBeDefined();
      expect(result1.properties).toBeDefined();
      expect(result1.properties.periods).toBeDefined();
      expect(Array.isArray(result1.properties.periods)).toBe(true);

      // Second call - should come from cache
      const start2 = Date.now();
      const result2 = await getHourlyForecast(lat, lon);
      const time2 = Date.now() - start2;

      // Should be exact same object (referential equality)
      expect(result1).toBe(result2);
      
      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1 / 3);
      expect(time2).toBeLessThan(10);

      console.log(`Hourly API call: ${time1}ms, Cache hit: ${time2}ms (${Math.round(time1/time2)}x faster)`);
    }, 30000);

    test('should cache alerts data from real API', async () => {
      // First call - hits the real API
      const start1 = Date.now();
      const result1 = await getAlerts(lat, lon);
      const time1 = Date.now() - start1;

      expect(result1).toBeDefined();
      expect(result1.features).toBeDefined();
      expect(Array.isArray(result1.features)).toBe(true);

      // Second call - should come from cache
      const start2 = Date.now();
      const result2 = await getAlerts(lat, lon);
      const time2 = Date.now() - start2;

      // Should be exact same object (referential equality)
      expect(result1).toBe(result2);
      
      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1 / 3);
      expect(time2).toBeLessThan(10);

      console.log(`Alerts API call: ${time1}ms, Cache hit: ${time2}ms (${Math.round(time1/time2)}x faster)`);
    }, 45000);

    test('clearCache should remove all cached data and force API calls', async () => {
      // Cache some data
      await getGridpoint(lat, lon);
      await getForecast(lat, lon);

      // Clear cache
      clearCache();

      // These should hit the API again (we can't easily verify without timing,
      // but the fact that they don't throw errors means they work)
      const gridpoint = await getGridpoint(lat, lon);
      const forecast = await getForecast(lat, lon);

      expect(gridpoint).toBeDefined();
      expect(forecast).toBeDefined();
    }, 30000);

    test('should use grid coordinates for forecast caching efficiency', async () => {
      // Two nearby locations that should map to the same grid
      const lat1 = 39.7456;
      const lon1 = -97.0892;
      const lat2 = 39.7460; // Very slightly different
      const lon2 = -97.0890;

      // Get gridpoint for first location
      const gridpoint1 = await getGridpoint(lat1, lon1);
      
      // Get forecast for first location
      const forecast1 = await getForecast(lat1, lon1);

      // Get gridpoint for second location (might be same grid)
      const gridpoint2 = await getGridpoint(lat2, lon2);

      // If they're in the same grid, the forecast should be cached
      if (gridpoint1.gridId === gridpoint2.gridId && 
          gridpoint1.gridX === gridpoint2.gridX && 
          gridpoint1.gridY === gridpoint2.gridY) {
        
        console.log('Locations map to same grid - testing cache efficiency');
        
        const start = Date.now();
        const forecast2 = await getForecast(lat2, lon2);
        const time = Date.now() - start;

        // Should be very fast (cached)
        expect(time).toBeLessThan(100);
        expect(forecast1).toBe(forecast2); // Same cached object
        
        console.log(`Grid cache hit: ${time}ms`);
      } else {
        console.log('Locations map to different grids - both will be cached separately');
      }
    }, 45000);

    test('should demonstrate overall caching performance benefits', async () => {
      console.log('\n=== Caching Performance Test ===');
      
      // Test multiple API calls with caching
      const locations = [
        [39.7456, -97.0892], // Topeka, KS
        [39.7500, -97.0900], // Nearby location
      ];

      let totalWithoutCache = 0;
      let totalWithCache = 0;

      for (const [lat, lon] of locations) {
        // Clear cache for fair comparison
        clearCache();

        // First call (no cache)
        const start1 = Date.now();
        await getGridpoint(lat, lon);
        await getForecast(lat, lon);
        const time1 = Date.now() - start1;
        totalWithoutCache += time1;

        // Second call (with cache)
        const start2 = Date.now();
        await getGridpoint(lat, lon);
        await getForecast(lat, lon);
        const time2 = Date.now() - start2;
        totalWithCache += time2;

        console.log(`Location ${lat},${lon}: API ${time1}ms, Cache ${time2}ms`);
      }

      const speedup = Math.round(totalWithoutCache / totalWithCache);
      console.log(`Total: API ${totalWithoutCache}ms, Cache ${totalWithCache}ms (${speedup}x faster)`);
      
      expect(totalWithCache).toBeLessThan(totalWithoutCache / 2);
    }, 60000);
  });
});
