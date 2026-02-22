export function initialiseStateAction(deps) {
  const {
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

  state.player = loadFromStorage('player', null) ?? clone(DEFAULT_DATA.player);
  state.items = loadFromStorage('items', null) ?? clone(DEFAULT_DATA.items);
  state.shop = loadFromStorage('shop', null) ?? clone(DEFAULT_DATA.shop);
  state.inventory = loadFromStorage('inventory', null) ?? clone(DEFAULT_DATA.inventory);
  state.newsEvents = loadFromStorage('newsEvents', null) ?? [];
  state.store = loadFromStorage('store', null) ?? clone(DEFAULT_DATA.store);
  state.goals = loadFromStorage('goals', null) ?? clone(DEFAULT_DATA.goals);
  state.goalsClaimed = loadFromStorage('goalsClaimed', null) ?? {};
  state.unlockedTools = loadFromStorage('unlockedTools', null) ?? getDefaultUnlockedTools();
  state.unlockedShopItems = loadFromStorage('unlockedShopItems', null) ?? getDefaultUnlockedShopItems(state.items);
  state.freePurchasesByItem = loadFromStorage('freePurchasesByItem', null) ?? {};
  state.goalFlags = loadFromStorage('goalFlags', null) ?? {};
  state.goalStats = loadFromStorage('goalStats', null) ?? { harvestCount: 0, itemsHarvested: {} };
  state.dayActionCount = Math.max(0, Number(loadFromStorage('dayActionCount', null) ?? 0) || 0);
  state.dayEnergySpent = Math.max(0, Number(loadFromStorage('dayEnergySpent', null) ?? 0) || 0);
  state.dailyMarketRollHistory = loadFromStorage('dailyMarketRollHistory', null) ?? [];
  state.lastRollFatiguePercent = Math.max(0, Number(loadFromStorage('lastRollFatiguePercent', null) ?? 0) || 0);
  state.lastRollImpactMultiplier = Math.max(0, Number(loadFromStorage('lastRollImpactMultiplier', null) ?? 1) || 1);
  state.dayStartSnapshot = loadFromStorage('dayStartSnapshot', null);
  hydrateDaySalesState(state, loadFromStorage);
  state.newsHistory = loadFromStorage('newsHistory', null) ?? clone(DEFAULT_DATA.newsHistory);
  ensurePlayerProgressState();

  const itemMergeResult = mergeItemAssetsWithDefaults(state.items, DEFAULT_DATA.items);
  if (itemMergeResult.changed) {
    state.items = itemMergeResult.items;
    saveToStorage('items', state.items);
  }
  const storeMergeResult = mergeStoreCosmeticsWithDefaults(state.store, DEFAULT_DATA.store);
  if (storeMergeResult.changed) {
    state.store = storeMergeResult.store;
    saveToStorage('store', state.store);
  }
  const goalMergeResult = mergeGoalsWithDefaults(state.goals, DEFAULT_DATA.goals);
  if (goalMergeResult.changed) {
    state.goals = goalMergeResult.goals;
    saveToStorage('goals', state.goals);
  }
  if (Array.isArray(state.items)) {
    let rarityChanged = false;
    const normalized = state.items.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const normalizedRarity = normalizeRarity(item.rarity);
      if (item.rarity !== normalizedRarity) {
        rarityChanged = true;
        return { ...item, rarity: normalizedRarity };
      }
      return item;
    });
    if (rarityChanged) {
      state.items = normalized;
      saveToStorage('items', state.items);
    }
  }

  const defaultItem = DEFAULT_DATA.items[0];
  const savedItem = Array.isArray(state.items) ? state.items[0] : null;
  const itemsMatch = Array.isArray(state.items)
    && state.items.length === DEFAULT_DATA.items.length
    && savedItem
    && savedItem.id === defaultItem.id;
  if (!itemsMatch) {
    state.items = mergeItemAssetsWithDefaults(clone(DEFAULT_DATA.items), DEFAULT_DATA.items).items;
    state.shop = clone(DEFAULT_DATA.shop);
    state.inventory = clone(DEFAULT_DATA.inventory);
    saveState();
  }

  const oldGrid = loadFromStorage('grid', null);
  const legacyFarmOne = normalizeFarmState({
    gridUnlocked: Array.isArray(loadFromStorage('gridUnlocked', null))
      ? loadFromStorage('gridUnlocked', null)
      : (Array.isArray(oldGrid) ? oldGrid : null),
    gridItems: loadFromStorage('gridItems', null),
    gridPlantedDay: loadFromStorage('gridPlantedDay', null),
    gridWateredDay: loadFromStorage('gridWateredDay', null),
    gridWateredCount: loadFromStorage('gridWateredCount', null),
    gridMiningHits: loadFromStorage('gridMiningHits', null),
    gridRarity: loadFromStorage('gridRarity', null),
    gridPurchasePrice: loadFromStorage('gridPurchasePrice', null)
  });
  const savedFarms = loadFromStorage('farms', null);
  const normalizedSavedPrimary = normalizeFarmState(savedFarms?.[FARM_PRIMARY_ID]);
  const normalizedSavedSecondary = normalizeFarmState(savedFarms?.[FARM_SECONDARY_ID]);
  const hasSavedFarmCollection = !!(savedFarms && typeof savedFarms === 'object');
  const hasSavedPrimaryFarm = !!(hasSavedFarmCollection && savedFarms[FARM_PRIMARY_ID]);
  state.farms = {
    [FARM_PRIMARY_ID]: hasSavedPrimaryFarm ? normalizedSavedPrimary : legacyFarmOne,
    [FARM_SECONDARY_ID]: normalizedSavedSecondary
  };
  if (hasSavedPrimaryFarm) {
    const primaryFarm = state.farms[FARM_PRIMARY_ID];
    let rarityBackfillChanged = false;
    if (
      primaryFarm
      && Array.isArray(primaryFarm.gridRarity)
      && Array.isArray(primaryFarm.gridItems)
      && Array.isArray(legacyFarmOne.gridRarity)
    ) {
      for (let i = 0; i < primaryFarm.gridRarity.length; i += 1) {
        if (!primaryFarm.gridItems[i]) continue;
        const current = normalizeRarity(primaryFarm.gridRarity[i]);
        const legacy = normalizeRarity(legacyFarmOne.gridRarity[i]);
        if (!current && legacy) {
          primaryFarm.gridRarity[i] = legacy;
          rarityBackfillChanged = true;
        }
      }
    }
    if (rarityBackfillChanged) {
      saveToStorage('farms', state.farms);
      saveToStorage('gridRarity', primaryFarm.gridRarity);
    }
  }
  state.secondFarmPurchased = !!loadFromStorage('secondFarmPurchased', null);
  if (!state.secondFarmPurchased) {
    const secondaryUnlocks = getUnlockedTileCountForFarm(FARM_SECONDARY_ID);
    const secondaryItems = getFarmState(FARM_SECONDARY_ID).gridItems.filter(Boolean).length;
    if (secondaryUnlocks > 0 || secondaryItems > 0) {
      state.secondFarmPurchased = true;
    }
  }
  if (!state.secondFarmPurchased) {
    state.farms[FARM_SECONDARY_ID] = createEmptyFarmState();
  }
  state.activeFarmId = Number(loadFromStorage('activeFarmId', null) || FARM_PRIMARY_ID) === FARM_SECONDARY_ID
    ? FARM_SECONDARY_ID
    : FARM_PRIMARY_ID;
  if (state.activeFarmId === FARM_SECONDARY_ID && !isFarmTwoPurchased()) {
    state.activeFarmId = FARM_PRIMARY_ID;
  }
  applyFarmStateToActiveGrid(state.activeFarmId);
  state.activeTool = loadFromStorage('activeTool', null);
  if (!TOOL_LIST.includes(state.activeTool)) {
    state.activeTool = TOOL_GLOVE;
  }
  if (!state.unlockedTools || typeof state.unlockedTools !== 'object') {
    state.unlockedTools = getDefaultUnlockedTools();
  }
  if (!state.unlockedShopItems || typeof state.unlockedShopItems !== 'object') {
    state.unlockedShopItems = getDefaultUnlockedShopItems(state.items);
  }
  const defaultShopUnlocks = getDefaultUnlockedShopItems(state.items);
  Object.keys(defaultShopUnlocks).forEach((itemId) => {
    if (!(itemId in state.unlockedShopItems)) {
      state.unlockedShopItems[itemId] = defaultShopUnlocks[itemId];
    }
  });
  if (syncGoalLockedShopUnlocks()) {
    saveToStorage('unlockedShopItems', state.unlockedShopItems);
    saveToStorage('shop', state.shop);
  }
  if (!state.freePurchasesByItem || typeof state.freePurchasesByItem !== 'object') {
    state.freePurchasesByItem = {};
  }
  if (Array.isArray(state.shop)) {
    let shopChanged = false;
    state.shop.forEach((entry) => {
      if (ensureShopEntryMarketFields(entry)) {
        shopChanged = true;
      }
    });
    if (shopChanged) {
      saveToStorage('shop', state.shop);
    }
  }
  normalizeGoalStateShape(state, DEFAULT_DATA.goals);
  if (!Array.isArray(state.dailyMarketRollHistory)) {
    state.dailyMarketRollHistory = [];
  }
  normalizeDaySalesState(state);
  if (!isToolUnlocked(TOOL_WATERING) && state.activeTool === TOOL_WATERING) {
    state.activeTool = TOOL_GLOVE;
  }
  const currentDay = Number(state.player?.day) || 1;
  const validDayStart = state.dayStartSnapshot
    && typeof state.dayStartSnapshot === 'object'
    && Number(state.dayStartSnapshot.day) === currentDay;
  if (!validDayStart) {
    state.dayStartSnapshot = getCurrentDaySnapshot();
  }
  state.goalCelebrationQueue = [];
  state.activeGoalCelebration = null;
  setSelectedGridCellIndex(null);
  setSelectedShopItemId(null);
  setSelectionPulseId(null);
  clearGoalCelebrationSparkles();
  setGoalCelebrationOpen(false);
}
