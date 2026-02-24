import {
  consumeSeedBuyStreakMessageId,
  shouldSuppressSeedStandardBuyMessage
} from './seed_buy_streak_controller.js';
import { isProduceItem, getNormalizedItemTableKey } from '../content/item_types.js';
import { ensureInfrastructureMetaForPlacedItem } from './watering_infrastructure.js';

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
  const item = state.items.find((it) => it.id === selectedShopItemId);
  if (!item) return;
  const isProduce = isProduceItem(item);
  const tableKey = getNormalizedItemTableKey(item);
  const shopEntry = Array.isArray(state.shop)
    ? state.shop.find((entry) => entry.itemId === selectedShopItemId)
    : null;
  if (isProduce && !shopEntry) return;
  const baseBuyPrice = isProduce
    ? Math.max(0, Number(shopEntry?.price) || 0)
    : Math.max(0, Number(item.price) || 0);
  const freeQty = isProduce ? Math.min(getFreePurchaseCount(selectedShopItemId), 1) : 0;
  const totalCost = baseBuyPrice * (1 - freeQty);
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
  if (!consumeEnergy(1, isProduce ? 'plant a seed' : 'place an item')) return;
  registerDayAction();
  if (state.goalFlags && typeof state.goalFlags === 'object') {
    state.goalFlags[guidedPlantedFlag] = true;
  }
  if (freeQty > 0) consumeFreePurchases(selectedShopItemId, 1);
  state.player.cash -= totalCost;
  state.gridItems[cellIndex] = selectedShopItemId;
  setSelectedGridCellIndex(cellIndex);
  if (Array.isArray(state.gridPurchasePrice)) state.gridPurchasePrice[cellIndex] = totalCost;
  if (Array.isArray(state.gridPlacedMeta)) {
    state.gridPlacedMeta[cellIndex] = isProduce
      ? null
      : ensureInfrastructureMetaForPlacedItem(item, {
        tableKey,
        itemType: String(item.type || '').trim().toLowerCase() || 'unknown'
      });
  }
  if (Array.isArray(state.gridRarity)) state.gridRarity[cellIndex] = null;
  if (Array.isArray(state.gridPlantedDay)) {
    state.gridPlantedDay[cellIndex] = isProduce ? state.player.day : null;
  }
  if (Array.isArray(state.gridWateredCount)) {
    if (isProduce) {
      const wateredToday = Array.isArray(state.gridWateredDay) && state.gridWateredDay[cellIndex] === state.player.day;
      state.gridWateredCount[cellIndex] = wateredToday ? 1 : 0;
    } else {
      state.gridWateredCount[cellIndex] = 0;
    }
  }
  if (isProduce && String(state.weather?.id || '') === 'rain') {
    if (Array.isArray(state.gridWateredDay)) state.gridWateredDay[cellIndex] = state.player.day;
    if (Array.isArray(state.gridWateredCount)) state.gridWateredCount[cellIndex] = 1;
  } else if (!isProduce && Array.isArray(state.gridWateredDay)) {
    state.gridWateredDay[cellIndex] = null;
  }
  awardPlayerXp(xpRewards.plant);
  updateNetWorth();
  evaluateGoals();
  saveState();
  const streakMessageId = isProduce
    ? consumeSeedBuyStreakMessageId(state.player.day, selectedShopItemId, 1, item)
    : null;
  const suppressStandardBuyMessage = isProduce
    ? shouldSuppressSeedStandardBuyMessage(selectedShopItemId, item)
    : false;

  if (!suppressStandardBuyMessage) {
    if (freeQty > 0) {
      addMessage({
        id: 'commerce.purchased_and_placed_free',
        vars: { itemName: item.name },
        meta: { speaker: 'farmer' }
      });
    } else {
      addMessage({
        id: 'commerce.purchased_and_placed',
        vars: { itemName: item.name, price: baseBuyPrice.toFixed(2) },
        meta: { speaker: 'farmer' }
      });
    }
  }

  if (isProduce && streakMessageId === 'commerce.buy_streak_seed') {
    addMessage({
      id: 'commerce.buy_streak_seed',
      vars: { itemName: item.name }
    });
  } else if (isProduce && streakMessageId === 'commerce.buy_streak_seed_mixed') {
    addMessage({ id: 'commerce.buy_streak_seed_mixed' });
  }
  if (String(item?.type || '').trim().toLowerCase() === 'sprinkler') {
    if (!state.goalFlags || typeof state.goalFlags !== 'object') state.goalFlags = {};
    if (!state.goalFlags.sprinklerTutorialShown) {
      state.goalFlags.sprinklerTutorialShown = true;
      addMessage({
        id: 'tip.sprinkler_dawn_refill',
        meta: {
          speaker: 'farmer',
          category: 'tips',
          priority: 'normal',
          replaceKey: 'tip:sprinkler-basics'
        }
      });
    }
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
