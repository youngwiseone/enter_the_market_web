export function initialiseStateRuntimeAction(deps) {
  const {
    initialiseStateAction,
    state,
    loadFromStorage,
    clone,
    DEFAULT_DATA,
    getDefaultUnlockedTools,
    getDefaultUnlockedShopItems,
    hydrateDaySalesState,
    ensurePlayerProgressState,
    mergeItemAssetsWithDefaults,
    mergeStoreCosmeticsWithDefaults,
    mergeGoalsWithDefaults,
    normalizeRarity,
    saveToStorage,
    saveState,
    normalizeFarmState,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    getUnlockedTileCountForFarm,
    getFarmState,
    createEmptyFarmState,
    isFarmTwoPurchased,
    applyFarmStateToActiveGrid,
    TOOL_LIST,
    TOOL_GLOVE,
    syncGoalLockedShopUnlocks,
    ensureShopEntryMarketFields,
    isShopItemUnlocked,
    normalizeMarketHistoryState,
    upsertCurrentMarketHistorySnapshotAction,
    normalizeGoalStateShape,
    normalizeDaySalesState,
    isToolUnlocked,
    TOOL_WATERING,
    getCurrentDaySnapshot,
    setSelectedGridCellIndex,
    setSelectedShopItemId,
    setSelectionPulseId,
    clearGoalCelebrationSparkles,
    setGoalCelebrationOpen
  } = deps;

  initialiseStateAction({
    state,
    loadFromStorage,
    clone,
    DEFAULT_DATA,
    getDefaultUnlockedTools,
    getDefaultUnlockedShopItems,
    hydrateDaySalesState,
    ensurePlayerProgressState,
    mergeItemAssetsWithDefaults,
    mergeStoreCosmeticsWithDefaults,
    mergeGoalsWithDefaults,
    normalizeRarity,
    saveToStorage,
    saveState,
    normalizeFarmState,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    getUnlockedTileCountForFarm,
    getFarmState,
    createEmptyFarmState,
    isFarmTwoPurchased,
    applyFarmStateToActiveGrid,
    TOOL_LIST,
    TOOL_GLOVE,
    syncGoalLockedShopUnlocks,
    ensureShopEntryMarketFields,
    isShopItemUnlocked,
    normalizeMarketHistoryState,
    upsertCurrentMarketHistorySnapshotAction,
    normalizeGoalStateShape,
    normalizeDaySalesState,
    isToolUnlocked,
    TOOL_WATERING,
    getCurrentDaySnapshot,
    setSelectedGridCellIndex,
    setSelectedShopItemId,
    setSelectionPulseId,
    clearGoalCelebrationSparkles,
    setGoalCelebrationOpen
  });
}

export function saveStateRuntimeAction(deps) {
  const {
    trackSaveCall,
    updateNetWorth,
    getFarmState,
    createEmptyFarmState,
    isFarmTwoPurchased,
    state,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    persistFullState,
    persistLegacyPrimaryGridState,
    saveToStorage
  } = deps;

  trackSaveCall();
  updateNetWorth();
  const primaryFarm = getFarmState(FARM_PRIMARY_ID);
  const secondaryFarm = isFarmTwoPurchased() ? getFarmState(FARM_SECONDARY_ID) : createEmptyFarmState();
  state.farms = {
    [FARM_PRIMARY_ID]: primaryFarm,
    [FARM_SECONDARY_ID]: secondaryFarm
  };
  persistFullState(saveToStorage, state);
  persistLegacyPrimaryGridState(saveToStorage, primaryFarm);
  saveToStorage('activeTool', state.activeTool);
}
