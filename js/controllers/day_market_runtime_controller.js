export function createDayMarketRuntimeController(deps) {
  const {
    state,
    trackActionDuration,
    nextDayAction,
    getHeldQuantityForItemState,
    getMarketPressureRecordState,
    getMarketDirectionalBiasState,
    registerItemSalePressureState,
    updateMarketPressureForNextDayState,
    getDailyRollItemWeightState,
    getFatigueFromEnergyState,
    generateDailyMarketRollState,
    applyDailyMarketRollToShopState,
    getDailyRollSummaryTextState,
    getBestRollOpportunityTextState,
    clampMarketBias,
    isShopItemUnlocked,
    getHarvestImagePath,
    defaultNewsEvents,
    ensureShopEntryMarketFields,
    isShopEntryPriceRecoveryActive,
    updateNetWorth,
    playDayTransition,
    syncGuidedUnlocks,
    getCurrentDaySnapshot,
    formatEnergyValue,
    addMessage,
    showDailyMarketRollModal,
    ensurePlayerProgressState,
    resetLowEnergyNoticeDay,
    applyShopEntryPriceRecoveryStep,
    getShopEntryAveragePrice,
    startShopEntryPriceRecovery,
    priceCrashThresholdPercent,
    priceRecoveryDays,
    emitEconomyAlert,
    generateDailyTip,
    evaluateGoals,
    saveState,
    renderAll,
    showDaySummaryModal
  } = deps;

  function getHeldQuantityForItem(itemId) {
    return getHeldQuantityForItemState(state, itemId);
  }

  function getMarketPressureRecord(itemId) {
    return getMarketPressureRecordState(state, itemId, clampMarketBias);
  }

  function getMarketDirectionalBias(itemId) {
    return getMarketDirectionalBiasState(state, itemId, clampMarketBias);
  }

  function registerItemSalePressure(itemId, quantity) {
    registerItemSalePressureState(state, itemId, quantity);
  }

  function updateMarketPressureForNextDay() {
    updateMarketPressureForNextDayState({
      state,
      clampMarketBias,
      holdingLotThreshold: deps.holdingLotThreshold,
      holdBiasQtyRange: deps.holdBiasQtyRange,
      holdBiasStreakDays: deps.holdBiasStreakDays,
      sellShockQtyRange: deps.sellShockQtyRange
    });
  }

  function getDailyRollItemWeight(itemId) {
    return getDailyRollItemWeightState(state, itemId, clampMarketBias);
  }

  function getUnlockedRollItems() {
    return deps.getUnlockedRollItems();
  }

  function getFatigueFromEnergy() {
    return getFatigueFromEnergyState(state);
  }

  function generateDailyMarketRoll(impactMultiplier = 1, impactPercent = null) {
    return generateDailyMarketRollState({
      state,
      impactMultiplier,
      impactPercent,
      isShopItemUnlocked,
      getDailyRollItemWeight,
      getMarketDirectionalBias,
      clampMarketBias,
      getHarvestImagePath,
      defaultNewsEvents
    });
  }

  function applyDailyMarketRollToShop(rollResult) {
    applyDailyMarketRollToShopState({
      state,
      rollResult,
      isShopItemUnlocked,
      ensureShopEntryMarketFields,
      isShopEntryPriceRecoveryActive
    });
  }

  function getDailyRollSummaryText(rollResult, fatiguePercent = 0) {
    return getDailyRollSummaryTextState(rollResult, fatiguePercent);
  }

  function getBestRollOpportunityText(rollResult) {
    return getBestRollOpportunityTextState(rollResult);
  }

  function nextDay() {
    const perfStart = performance.now();
    try {
      nextDayAction({
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
      });
    } finally {
      trackActionDuration('nextDay', performance.now() - perfStart);
    }
  }

  return {
    getHeldQuantityForItem,
    getMarketPressureRecord,
    getMarketDirectionalBias,
    registerItemSalePressure,
    updateMarketPressureForNextDay,
    getDailyRollItemWeight,
    getUnlockedRollItems,
    getFatigueFromEnergy,
    generateDailyMarketRoll,
    applyDailyMarketRollToShop,
    getDailyRollSummaryText,
    getBestRollOpportunityText,
    nextDay
  };
}
