const ROLL_MEAN_REVERSION_DAYS = 3;

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

  state.player.day += 1;
  resetLowEnergyNoticeDay();
  ensurePlayerProgressState();
  state.player.energy = state.player.energyMax;
  state.dayActionCount = 0;
  const dowIndex = (state.player.day - 1) % 7;
  if (dowIndex === 0 && state.player.day !== 1) state.player.week += 1;

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
