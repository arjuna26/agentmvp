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

## Mobile App (Expo)

An experimental Expo/React Native mobile client lives in the `mobile-app` directory. To run the app locally and preview it on your iOS or Android device:

1. Install the Expo CLI if you don't already have it:

   ```bash
   npm install --global expo-cli
   ```

2. Navigate to the app directory and install dependencies:

   ```bash
   cd mobile-app
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Use the Expo Go app on your iPhone or Android device to scan the QR code displayed in your terminal or browser to open the app. The mobile client currently fetches the daily and hourly forecast for Mount Rainier’s Paradise Visitor Center as a demonstration.

The current mobile client includes a curated location selector, active weather alerts and the ability to mark favourite locations.  Favourite locations are displayed at the top of the selector for quick access during a session (future work could persist favourites across app restarts).  Upcoming iterations will add navigation and additional features aligned with the high‑traffic spots defined in the MVP.