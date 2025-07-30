/**
 * Weather API client for ParkCast.
 *
 * This module provides simple helper functions to retrieve both daily and hourly forecasts
 * from the National Weather Service (api.weather.gov). It follows the guidelines in the
 * project's responsible use document by rounding coordinates, sending a User‑Agent header,
 * respecting rate limits (no more than one request per second) and gracefully handling errors.
 */

const BASE_URL = 'https://api.weather.gov';

// Identify our app. Update contact details as the project evolves.
const USER_AGENT =
  'ParkCast/0.1 (https://github.com/arjuna26/agentmvp; contact@example.com)';

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
 *
 * @param {string} url
 */
async function fetchWithHeaders(url) {
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: 'application/geo+json, application/json;q=0.9, */*;q=0.8',
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
  const url = `${BASE_URL}/points/${latRounded},${lonRounded}`;

  const data = await fetchWithHeaders(url);
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
  const props = await getGridpoint(lat, lon);
  // Pause to respect rate limits if retrieving both endpoints successively.
  await sleep(1000);
  const forecastUrl = props.forecast;
  return fetchWithHeaders(forecastUrl);
}

/**
 * Get the hourly forecast for a given location.
 *
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {Promise<Object>} A promise resolving to the hourly forecast JSON.
 */
async function getHourlyForecast(lat, lon) {
  const props = await getGridpoint(lat, lon);
  // Pause to respect rate limits if retrieving both endpoints successively.
  await sleep(1000);
  const hourlyUrl = props.forecastHourly;
  return fetchWithHeaders(hourlyUrl);
}

module.exports = { getGridpoint, getForecast, getHourlyForecast };