import { RARITY_ROLLS, normalizeRarity } from './rarity.js';

const NOISE_RANGE_BY_LEVEL = Object.freeze({
  low: 2,
  low_medium: 3,
  medium: 5,
  medium_high: 7,
  high: 10
});

const SHOCK_MULTIPLIER_BY_LEVEL = Object.freeze({
  low: 0.55,
  low_medium: 0.75,
  normal: 1,
  medium_high: 1.2,
  high: 1.45,
  very_high: 1.8
});

const WEATHER_MULTIPLIER_BY_LEVEL = Object.freeze({
  low: 0.4,
  medium: 1,
  high: 1.6
});

const RARITY_PROFILE_FACTORS = Object.freeze({
  low: Object.freeze({ common: 1, uncommon: 1, rare: 1.02, mythic: 1.05 }),
  low_medium: Object.freeze({ common: 1, uncommon: 1.02, rare: 1.06, mythic: 1.12 }),
  medium: Object.freeze({ common: 1, uncommon: 1.04, rare: 1.1, mythic: 1.2 }),
  medium_high: Object.freeze({ common: 1, uncommon: 1.05, rare: 1.14, mythic: 1.28 }),
  high: Object.freeze({ common: 1, uncommon: 1.07, rare: 1.18, mythic: 1.38 }),
  very_high: Object.freeze({ common: 1, uncommon: 1.09, rare: 1.24, mythic: 1.5 })
});

const CYCLE_FAMILY_LABELS = Object.freeze({
  intro_oscillation: 'Intro oscillation',
  mean_reversion: 'Mean reversion',
  broad_wave: 'Broad wave',
  spike_dump: 'Spike and dump',
  directional_wave: 'Directional wave',
  premium_wave: 'Premium wave',
  reactive_wave: 'Reactive wave'
});

