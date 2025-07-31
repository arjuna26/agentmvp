const fetch = require("node-fetch");
global.fetch = fetch;
const nock = require('nock');
const path = require('path');

// Increase default test timeout to handle rate limit sleeps
jest.setTimeout(10000);

describe('weatherApi', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    jest.resetModules();
  });

  test('getGridpoint fetches and caches grid metadata', async () => {
    const { getGridpoint } = require('../src/weatherApi');
    const lat = 46.7867;
    const lon = -121.7345;
    const reply = { properties: { forecast: 'https://api.weather.gov/grid/forecast', forecastHourly: 'https://api.weather.gov/grid/hourly', forecastZone: 'FOO123' } };

    const scope = nock('https://api.weather.gov')
      .get(`/points/${lat.toFixed(4)},${lon.toFixed(4)}`)
      .reply(200, reply);

    const data = await getGridpoint(lat, lon);
    expect(data).toEqual(reply.properties);
    expect(scope.isDone()).toBe(true);

    // second call should hit cache
    const dataCached = await getGridpoint(lat, lon);
    expect(dataCached).toEqual(reply.properties);
  });

  test('getForecast fetches forecast using gridpoint info', async () => {
    const api = require('../src/weatherApi');
    const lat = 46.7867;
    const lon = -121.7345;

    const gridReply = { properties: { forecast: 'https://api.weather.gov/grid/forecast', forecastHourly: 'https://api.weather.gov/grid/hourly', forecastZone: 'FOO123' } };
    const forecastReply = { periods: [ { name: 'Today', temperature: 70 } ] };

    const scope = nock('https://api.weather.gov')
      .get(`/points/${lat.toFixed(4)},${lon.toFixed(4)}`)
      .reply(200, gridReply)
      .get('/grid/forecast')
      .reply(200, forecastReply);

    const data = await api.getForecast(lat, lon);
    expect(data).toEqual(forecastReply);
    expect(scope.isDone()).toBe(true);

    // second call should return cached result without new nock
    const dataCached = await api.getForecast(lat, lon);
    expect(dataCached).toEqual(forecastReply);
  });

  test('getHourlyForecast fetches hourly forecast using gridpoint', async () => {
    const api = require('../src/weatherApi');
    const lat = 46.7867;
    const lon = -121.7345;

    const gridReply = { properties: { forecast: 'https://api.weather.gov/grid/forecast', forecastHourly: 'https://api.weather.gov/grid/hourly', forecastZone: 'FOO123' } };
    const hourlyReply = { periods: [ { number: 1, temperature: 60 } ] };

    const scope = nock('https://api.weather.gov')
      .get(`/points/${lat.toFixed(4)},${lon.toFixed(4)}`)
      .reply(200, gridReply)
      .get('/grid/hourly')
      .reply(200, hourlyReply);

    const data = await api.getHourlyForecast(lat, lon);
    expect(data).toEqual(hourlyReply);
    expect(scope.isDone()).toBe(true);

    const dataCached = await api.getHourlyForecast(lat, lon);
    expect(dataCached).toEqual(hourlyReply);
  });

  test('getForecasts retrieves daily and hourly forecasts together', async () => {
    const api = require('../src/weatherApi');
    const lat = 46.7867;
    const lon = -121.7345;

    const gridReply = { properties: { forecast: 'https://api.weather.gov/grid/forecast', forecastHourly: 'https://api.weather.gov/grid/hourly', forecastZone: 'FOO123' } };
    const forecastReply = { periods: [ { name: 'Today', temperature: 70 } ] };
    const hourlyReply = { periods: [ { number: 1, temperature: 60 } ] };

    const scope = nock('https://api.weather.gov')
      .get(`/points/${lat.toFixed(4)},${lon.toFixed(4)}`)
      .reply(200, gridReply)
      .get('/grid/forecast')
      .reply(200, forecastReply)
      .get('/grid/hourly')
      .reply(200, hourlyReply);

    const data = await api.getForecasts(lat, lon);
    expect(data).toEqual({ daily: forecastReply, hourly: hourlyReply });
    expect(scope.isDone()).toBe(true);
  });

  test('getAlerts fetches active alerts for a zone', async () => {
    const api = require('../src/weatherApi');
    const lat = 46.7867;
    const lon = -121.7345;

    const gridReply = { properties: { forecast: 'https://api.weather.gov/grid/forecast', forecastHourly: 'https://api.weather.gov/grid/hourly', forecastZone: 'https://api.weather.gov/zones/forecast/FOO123' } };
    const alertsReply = { features: [] };

    const scope = nock('https://api.weather.gov')
      .get(`/points/${lat.toFixed(4)},${lon.toFixed(4)}`)
      .reply(200, gridReply)
      .get('/alerts/active/zone/FOO123')
      .reply(200, alertsReply);

    const data = await api.getAlerts(lat, lon);
    expect(data).toEqual(alertsReply);
    expect(scope.isDone()).toBe(true);
  });
});
