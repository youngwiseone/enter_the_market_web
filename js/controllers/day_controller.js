import { WEATHER_IDS, rollWeatherId, normalizeWeatherId } from '../sim/weather.js';

const ROLL_MEAN_REVERSION_DAYS = 3;

function applyRainWateringToFarm(farm, dayNumber) {
  if (!farm || typeof farm !== 'object') return;
  if (!Array.isArray(farm.gridItems) || !Array.isArray(farm.gridWateredDay) || !Array.isArray(farm.gridWateredCount)) {
    return;
  }
  for (let i = 0; i < farm.gridItems.length; i += 1) {
    if (!farm.gridItems[i]) continue;
    if (farm.gridWateredDay[i] === dayNumber) continue;
    farm.gridWateredDay[i] = dayNumber;
    farm.gridWateredCount[i] = Math.max(0, Number(farm.gridWateredCount[i]) || 0) + 1;
  }
}

function applyDailyWeatherEffects(state, addMessage) {
  const dayNumber = Math.max(1, Number(state.player?.day) || 1);
  const weatherId = normalizeWeatherId(state.weather?.id);

  if (weatherId !== WEATHER_IDS.RAIN) return;

  if (state.farms && typeof state.farms === 'object') {
    Object.values(state.farms).forEach((farm) => {
      applyRainWateringToFarm(farm, dayNumber);
    });
  } else {
    applyRainWateringToFarm(state, dayNumber);
  }

  addMessage({
    id: 'weather.rain_today',
    meta: {
      speaker: 'farmer',
      category: 'weather',
      priority: 'normal',
      replaceKey: 'weather:today'
    }
  });
}

