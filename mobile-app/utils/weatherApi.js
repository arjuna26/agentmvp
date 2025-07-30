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

/**
 * Sleep for the given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function getGridpoint(lat, lon) {
  const latRounded = Number(lat.toFixed(4));
  const lonRounded = Number(lon.toFixed(4));
  const url = `${BASE_URL}/points/${latRounded},${lonRounded}`;
  const data = await fetchWithHeaders(url);
  return data.properties;
}

export async function getForecast(lat, lon) {
  const props = await getGridpoint(lat, lon);
  await sleep(1000);
  const forecastUrl = props.forecast;
  return fetchWithHeaders(forecastUrl);
}

export async function getHourlyForecast(lat, lon) {
  const props = await getGridpoint(lat, lon);
  await sleep(1000);
  const hourlyUrl = props.forecastHourly;
  return fetchWithHeaders(hourlyUrl);
}