const CURRENT_PRODUCE_IDENTITY_BY_ID = Object.freeze({
  1: { cycleDays: 6, cycleOffsets: [-10, -4, 2, 6, 10, -4], cycleFamily: 'premium_wave', noiseLevel: 'low', shockSensitivity: 'normal', rarityProfile: 'high', weatherSensitivity: 'medium', identitySummary: 'Broad premium wave that rewards patience and stronger rarities.' },
  2: { cycleDays: 4, cycleOffsets: [0, 5, 0, -5], cycleFamily: 'intro_oscillation', noiseLevel: 'medium', shockSensitivity: 'normal', rarityProfile: 'low', weatherSensitivity: 'low', identitySummary: 'Cheap volume crop with small repeatable windows.' },
  3: { cycleDays: 5, cycleOffsets: [-8, -2, 3, 7, 0], cycleFamily: 'directional_wave', noiseLevel: 'medium', shockSensitivity: 'medium_high', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Directional cycle with a recognizable rise leg.' },
  4: { cycleDays: 3, cycleOffsets: [0, 8, -8], cycleFamily: 'intro_oscillation', noiseLevel: 'low', shockSensitivity: 'low', rarityProfile: 'low_medium', weatherSensitivity: 'low', identitySummary: 'Simple beginner rhythm with low shock sensitivity.' },
  5: { cycleDays: 4, cycleOffsets: [-4, 0, 4, 0], cycleFamily: 'intro_oscillation', noiseLevel: 'low', shockSensitivity: 'low', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Forgiving stable cycle that rewards modest holding.' },
  6: { cycleDays: 4, cycleOffsets: [-8, 8, 4, -4], cycleFamily: 'mean_reversion', noiseLevel: 'low_medium', shockSensitivity: 'normal', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Overshoots and tends to drift back toward average.' },
  7: { cycleDays: 5, cycleOffsets: [-5, 0, 4, 5, -4], cycleFamily: 'broad_wave', noiseLevel: 'low', shockSensitivity: 'low', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Reliable broad cycle for conservative cashflow.' },
  8: { cycleDays: 6, cycleOffsets: [-6, -2, 2, 5, 7, -6], cycleFamily: 'premium_wave', noiseLevel: 'low', shockSensitivity: 'low', rarityProfile: 'very_high', weatherSensitivity: 'low', identitySummary: 'Premium stable crop with standout rare and mythic sales.' },
  9: { cycleDays: 5, cycleOffsets: [-6, -2, 2, 6, 0], cycleFamily: 'reactive_wave', noiseLevel: 'medium', shockSensitivity: 'medium', rarityProfile: 'medium', weatherSensitivity: 'high', identitySummary: 'Smooth cycle that bends noticeably with weather.' },
  10: { cycleDays: 4, cycleOffsets: [-5, 2, 5, -2], cycleFamily: 'intro_oscillation', noiseLevel: 'medium', shockSensitivity: 'normal', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Balanced generalist crop with a readable rhythm.' },
  11: { cycleDays: 6, cycleOffsets: [-8, -3, 2, 6, 9, -6], cycleFamily: 'premium_wave', noiseLevel: 'low_medium', shockSensitivity: 'normal', rarityProfile: 'high', weatherSensitivity: 'low', identitySummary: 'Premium build-and-correct cycle with good rarity upside.' },
  12: { cycleDays: 5, cycleOffsets: [-4, 0, 3, 5, -4], cycleFamily: 'premium_wave', noiseLevel: 'low', shockSensitivity: 'low', rarityProfile: 'high', weatherSensitivity: 'low', identitySummary: 'Stable quality crop where rarity matters more than chart swings.' },
  13: { cycleDays: 4, cycleOffsets: [-10, 12, 4, -6], cycleFamily: 'spike_dump', noiseLevel: 'high', shockSensitivity: 'high', rarityProfile: 'low_medium', weatherSensitivity: 'low', identitySummary: 'Quick spike-and-dump crop that punishes overholding.' },
  14: { cycleDays: 4, cycleOffsets: [0, 0, 7, -7], cycleFamily: 'intro_oscillation', noiseLevel: 'medium', shockSensitivity: 'normal', rarityProfile: 'low_medium', weatherSensitivity: 'medium', identitySummary: 'Usually calm with occasional pop days.' },
  15: { cycleDays: 3, cycleOffsets: [-10, 12, -2], cycleFamily: 'spike_dump', noiseLevel: 'medium_high', shockSensitivity: 'medium_high', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Short and choppy with sharper timing windows.' },
  16: { cycleDays: 5, cycleOffsets: [-9, -3, 2, 8, 2], cycleFamily: 'directional_wave', noiseLevel: 'medium_high', shockSensitivity: 'high', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Aggressive trend-leg crop with strong upside phases.' },
  17: { cycleDays: 5, cycleOffsets: [-5, -1, 2, 5, -1], cycleFamily: 'premium_wave', noiseLevel: 'low_medium', shockSensitivity: 'normal', rarityProfile: 'high', weatherSensitivity: 'low', identitySummary: 'Moderate graph movement with a strong quality identity.' },
  18: { cycleDays: 4, cycleOffsets: [-7, 9, 3, -5], cycleFamily: 'spike_dump', noiseLevel: 'medium_high', shockSensitivity: 'high', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Active trading crop with frequent short windows.' },
  19: { cycleDays: 6, cycleOffsets: [-8, -2, 4, 8, 2, -4], cycleFamily: 'broad_wave', noiseLevel: 'medium', shockSensitivity: 'normal', rarityProfile: 'medium_high', weatherSensitivity: 'low', identitySummary: 'Rhythm crop with a clear repeating cycle.' },
  20: { cycleDays: 4, cycleOffsets: [-11, 11, 5, -5], cycleFamily: 'mean_reversion', noiseLevel: 'medium', shockSensitivity: 'high', rarityProfile: 'high', weatherSensitivity: 'low', identitySummary: 'Bigger, riskier mean-reversion windows than Onion.' },
  21: { cycleDays: 5, cycleOffsets: [-5, -1, 3, 5, -2], cycleFamily: 'broad_wave', noiseLevel: 'low', shockSensitivity: 'low', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Upper-midgame stable builder with low drama.' },
  22: { cycleDays: 5, cycleOffsets: [-10, -4, 1, 8, 5], cycleFamily: 'directional_wave', noiseLevel: 'medium_high', shockSensitivity: 'high', rarityProfile: 'medium_high', weatherSensitivity: 'low', identitySummary: 'Premium directional crop with strong rise phases.' },
  23: { cycleDays: 4, cycleOffsets: [-14, 16, 4, -6], cycleFamily: 'spike_dump', noiseLevel: 'high', shockSensitivity: 'very_high', rarityProfile: 'high', weatherSensitivity: 'medium', identitySummary: 'Pure speculative crop with large swings and high upside.' },
  24: { cycleDays: 5, cycleOffsets: [-4, 0, 3, 4, -3], cycleFamily: 'broad_wave', noiseLevel: 'low', shockSensitivity: 'low', rarityProfile: 'medium', weatherSensitivity: 'low', identitySummary: 'Defensive premium crop with controlled movement.' },
  25: { cycleDays: 6, cycleOffsets: [-9, -4, 0, 4, 9, 0], cycleFamily: 'broad_wave', noiseLevel: 'medium', shockSensitivity: 'normal', rarityProfile: 'medium_high', weatherSensitivity: 'low', identitySummary: 'Slow wide cycle that rewards patience.' },
  26: { cycleDays: 6, cycleOffsets: [-7, -3, 1, 4, 8, -3], cycleFamily: 'premium_wave', noiseLevel: 'low', shockSensitivity: 'low_medium', rarityProfile: 'high', weatherSensitivity: 'low', identitySummary: 'Premium but dependable compounding crop.' },
  27: { cycleDays: 6, cycleOffsets: [-5, -2, 1, 4, 6, -4], cycleFamily: 'premium_wave', noiseLevel: 'low', shockSensitivity: 'low', rarityProfile: 'high', weatherSensitivity: 'low', identitySummary: 'Safe premium rhythm crop.' },
  28: { cycleDays: 5, cycleOffsets: [-9, 7, 4, -4, 2], cycleFamily: 'mean_reversion', noiseLevel: 'medium', shockSensitivity: 'normal', rarityProfile: 'medium_high', weatherSensitivity: 'low', identitySummary: 'Technical timing crop with disciplined windows.' },
  29: { cycleDays: 6, cycleOffsets: [-8, -2, 1, 5, 7, -3], cycleFamily: 'reactive_wave', noiseLevel: 'medium', shockSensitivity: 'high', rarityProfile: 'high', weatherSensitivity: 'high', identitySummary: 'Reactive crop whose cycle bends with outside conditions.' },
  30: { cycleDays: 6, cycleOffsets: [-11, -5, 0, 5, 11, 0], cycleFamily: 'directional_wave', noiseLevel: 'medium_high', shockSensitivity: 'high', rarityProfile: 'high', weatherSensitivity: 'low', identitySummary: 'Elite trend-leg crop with powerful rise phases.' },
  31: { cycleDays: 7, cycleOffsets: [-14, -6, -1, 4, 9, 13, -5], cycleFamily: 'premium_wave', noiseLevel: 'high', shockSensitivity: 'very_high', rarityProfile: 'very_high', weatherSensitivity: 'medium', identitySummary: 'Apex premium boom-bust crop with huge upside and risk.' }
});

function toPositiveInt(value, fallbackValue = 1) {
  const numeric = Math.max(1, Math.floor(Number(value) || 0));
  return numeric || fallbackValue;
}

function normalizeCycleOffsets(offsets, cycleDays) {
  if (!Array.isArray(offsets) || !offsets.length) {
    return Array(cycleDays).fill(0);
  }
  const safe = offsets.slice(0, cycleDays).map((entry) => Number(entry) || 0);
  while (safe.length < cycleDays) safe.push(0);
  const avg = safe.reduce((sum, entry) => sum + entry, 0) / Math.max(1, safe.length);
  return safe.map((entry) => Math.round((entry - avg) * 100) / 100);
}

function hashUnit(seed) {
  let value = seed >>> 0;
  value = Math.imul(value ^ 61, 1 | value);
  value ^= value + Math.imul(value ^ 7, 61 | value);
  value ^= value >>> 14;
  return (value >>> 0) / 4294967296;
}

function getIdentitySource(item) {
  const itemId = Number(item?.id);
  const fallback = Number.isInteger(itemId) ? CURRENT_PRODUCE_IDENTITY_BY_ID[itemId] : null;
  if (!fallback && item && typeof item === 'object') return item;
  return {
    ...(fallback || {}),
    ...(item && typeof item === 'object' ? item : {})
  };
}

export function getCropIdentity(item) {
  const source = getIdentitySource(item);
  const cycleDays = toPositiveInt(source?.cycleDays, 1);
  const cycleOffsets = normalizeCycleOffsets(source?.cycleOffsets, cycleDays);
  const cycleFamily = String(source?.cycleFamily || 'intro_oscillation').trim().toLowerCase();
  const noiseLevel = NOISE_RANGE_BY_LEVEL[String(source?.noiseLevel || 'medium').trim().toLowerCase()]
    ? String(source?.noiseLevel || 'medium').trim().toLowerCase()
    : 'medium';
  const shockSensitivity = SHOCK_MULTIPLIER_BY_LEVEL[String(source?.shockSensitivity || 'normal').trim().toLowerCase()]
    ? String(source?.shockSensitivity || 'normal').trim().toLowerCase()
    : 'normal';
  const rarityProfile = RARITY_PROFILE_FACTORS[String(source?.rarityProfile || 'medium').trim().toLowerCase()]
    ? String(source?.rarityProfile || 'medium').trim().toLowerCase()
    : 'medium';
  const weatherSensitivity = WEATHER_MULTIPLIER_BY_LEVEL[String(source?.weatherSensitivity || 'low').trim().toLowerCase()]
    ? String(source?.weatherSensitivity || 'low').trim().toLowerCase()
    : 'low';
  return {
    cycleDays,
    cycleOffsets,
    cycleFamily,
    noiseLevel,
    shockSensitivity,
    rarityProfile,
    weatherSensitivity,
    identitySummary: String(source?.identitySummary || '').trim()
  };
}

export function getCropCycleOffsetPercent(item, dayNumber) {
  const identity = getCropIdentity(item);
  const safeDay = Math.max(1, Math.floor(Number(dayNumber) || 1));
  const cycleIndex = (safeDay - 1) % identity.cycleDays;
  return Number(identity.cycleOffsets[cycleIndex]) || 0;
}

export function getCropNoisePercent(item, dayNumber) {
  const identity = getCropIdentity(item);
  const range = NOISE_RANGE_BY_LEVEL[identity.noiseLevel] || 0;
  const itemId = Math.max(1, Math.floor(Number(item?.id) || 1));
  const day = Math.max(1, Math.floor(Number(dayNumber) || 1));
  const unitA = hashUnit((itemId * 73856093) ^ (day * 19349663) ^ 0x9e3779b9);
  const unitB = hashUnit((itemId * 83492791) ^ (day * 2654435761) ^ 0x85ebca6b);
  const centered = (unitA + unitB) - 1;
  return Math.round(centered * range * 100) / 100;
}

export function getCropWeatherOffsetPercent(item, weatherId) {
  if (String(weatherId || '').trim().toLowerCase() !== 'rain') return 0;
  const identity = getCropIdentity(item);
  const weatherMultiplier = WEATHER_MULTIPLIER_BY_LEVEL[identity.weatherSensitivity] || 0;
  return Math.round(weatherMultiplier * 1.75 * 100) / 100;
}

export function getCropCycleAnchorPrice(item, dayNumber, weatherId) {
  const basePrice = Math.max(0.01, Number(item?.price) || 0.01);
  const cyclePct = getCropCycleOffsetPercent(item, dayNumber);
  const noisePct = getCropNoisePercent(item, dayNumber);
  const weatherPct = getCropWeatherOffsetPercent(item, weatherId);
  return Math.max(0.01, basePrice * (1 + ((cyclePct + noisePct + weatherPct) / 100)));
}

export function getCropAdjustedShockPercent(item, rawShockPct) {
  const identity = getCropIdentity(item);
  const multiplier = SHOCK_MULTIPLIER_BY_LEVEL[identity.shockSensitivity] || 1;
  return Number(rawShockPct || 0) * multiplier;
}

export function getCropAdjustedRarityMultiplier(item, rarity, getBaseRarityMultiplier) {
  const normalizedRarity = normalizeRarity(rarity);
  const identity = getCropIdentity(item);
  const baseMultiplier = Math.max(0, Number(getBaseRarityMultiplier(normalizedRarity)) || 0);
  const profile = RARITY_PROFILE_FACTORS[identity.rarityProfile] || RARITY_PROFILE_FACTORS.medium;
  return baseMultiplier * (Number(profile[normalizedRarity]) || 1);
}

export function getExpectedCropRarityMultiplier(item, getBaseRarityMultiplier, rarityRolls = RARITY_ROLLS) {
  if (!Array.isArray(rarityRolls) || !rarityRolls.length) {
    return getCropAdjustedRarityMultiplier(item, 'common', getBaseRarityMultiplier);
  }
  const totalWeight = rarityRolls.reduce((sum, entry) => sum + Math.max(0, Number(entry?.weight) || 0), 0);
  if (totalWeight <= 0) {
    return getCropAdjustedRarityMultiplier(item, 'common', getBaseRarityMultiplier);
  }
  return rarityRolls.reduce((sum, entry) => {
    const rarity = normalizeRarity(entry?.rarity);
    const weight = Math.max(0, Number(entry?.weight) || 0);
    return sum + (weight * getCropAdjustedRarityMultiplier(item, rarity, getBaseRarityMultiplier));
  }, 0) / totalWeight;
}

export function getCropIdentityLabels(item) {
  const identity = getCropIdentity(item);
  return {
    cycle: `${identity.cycleDays}-day cycle`,
    family: CYCLE_FAMILY_LABELS[identity.cycleFamily] || 'Cycle',
    noise: identity.noiseLevel.replace(/_/g, ' '),
    shock: identity.shockSensitivity.replace(/_/g, ' '),
    rarity: identity.rarityProfile.replace(/_/g, ' '),
    weather: identity.weatherSensitivity.replace(/_/g, ' ')
  };
}