export function nextDayAction(deps) {
  const {
    state,
    updateNetWorth,
    playDayTransition,
    syncGuidedUnlocks,
    getCurrentDaySnapshot,
    isShopItemUnlocked,
    getFatigueFromEnergy,
    formatEnergyValue,
    addMessage,
    updateMarketPressureForNextDay,
    generateDailyMarketRoll,
    getDailyRollSummaryText,
    showDailyMarketRollModal,
    ensurePlayerProgressState,
    resetLowEnergyNoticeDay,
    ensureShopEntryMarketFields,
    isShopEntryPriceRecoveryActive,
    applyShopEntryPriceRecoveryStep,
    applyDailyMarketRollToShop,
    emitEconomyAlert,
    getBestRollOpportunityText,
    generateDailyTip,
    evaluateGoals,
    saveState,
    renderAll
  } = deps;

  updateNetWorth();
  playDayTransition();
  syncGuidedUnlocks();
  const daySummaryStart = (state.dayStartSnapshot && typeof state.dayStartSnapshot === 'object')
    ? state.dayStartSnapshot
    : getCurrentDaySnapshot();
  const preRestCash = Number(state.player?.cash) || 0;

  const previousPrices = new Map();
  state.shop.forEach((entry) => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    previousPrices.set(entry.itemId, Number(entry.price) || 0);
  });
  const fatigue = getFatigueFromEnergy();
  state.lastRollFatiguePercent = fatigue.fatiguePercent;
  state.lastRollImpactMultiplier = fatigue.impactMultiplier;
  addMessage({
    id: 'economy.roll_strength',
    vars: {
      fatiguePercent: fatigue.fatiguePercent,
      energySpent: formatEnergyValue(fatigue.energySpent),
      energyMax: formatEnergyValue(fatigue.energyMax)
    },
    meta: { speaker: 'farmer', category: 'economy', priority: 'normal' }
  });

  updateMarketPressureForNextDay();
  const dailyRoll = generateDailyMarketRoll(fatigue.impactMultiplier, fatigue.impactPercent);
  const rollSummary = getDailyRollSummaryText(dailyRoll, fatigue.fatiguePercent);
  if (dailyRoll.picks.length > 0) {
    addMessage({
      id: 'economy.market_roll',
      vars: { rollSummary },
      meta: {
        speaker: 'farmer',
        category: 'economy',
        priority: 'high'
      }
    });
  }

  const nextDayWeatherId = normalizeWeatherId(state.nextDayWeather?.id || rollWeatherId());
  state.player.day += 1;
  resetLowEnergyNoticeDay();
  ensurePlayerProgressState();
  state.player.energy = state.player.energyMax;
  state.dayActionCount = 0;
  state.dayEnergySpent = 0;
  const dowIndex = (state.player.day - 1) % 7;
  if (dowIndex === 0 && state.player.day !== 1) state.player.week += 1;
  state.weather = {
    id: nextDayWeatherId,
    rolledOnDay: Math.max(1, Number(state.player.day) || 1)
  };
  state.nextDayWeather = {
    id: rollWeatherId(),
    rolledOnDay: Math.max(1, Number(state.player.day) || 1),
    day: Math.max(1, Number(state.player.day) || 1) + 1
  };
  applyDailyWeatherEffects(state, addMessage);

  state.shop.forEach((entry) => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    ensureShopEntryMarketFields(entry);
    entry.priceSum = (entry.priceSum || 0) + entry.price;
    entry.daysCount = (entry.daysCount || 0) + 1;
  });
  applyDailyMarketRollToShop(dailyRoll);
  const rolledItemIds = dailyRoll && dailyRoll.byItem instanceof Map
    ? new Set(dailyRoll.byItem.keys())
    : new Set();
  state.shop.forEach((entry) => {
    ensureShopEntryMarketFields(entry);
    if (!isShopItemUnlocked(entry.itemId)) return;
    const item = state.items.find((it) => it.id === entry.itemId);
    const basePrice = Math.max(0.01, Number(item?.price) || Number(entry.price) || 0.01);
    if (rolledItemIds.has(entry.itemId)) {
      entry.priceRecoveryTarget = basePrice;
      entry.priceRecoveryDaysRemaining = ROLL_MEAN_REVERSION_DAYS;
      entry.price = Math.max(0.01, Number(entry.price) || 0.01);
      return;
    }
    if (isShopEntryPriceRecoveryActive(entry)) {
      applyShopEntryPriceRecoveryStep(entry);
    }
    entry.price = Math.max(0.01, Number(entry.price) || 0.01);
  });

  updateNetWorth();
  const priceMoves = [];
  state.shop.forEach((entry) => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    const previous = previousPrices.get(entry.itemId);
    if (typeof previous !== 'number' || previous <= 0) return;
    const current = Number(entry.price) || 0;
    const pctChange = (current - previous) / previous;
    const item = state.items.find((it) => it.id === entry.itemId);
    priceMoves.push({
      itemId: entry.itemId,
      itemName: item ? item.name : `Item ${entry.itemId}`,
      pctChange
    });
  });
  state.lastPriceMovesByItem = priceMoves.reduce((acc, move) => {
    const itemIdKey = String(move?.itemId ?? '');
    if (!itemIdKey) return acc;
    acc[itemIdKey] = Number(move?.pctChange) || 0;
    return acc;
  }, {});
  emitEconomyAlert(priceMoves);
  if (dailyRoll.picks.length > 0) {
    state.dailyMarketRollHistory.push({
      day: Number(state.player.day) || 1,
      week: Number(state.player.week) || 1,
      picks: dailyRoll.picks,
      summary: rollSummary
    });
    if (state.dailyMarketRollHistory.length > 30) {
      state.dailyMarketRollHistory = state.dailyMarketRollHistory.slice(-30);
    }
  }
  const daySummary = {
    day: Number(daySummaryStart.day) || Math.max(1, Number(state.player.day) - 1),
    itemsSold: Math.max(0, Number(state.daySalesCount) || 0),
    salesTotal: Math.max(0, Number(state.daySalesTotal) || 0),
    cashDelta: preRestCash - (Number(daySummaryStart.cash) || 0),
    topSale: state.dayTopSale || null,
    nextOpportunity: getBestRollOpportunityText(dailyRoll)
  };
  if (!Array.isArray(state.daySummaryHistory)) state.daySummaryHistory = [];
  state.daySummaryHistory.push(daySummary);
  if (state.daySummaryHistory.length > 7) state.daySummaryHistory = state.daySummaryHistory.slice(-7);
  state.pendingDaySummary = daySummary;
  showDailyMarketRollModal(dailyRoll, rollSummary, fatigue.fatiguePercent, daySummary);

  generateDailyTip(dowIndex);
  state.daySalesCount = 0;
  state.daySalesTotal = 0;
  state.dayTopSale = null;
  evaluateGoals();
  syncGuidedUnlocks();
  state.dayStartSnapshot = getCurrentDaySnapshot();
  saveState();
  renderAll();
  state.pendingDaySummary = null;
}
