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

export function getDefaultUnlockedShopItemsAction(items) {
  const unlocked = {};
  if (!Array.isArray(items)) return unlocked;
  items.forEach((item) => {
    if (!item || typeof item.id !== 'number') return;
    unlocked[item.id] = item.goalLocked !== true;
  });
  return unlocked;
}

export function getGoalRewardUnlockedItemIdsAction(goal) {
  if (!goal || typeof goal !== 'object') return [];
  const reward = goal.reward || {};
  const ids = [];
  if (typeof reward.unlockShopItem === 'number') {
    ids.push(reward.unlockShopItem);
  }
  if (Array.isArray(reward.unlockShopItems)) {
    reward.unlockShopItems.forEach((itemId) => {
      const numericId = Number(itemId);
      if (Number.isInteger(numericId)) {
        ids.push(numericId);
      }
    });
  }
  return ids;
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
  getGoalRewardUnlockedItemIds,
  hasPlayerHandledItem,
  resetShopEntryToBasePrice
) {
  if (!Array.isArray(state.items)) return false;
  if (!state.unlockedShopItems || typeof state.unlockedShopItems !== 'object') {
    state.unlockedShopItems = {};
  }
  let changed = false;
  const claimedUnlocks = new Set();
  if (state.goalsClaimed && typeof state.goalsClaimed === 'object' && Array.isArray(state.goals)) {
    state.goals.forEach((goal) => {
      if (!goal || typeof goal.id !== 'string') return;
      if (!state.goalsClaimed[goal.id]) return;
      getGoalRewardUnlockedItemIds(goal).forEach((itemId) => claimedUnlocks.add(itemId));
    });
  }
  state.items.forEach((item) => {
    if (!item || typeof item.id !== 'number') return;
    const itemId = item.id;
    const currentlyUnlocked = !!state.unlockedShopItems[itemId];
    if (item.goalLocked === true) {
      const shouldUnlock = claimedUnlocks.has(itemId) || hasPlayerHandledItem(itemId);
      if (currentlyUnlocked !== shouldUnlock) {
        state.unlockedShopItems[itemId] = shouldUnlock;
        if (!shouldUnlock) {
          resetShopEntryToBasePrice(itemId);
        }
        changed = true;
      }
      return;
    }
    if (!currentlyUnlocked) {
      state.unlockedShopItems[itemId] = true;
      changed = true;
    }
  });
  return changed;
}
