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
    clampMarketBias,
    getMarketDirectionalBias,
    applyDailyMarketRollToShop,
    getShopEntryAveragePrice,
    startShopEntryPriceRecovery,
    priceCrashThresholdPercent,
    priceRecoveryDays,
    emitEconomyAlert,
    getBestRollOpportunityText,
    generateDailyTip,
    evaluateGoals,
    saveState,
    renderAll,
    showDaySummaryModal
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
  addMessage(
    `Market fatigue applied: ${fatigue.fatiguePercent}% reduced roll impact from leftover energy (${formatEnergyValue(fatigue.energy)}/${formatEnergyValue(fatigue.energyMax)}).`,
    { speaker: 'farmer', category: 'economy', priority: 'normal' }
  );

  updateMarketPressureForNextDay();
  const dailyRoll = generateDailyMarketRoll(fatigue.impactMultiplier);
  const rollSummary = getDailyRollSummaryText(dailyRoll, fatigue.fatiguePercent);
  if (dailyRoll.picks.length > 0) {
    showDailyMarketRollModal(dailyRoll, rollSummary, fatigue.fatiguePercent);
    addMessage(`Market roll: ${rollSummary}`, {
      speaker: 'farmer',
      category: 'economy',
      priority: 'high'
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
    if (isShopEntryPriceRecoveryActive(entry)) {
      const completed = applyShopEntryPriceRecoveryStep(entry);
      if (completed) {
        const item = state.items.find((it) => it.id === entry.itemId);
        const itemName = item ? item.name : `Item ${entry.itemId}`;
        addMessage(`${itemName} stabilized near its average after a price crash.`, {
          speaker: 'farmer',
          category: 'economy',
          priority: 'normal'
        });
      }
      return;
    }
    const bias = getMarketDirectionalBias(entry.itemId);
    const upChance = clampMarketBias(0.5 + (bias.upward * 0.28) - (bias.downward * 0.32), 0.08, 0.92);
    const swingMagnitude = Math.random() * 0.05;
    const signedSwing = Math.random() < upChance ? swingMagnitude : -swingMagnitude;
    const drift = (bias.upward * 0.012) - (bias.downward * 0.018);
    const randomFactor = 1 + signedSwing + drift;
    entry.price *= randomFactor;
    entry.price = Math.max(0.01, entry.price);
  });
  applyDailyMarketRollToShop(dailyRoll);
  state.shop.forEach((entry) => {
    ensureShopEntryMarketFields(entry);
    entry.price = Math.max(0.01, Number(entry.price) || 0.01);
    if (!isShopItemUnlocked(entry.itemId)) return;
    if (isShopEntryPriceRecoveryActive(entry)) return;
    const avgPrice = getShopEntryAveragePrice(entry);
    if (avgPrice <= 0) return;
    const deviationPct = ((entry.price - avgPrice) / avgPrice) * 100;
    if (Math.abs(deviationPct) < priceCrashThresholdPercent) return;
    if (!startShopEntryPriceRecovery(entry, avgPrice)) return;
    const item = state.items.find((it) => it.id === entry.itemId);
    const itemName = item ? item.name : `Item ${entry.itemId}`;
    const direction = deviationPct >= 0 ? 'above' : 'below';
    addMessage(
      `${itemName} moved ${Math.abs(deviationPct).toFixed(0)}% ${direction} average. Market crash reset started (back to average in ${priceRecoveryDays} days).`,
      { speaker: 'farmer', category: 'economy', priority: 'high' }
    );
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

  generateDailyTip(dowIndex);
  state.daySalesCount = 0;
  state.daySalesTotal = 0;
  state.dayTopSale = null;
  evaluateGoals();
  syncGuidedUnlocks();
  state.dayStartSnapshot = getCurrentDaySnapshot();
  saveState();
  renderAll();
  if (dailyRoll.picks.length === 0 && state.pendingDaySummary) {
    showDaySummaryModal(state.pendingDaySummary);
    state.pendingDaySummary = null;
  }
}
