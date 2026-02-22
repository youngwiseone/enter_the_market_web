export const WEATHER_IDS = Object.freeze({
  CLEAR: 'clear',
  RAIN: 'rain'
});

export const RAIN_DAY_CHANCE = 0.15;

export function rollWeatherId(randomFn = Math.random) {
  const roll = typeof randomFn === 'function' ? Number(randomFn()) : Math.random();
  return roll < RAIN_DAY_CHANCE ? WEATHER_IDS.RAIN : WEATHER_IDS.CLEAR;
}

export function normalizeWeatherId(value) {
  return String(value || '').toLowerCase() === WEATHER_IDS.RAIN
    ? WEATHER_IDS.RAIN
    : WEATHER_IDS.CLEAR;
}
