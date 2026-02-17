export function resetShopEntryToBasePriceAction(state, itemId) {
  if (!Array.isArray(state.shop) || !Array.isArray(state.items)) return;
  const shopEntry = state.shop.find((entry) => entry && entry.itemId === itemId);
  const item = state.items.find((it) => it && it.id === itemId);
  if (!shopEntry || !item) return;
  const basePrice = Math.max(0.01, Number(item.price) || Number(shopEntry.price) || 0.01);
  shopEntry.price = basePrice;
  shopEntry.priceSum = 0;
  shopEntry.daysCount = 0;
  shopEntry.priceRecoveryDaysRemaining = 0;
  shopEntry.priceRecoveryTarget = null;
}

export function ensureShopEntryMarketFieldsAction(entry) {
  if (!entry || typeof entry !== 'object') return false;
  let changed = false;
  const price = Math.max(0.01, Number(entry.price) || 0.01);
  if (entry.price !== price) {
    entry.price = price;
    changed = true;
  }
  const priceSum = Math.max(0, Number(entry.priceSum) || 0);
  if (entry.priceSum !== priceSum) {
    entry.priceSum = priceSum;
    changed = true;
  }
  const daysCount = Math.max(0, Math.floor(Number(entry.daysCount) || 0));
  if (entry.daysCount !== daysCount) {
    entry.daysCount = daysCount;
    changed = true;
  }
  const recoveryDaysRemaining = Math.max(0, Math.floor(Number(entry.priceRecoveryDaysRemaining) || 0));
  if (entry.priceRecoveryDaysRemaining !== recoveryDaysRemaining) {
    entry.priceRecoveryDaysRemaining = recoveryDaysRemaining;
    changed = true;
  }
  const rawRecoveryTarget = Number(entry.priceRecoveryTarget);
  const recoveryTarget = recoveryDaysRemaining > 0
    ? Math.max(0.01, Number.isFinite(rawRecoveryTarget) ? rawRecoveryTarget : price)
    : null;
  if (entry.priceRecoveryTarget !== recoveryTarget) {
    entry.priceRecoveryTarget = recoveryTarget;
    changed = true;
  }
  return changed;
}

export function getShopEntryAveragePriceAction(entry) {
  if (!entry || typeof entry !== 'object') return 0;
  const daysCount = Math.max(0, Math.floor(Number(entry.daysCount) || 0));
  const priceSum = Math.max(0, Number(entry.priceSum) || 0);
  if (daysCount > 0 && priceSum > 0) {
    return Math.max(0.01, priceSum / daysCount);
  }
  return Math.max(0.01, Number(entry.price) || 0.01);
}

export function isShopEntryPriceRecoveryActiveAction(entry) {
  return !!(entry && Number(entry.priceRecoveryDaysRemaining) > 0 && Number(entry.priceRecoveryTarget) > 0);
}

export function startShopEntryPriceRecoveryAction(entry, targetPrice, priceRecoveryDays) {
  if (!entry || typeof entry !== 'object') return false;
  const target = Math.max(0.01, Number(targetPrice) || 0.01);
  const current = Math.max(0.01, Number(entry.price) || 0.01);
  if (Math.abs(target - current) < 0.0001) return false;
  entry.priceRecoveryDaysRemaining = priceRecoveryDays;
  entry.priceRecoveryTarget = target;
  return true;
}

export function applyShopEntryPriceRecoveryStepAction(entry, isShopEntryPriceRecoveryActive) {
  if (!isShopEntryPriceRecoveryActive(entry)) return false;
  const daysRemaining = Math.max(1, Math.floor(Number(entry.priceRecoveryDaysRemaining) || 1));
  const target = Math.max(0.01, Number(entry.priceRecoveryTarget) || 0.01);
  const current = Math.max(0.01, Number(entry.price) || 0.01);
  const delta = (target - current) / daysRemaining;
  entry.price = Math.max(0.01, current + delta);
  entry.priceRecoveryDaysRemaining = Math.max(0, daysRemaining - 1);
  if (entry.priceRecoveryDaysRemaining > 0) return false;
  entry.price = target;
  entry.priceRecoveryTarget = null;
  entry.priceSum = target;
  entry.daysCount = 1;
  return true;
}

export function getDefaultUnlockedShopItemsAction(items, playerLevelRaw = 1) {
  const unlocked = {};
  if (!Array.isArray(items)) return unlocked;
  const playerLevel = Math.max(1, Math.floor(Number(playerLevelRaw) || 1));
  const unlockOrder = items
    .filter((item) => item && typeof item.id === 'number')
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((item) => item.id);
  unlockOrder.forEach((itemId, index) => {
    unlocked[itemId] = index < playerLevel;
  });
  return unlocked;
}

export function getGoalRewardUnlockedItemIdsAction(goal) {
  return [];
}

export function hasPlayerHandledItemAction(state, itemId) {
  const inventoryQty = Array.isArray(state.inventory)
    ? state.inventory
      .filter((entry) => entry && entry.itemId === itemId)
      .reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0)
    : 0;
  const gridQty = Array.isArray(state.gridItems)
    ? state.gridItems.reduce((sum, gridItemId) => sum + (gridItemId === itemId ? 1 : 0), 0)
    : 0;
  const harvestedQty = Number(state.goalStats?.itemsHarvested?.[String(itemId)]) || 0;
  return inventoryQty > 0 || gridQty > 0 || harvestedQty > 0;
}

export function syncGoalLockedShopUnlocksAction(
  state,
  _getGoalRewardUnlockedItemIds,
  _hasPlayerHandledItem,
  resetShopEntryToBasePrice
) {
  if (!Array.isArray(state.items)) return false;
  if (!state.unlockedShopItems || typeof state.unlockedShopItems !== 'object') {
    state.unlockedShopItems = {};
  }
  const playerLevel = Math.max(1, Math.floor(Number(state.player?.playerLevel) || 1));
  const unlockOrder = state.items
    .filter((item) => item && typeof item.id === 'number')
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((item) => item.id);
  const unlockedByLevel = new Set(unlockOrder.slice(0, playerLevel));
  let changed = false;
  state.items.forEach((item) => {
    if (!item || typeof item.id !== 'number') return;
    const itemId = item.id;
    const currentlyUnlocked = !!state.unlockedShopItems[itemId];
    const shouldUnlock = unlockedByLevel.has(itemId);
    if (currentlyUnlocked !== shouldUnlock) {
      state.unlockedShopItems[itemId] = shouldUnlock;
      resetShopEntryToBasePrice(itemId);
      changed = true;
    }
  });
  Object.keys(state.unlockedShopItems).forEach((itemIdText) => {
    const itemId = Number(itemIdText);
    if (!Number.isInteger(itemId)) return;
    if (unlockOrder.includes(itemId)) return;
    delete state.unlockedShopItems[itemIdText];
    changed = true;
  });
  return changed;
}
