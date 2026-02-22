export function createGameplayRuntimeController(deps) {
  const {
    state,
    buyItemAction,
    sellItemAction,
    purchaseCosmeticAction,
    selectCosmeticAction,
    applyThemeAction,
    craftItemAction,
    mineGridTileAction,
    waterGridTileAction,
    purchaseAndPlaceSelectedAction,
    harvestPlantAction,
    produceForLevelAction,
    addResourceToInventoryAction,
    generateNewsEventsAction,
    generateNewsEventsForState,
    defaultNewsEvents,
    isShopItemUnlocked,
    addMessage,
    getFreePurchaseCount,
    consumeFreePurchases,
    registerDayAction,
    updateNetWorth,
    evaluateGoals,
    saveState,
    renderAll,
    pulseHud,
    getHudCenters,
    spawnFloatingText,
    registerSaleEvent,
    registerItemSalePressure,
    consumeEnergy,
    farmSecondaryId,
    getActiveFarmMiningEnergyCost,
    getPlantGrowthState,
    awardPlayerXp,
    xpRewards,
    getTileCenter,
    getGridActionFxTargets,
    spawnBurst,
    spawnRing,
    triggerFxClass,
    showXpGainFeedback,
    selectedShopItemIdGetter,
    selectedGridCellIndexGetter,
    selectedGridCellIndexSetter,
    getGridRarity,
    assignGridRarity,
    getRarityMultiplier,
    getActiveFarmSellMultiplier,
    spawnCoinTravel,
    spawnCoinsForSaleValue,
    playSellItemsToButton,
    guidedFlags,
    getBulkSelectedGridInsightData,
    sellBulkSelectedGridItems,
    getSelectedGridItemInsightData,
    showDaySummaryModal,
    clearGridSelection,
    setMessageJustEmitted,
    saveToStorage
  } = deps;

  function buyItem(itemId, quantity) {
    buyItemAction({
      state,
      itemId,
      quantity,
      isShopItemUnlocked,
      addMessage,
      getFreePurchaseCount,
      consumeFreePurchases,
      registerDayAction,
      updateNetWorth,
      evaluateGoals,
      saveState,
      renderAll,
      pulseHud,
      getHudCenters,
      spawnFloatingText
    });
  }

  function sellItem(itemId, quantity) {
    sellItemAction({
      state,
      itemId,
      quantity,
      registerDayAction,
      registerSaleEvent,
      registerItemSalePressure,
      updateNetWorth,
      evaluateGoals,
      saveState,
      addMessage,
      renderAll,
      pulseHud,
      getHudCenters,
      spawnFloatingText
    });
  }

  function purchaseCosmetic(itemId) {
    purchaseCosmeticAction({
      state,
      itemId,
      saveState,
      addMessage,
      renderAll
    });
  }

  function selectCosmetic(itemId) {
    selectCosmeticAction({
      state,
      itemId,
      applyTheme,
      saveState,
      addMessage,
      renderAll
    });
  }

  function applyTheme(themeId) {
    applyThemeAction(themeId);
  }

  function craftItem(recipeId, quantity) {
    craftItemAction({
      state,
      recipeId,
      quantity,
      saveState,
      addMessage,
      renderAll
    });
  }

  function mineGridTile(index) {
    return mineGridTileAction({
      state,
      index,
      farmSecondaryId,
      getActiveFarmMiningEnergyCost,
      consumeEnergy,
      registerDayAction,
      awardPlayerXp,
      xpRewards,
      addMessage,
      evaluateGoals,
      saveState,
      renderAll,
      getTileCenter,
      getGridActionFxTargets,
      spawnBurst,
      spawnRing,
      triggerFxClass,
      showXpGainFeedback
    });
  }

  function waterGridTile(index) {
    return waterGridTileAction({
      state,
      index,
      getPlantGrowthState,
      consumeEnergy,
      registerDayAction,
      awardPlayerXp,
      xpRewards,
      addMessage,
      saveState,
      renderAll,
      getTileCenter,
      getGridActionFxTargets,
      spawnBurst,
      spawnRing,
      triggerFxClass,
      showXpGainFeedback
    });
  }

  function purchaseAndPlaceSelected(cellIndex) {
    purchaseAndPlaceSelectedAction({
      state,
      selectedShopItemId: selectedShopItemIdGetter(),
      cellIndex,
      setSelectedGridCellIndex: selectedGridCellIndexSetter,
      isShopItemUnlocked,
      addMessage,
      getFreePurchaseCount,
      consumeEnergy,
      registerDayAction,
      guidedPlantedFlag: guidedFlags.planted,
      consumeFreePurchases,
      awardPlayerXp,
      xpRewards,
      updateNetWorth,
      evaluateGoals,
      saveState,
      renderAll,
      getTileCenter,
      getGridActionFxTargets,
      spawnBurst,
      triggerFxClass,
      pulseHud,
      getHudCenters,
      spawnCoinTravel,
      showXpGainFeedback
    });
  }

  async function harvestPlant(cellIndex, sellButtonElement = null) {
    await harvestPlantAction({
      state,
      cellIndex,
      getPlantGrowthState,
      addMessage,
      registerDayAction,
      getGridRarity,
      assignGridRarity,
      getRarityMultiplier,
      getActiveFarmSellMultiplier,
      registerSaleEvent,
      registerItemSalePressure,
      guidedHarvestFlag: guidedFlags.harvest,
      awardPlayerXp,
      xpRewards,
      updateNetWorth,
      evaluateGoals,
      saveState,
      getSelectedGridCellIndex: selectedGridCellIndexGetter,
      setSelectedGridCellIndex: selectedGridCellIndexSetter,
      renderAll,
      getTileCenter,
      spawnBurst,
      spawnRing,
      spawnFloatingText,
      showXpGainFeedback,
      pulseHud,
      getHudCenters,
      spawnCoinsForSaleValue,
      playSellItemsToButton,
      sellButtonElement
    });
  }

  function produceForLevel(level) {
    return produceForLevelAction(state, level);
  }

  function addResourceToInventory(itemId, quantity) {
    addResourceToInventoryAction({
      state,
      itemId,
      quantity,
      addMessage
    });
  }

  function generateNewsEvents() {
    generateNewsEventsAction({
      generateNewsEventsForState,
      state,
      defaultNewsEvents,
      isShopItemUnlocked,
      saveToStorage
    });
  }

  return {
    buyItem,
    sellItem,
    purchaseCosmetic,
    selectCosmetic,
    applyTheme,
    craftItem,
    mineGridTile,
    waterGridTile,
    purchaseAndPlaceSelected,
    harvestPlant,
    produceForLevel,
    addResourceToInventory,
    generateNewsEvents
  };
}
