// babel.config.js
//
// This configuration file enables Babel to transpile modern JavaScript and
// JSX syntax when bundling the React Native app with Expo. Without a
// configured preset, Metro may fail to transform code properly and
// produce obscure runtime errors on Hermes (e.g. "Cannot read property
// 'default' of undefined").  The expo preset supplies sensible
// defaults for projects created with the Expo SDK.

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};