// Weather API client for the mobile app.
//
// In the mobile environment we can use the global `fetch` API provided by React
// Native. This module mirrors the functionality of the Node version in
// `src/weatherApi.js`, rounding coordinates, performing the points lookup,
// retrieving the daily and hourly forecasts, and handling basic errors. The
// User‑Agent header is set to identify the app but may be ignored on mobile
// platforms where setting custom user agents is not allowed.

const BASE_URL = 'https://api.weather.gov';

// Identify the app. The User‑Agent may not always be applied by the RN fetch
// implementation, but we include it for completeness.
const USER_AGENT =
  'ParkCast/0.1 (https://github.com/arjuna26/agentmvp; contact@example.com)';

// Enhanced in-memory cache with TTL support
const cache = new Map();

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  GRIDPOINT: 24 * 60 * 60 * 1000,    // 24 hours - coordinates don't change
  DAILY_FORECAST: 60 * 60 * 1000,    // 1 hour - daily forecasts update hourly
  HOURLY_FORECAST: 30 * 60 * 1000,   // 30 minutes - hourly forecasts update frequently
  ALERTS: 10 * 60 * 1000             // 10 minutes - alerts need to be current
};

/**
 * Cache helper functions
 */
function setCacheWithTTL(key, data, ttl) {
  const expiry = Date.now() + ttl;
  cache.set(key, { data, expiry });
}

function getCacheIfValid(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    cache.delete(key); // Clean up expired cache
    return null;
  }
  
  return cached.data;
}

/**
 * Sleep for the given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithHeaders(url) {
  const headers = {
    'user-agent': USER_AGENT,
    'accept': 'application/geo+json, application/json;q=0.9, */*;q=0.8',
  };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const error = new Error(
      `Request to ${url} failed with status ${response.status}`
    );
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function getGridpoint(lat, lon) {
  const latRounded = Number(lat.toFixed(4));
  const lonRounded = Number(lon.toFixed(4));
  const cacheKey = `gridpoint:${latRounded},${lonRounded}`;
  
  // Check cache first
  const cached = getCacheIfValid(cacheKey);
  if (cached) {
    return cached;
  }
  
  const url = `${BASE_URL}/points/${latRounded},${lonRounded}`;
  const data = await fetchWithHeaders(url);
  const properties = data.properties;
  
  // Cache the result with 24-hour TTL
  setCacheWithTTL(cacheKey, properties, CACHE_TTL.GRIDPOINT);
  
  return properties;
}

export async function getForecast(lat, lon) {
  const props = await getGridpoint(lat, lon);
  const forecastUrl = props.forecast;
  
  // Use grid coordinates for cache key
  const cacheKey = `forecast:${props.gridId}:${props.gridX},${props.gridY}`;
  
  // Check cache first
  const cached = getCacheIfValid(cacheKey);
  if (cached) {
    return cached;
  }
  
  await sleep(1000);
  const data = await fetchWithHeaders(forecastUrl);
  
  // Cache the result with 1-hour TTL
  setCacheWithTTL(cacheKey, data, CACHE_TTL.DAILY_FORECAST);
  
  return data;
}

export async function getHourlyForecast(lat, lon) {
  const props = await getGridpoint(lat, lon);
  const hourlyUrl = props.forecastHourly;
  
  // Use grid coordinates for cache key
  const cacheKey = `hourly:${props.gridId}:${props.gridX},${props.gridY}`;
  
  // Check cache first
  const cached = getCacheIfValid(cacheKey);
  if (cached) {
    return cached;
  }
  
  await sleep(1000);
  const data = await fetchWithHeaders(hourlyUrl);
  
  // Cache the result with 30-minute TTL
  setCacheWithTTL(cacheKey, data, CACHE_TTL.HOURLY_FORECAST);
  
  return data;
}

/**
 * Fetch active weather alerts for a given location.
 *
 * The NWS API exposes alerts by forecast zone.  We first fetch the
 * gridpoint metadata for the provided coordinates to determine the
 * associated forecast zone.  We then call the alerts endpoint to
 * retrieve any active alerts.  If there are no alerts, the returned
 * ``features`` array will be empty.
 *
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {Promise<Object>} A promise resolving to the alerts JSON.
 */
export async function getAlerts(lat, lon) {
  // Generate cache key based on zone (we'll get this from gridpoint)
  const props = await getGridpoint(lat, lon);
  const zoneUrl = props.forecastZone;
  // The zone URL has the form https://api.weather.gov/zones/forecast/XX000
  const zoneId = zoneUrl.split('/').pop();
  
  // Check cache first
  const cacheKey = `alerts:${zoneId}`;
  const cachedData = getCacheIfValid(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Respect rate limits before calling the alerts endpoint.
  await sleep(1000);
  const alertsUrl = `${BASE_URL}/alerts/active/zone/${zoneId}`;
  const data = await fetchWithHeaders(alertsUrl);
  
  // Cache the result
  setCacheWithTTL(cacheKey, data, CACHE_TTL.ALERTS);
  
  return data;
}

/**
 * Fetch both daily and hourly forecasts for a given location.
 *
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {Promise<Object>} A promise resolving to an object with 'daily' and 'hourly' properties.
 */
export async function getForecasts(lat, lon) {
  const [daily, hourly] = await Promise.all([
    getForecast(lat, lon),
    getHourlyForecast(lat, lon)
  ]);
  
  return { daily, hourly };
}

/**
 * Clear all cached data. Used for testing and cache management.
 */
export function clearCache() {
  cache.clear();
}

// CommonJS exports for test compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getGridpoint,
    getForecast,
    getHourlyForecast,
    getAlerts,
    getForecasts,
    clearCache
  };
}
