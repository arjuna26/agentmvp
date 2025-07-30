/**
 * Weather API client for ParkCast.
 *
 * This module provides simple helper functions to retrieve both daily and hourly forecasts
 * from the National Weather Service (api.weather.gov). It follows the guidelines in the
 * project's responsible use document by rounding coordinates, sending a User‑Agent header,
 * respecting rate limits (no more than one request per second) and gracefully handling errors.
 *
 * Recent updates introduce a lightweight in‑memory cache and basic retry logic so that
 * repeated lookups are faster and resilient to occasional rate‑limit responses.
 */

const BASE_URL = 'https://api.weather.gov';

// Identify our app. Update contact details as the project evolves.
const USER_AGENT =
  'ParkCast/0.1 (https://github.com/arjuna26/agentmvp; contact@example.com)';

// Cache entries live for one hour.
const CACHE_TTL = 60 * 60 * 1000;

// Simple in‑memory caches for gridpoint metadata and forecasts.
const cache = {
  gridpoint: new Map(),
  forecast: new Map(),
  hourly: new Map(),
  alerts: new Map(),
};

function getFromCache(map, key) {
  const entry = map.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(map, key, data) {
  map.set(key, { data, timestamp: Date.now() });
}

/**
 * Wait for the given number of milliseconds.
 *
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Perform a fetch with the appropriate User‑Agent header.
 * Retries on HTTP 429 with exponential backoff.
 *
 * @param {string} url
 * @param {number} [retries=3] Number of retries when rate limited
 */
async function fetchWithHeaders(url, retries = 3) {
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: 'application/geo+json, application/json;q=0.9, */*;q=0.8',
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, { headers });
    if (response.status === 429 && attempt < retries - 1) {
      const retryAfter = response.headers.get('Retry-After');
      const wait = retryAfter ? parseInt(retryAfter, 10) * 1000 : (attempt + 1) * 1000;
      await sleep(wait);
      continue;
    }
    if (!response.ok) {
      const error = new Error(
        `Request to ${url} failed with status ${response.status}`
      );
      error.status = response.status;
      throw error;
    }
    return response.json();
  }
  // If we reached here, all attempts failed with 429
  throw new Error(`Request to ${url} failed due to repeated rate limiting`);
}

/**
 * Retrieve gridpoint metadata for a given latitude and longitude.
 * We round coordinates to ~4 decimal places to avoid unnecessary churn on
 * api.weather.gov's gridpoint endpoints.
 *
 * @param {number} lat Latitude in decimal degrees (positive north)
 * @param {number} lon Longitude in decimal degrees (negative west)
 * @returns {Promise<Object>} A promise resolving to the properties object from the points response.
 */
async function getGridpoint(lat, lon) {
  // Respect coordinate precision guidelines.
  const latRounded = Number(lat.toFixed(4));
  const lonRounded = Number(lon.toFixed(4));
  const key = `${latRounded},${lonRounded}`;
  const cached = getFromCache(cache.gridpoint, key);
  if (cached) {
    return cached;
  }
  const url = `${BASE_URL}/points/${latRounded},${lonRounded}`;
  const data = await fetchWithHeaders(url);
  setCache(cache.gridpoint, key, data.properties);
  return data.properties;
}

/**
 * Get the daily forecast for a given location.
 *
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {Promise<Object>} A promise resolving to the forecast JSON.
 */
async function getForecast(lat, lon) {
  const key = `${lat},${lon}`;
  const cached = getFromCache(cache.forecast, key);
  if (cached) {
    return cached;
  }
  const props = await getGridpoint(lat, lon);
  // Pause to respect rate limits if retrieving both endpoints successively.
  await sleep(1000);
  const forecastUrl = props.forecast;
  const data = await fetchWithHeaders(forecastUrl);
  setCache(cache.forecast, key, data);
  return data;
}

/**
 * Get the hourly forecast for a given location.
 *
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {Promise<Object>} A promise resolving to the hourly forecast JSON.
 */
async function getHourlyForecast(lat, lon) {
  const key = `${lat},${lon}`;
  const cached = getFromCache(cache.hourly, key);
  if (cached) {
    return cached;
  }
  const props = await getGridpoint(lat, lon);
  // Pause to respect rate limits if retrieving both endpoints successively.
  await sleep(1000);
  const hourlyUrl = props.forecastHourly;
  const data = await fetchWithHeaders(hourlyUrl);
  setCache(cache.hourly, key, data);
  return data;
}

/**
 * Fetch both daily and hourly forecasts with a single gridpoint lookup.
 * The hourly request is initiated one second after the daily request to stay
 * well under the NWS rate limits.
 *
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {Promise<{daily:Object, hourly:Object}>}
 */
async function getForecasts(lat, lon) {
  const props = await getGridpoint(lat, lon);
  const key = `${lat},${lon}`;

  const dailyPromise = (async () => {
    const cached = getFromCache(cache.forecast, key);
    if (cached) return cached;
    const data = await fetchWithHeaders(props.forecast);
    setCache(cache.forecast, key, data);
    return data;
  })();

  const hourlyPromise = (async () => {
    const cached = getFromCache(cache.hourly, key);
    if (cached) return cached;
    await sleep(1000);
    const data = await fetchWithHeaders(props.forecastHourly);
    setCache(cache.hourly, key, data);
    return data;
  })();

  const [daily, hourly] = await Promise.all([dailyPromise, hourlyPromise]);
  return { daily, hourly };
}

/**
 * Get active weather alerts for a given location.
 *
 * Similar to the mobile client implementation, this helper fetches
 * gridpoint metadata to determine the forecast zone for the provided
 * coordinates and then calls the alerts endpoint for that zone.  The
 * response contains an array of features; if there are no active alerts
 * the array will be empty.
 *
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {Promise<Object>} A promise resolving to the alerts JSON.
 */
async function getAlerts(lat, lon) {
  const key = `${lat},${lon}`;
  const cached = getFromCache(cache.alerts, key);
  if (cached) {
    return cached;
  }
  const props = await getGridpoint(lat, lon);
  const zoneUrl = props.forecastZone;
  const zoneId = zoneUrl.split('/').pop();
  await sleep(1000);
  const alertsUrl = `${BASE_URL}/alerts/active/zone/${zoneId}`;
  const data = await fetchWithHeaders(alertsUrl);
  setCache(cache.alerts, key, data);
  return data;
}

module.exports = {
  getGridpoint,
  getForecast,
  getHourlyForecast,
  getForecasts,
  getAlerts,
};
