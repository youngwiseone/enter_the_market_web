export function purchaseAndPlaceSelectedAction(deps) {
  const {
    state,
    selectedShopItemId,
    cellIndex,
    setSelectedGridCellIndex,
    isShopItemUnlocked,
    addMessage,
    getFreePurchaseCount,
    consumeEnergy,
    registerDayAction,
    guidedPlantedFlag,
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
  } = deps;

  if (!selectedShopItemId) return;
  if (!isShopItemUnlocked(selectedShopItemId)) {
    addMessage({ id: 'progress.item_not_available' });
    return;
  }
  const shopEntry = state.shop.find((entry) => entry.itemId === selectedShopItemId);
  const item = state.items.find((it) => it.id === selectedShopItemId);
  if (!shopEntry || !item) return;
  const freeQty = Math.min(getFreePurchaseCount(selectedShopItemId), 1);
  const totalCost = shopEntry.price * (1 - freeQty);
  if (state.player.cash < totalCost) {
    addMessage({
      id: 'progress.insufficient_funds',
      meta: {
        speaker: 'player',
        emotion: 'wrong',
        category: 'progress',
        priority: 'high'
      }
    });
    return;
  }
  if (!consumeEnergy(1, 'plant a seed')) return;
  registerDayAction();
  if (state.goalFlags && typeof state.goalFlags === 'object') {
    state.goalFlags[guidedPlantedFlag] = true;
  }
  if (freeQty > 0) consumeFreePurchases(selectedShopItemId, 1);
  state.player.cash -= totalCost;
  state.gridItems[cellIndex] = selectedShopItemId;
  setSelectedGridCellIndex(cellIndex);
  if (Array.isArray(state.gridPurchasePrice)) state.gridPurchasePrice[cellIndex] = totalCost;
  if (Array.isArray(state.gridRarity)) state.gridRarity[cellIndex] = null;
  if (Array.isArray(state.gridPlantedDay)) state.gridPlantedDay[cellIndex] = state.player.day;
  if (Array.isArray(state.gridWateredCount)) {
    const wateredToday = Array.isArray(state.gridWateredDay) && state.gridWateredDay[cellIndex] === state.player.day;
    state.gridWateredCount[cellIndex] = wateredToday ? 1 : 0;
  }
  awardPlayerXp(xpRewards.plant);
  updateNetWorth();
  evaluateGoals();
  saveState();
  if (freeQty > 0) {
    addMessage({
      id: 'commerce.purchased_and_placed_free',
      vars: { itemName: item.name },
      meta: { speaker: 'farmer' }
    });
  } else {
    addMessage({
      id: 'commerce.purchased_and_placed',
      vars: { itemName: item.name, price: shopEntry.price.toFixed(2) },
      meta: { speaker: 'farmer' }
    });
  }
  renderAll();
  const center = getTileCenter(cellIndex);
  if (center) {
    spawnBurst({
      x: center.x,
      y: center.y + 6,
      count: 6,
      imgList: ['resources/effects/dust_puff_01.png', 'resources/effects/dust_puff_02.png'],
      speedRange: [10, 40],
      sizeRange: [8, 14],
      gravity: 30,
      lifeRange: [220, 460]
    });
    const fxTargets = getGridActionFxTargets(cellIndex);
    const cell = fxTargets ? fxTargets.cell : null;
    if (cell) triggerFxClass(cell, 'fx-pop');
  }
  pulseHud(false);
  const hudCenters = getHudCenters();
  if (center && hudCenters.length > 0) spawnCoinTravel(hudCenters[0], center, 5);
  if (center) showXpGainFeedback(xpRewards.plant, center);
}
