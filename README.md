# ParkCast Project

This repository contains the early **ParkCast** working prototype. The goal of ParkCast is to provide real‑time, location‑specific weather forecasts for popular areas within U.S. National Parks.

## Getting Started

The project uses plain JavaScript for the minimum viable product (MVP). To fetch weather forecasts we query the National Weather Service (NWS) API at [api.weather.gov](https://api.weather.gov). To run the code, make sure you have Node.js 18+ installed (which includes a built‑in `fetch` implementation).

Install dependencies (none at the moment):

```bash
npm install
```

### Usage

```js
const { getForecast, getHourlyForecast } = require('./src/weatherApi');

// Example: Mount Rainier National Park, Paradise Visitor Center (46.7867° N, 121.7345° W)
const lat = 46.7867;
const lon = -121.7345;

getForecast(lat, lon).then((data) => {
  console.log('Daily forecast:', data.properties.periods);
});

getHourlyForecast(lat, lon).then((data) => {
  console.log('Hourly forecast:', data.properties.periods);
});
```

## Branching Strategy

We follow a lightweight agile process:

* New work happens on feature branches prefixed with `feature/`.
* Open pull requests early and iterate.
* Merge back into `main` via a pull request when features are complete.

## Licensing

Weather forecast data retrieved from api.weather.gov is public domain as provided by the National Weather Service. See the `docs/legal.md` for details on using this data.