export function isToolUnlockedAction(state, tool, defaultTool) {
  if (tool === defaultTool) return true;
  return !!(state.unlockedTools && state.unlockedTools[tool]);
}

export function getFreePurchaseCountAction(state, itemId) {
  if (!state.freePurchasesByItem) return 0;
  const key = String(itemId);
  return Math.max(0, Number(state.freePurchasesByItem[key]) || 0);
}

export function consumeFreePurchasesAction(state, itemId, quantity, getFreePurchaseCount) {
  const key = String(itemId);
  const available = getFreePurchaseCount(itemId);
  const freeQty = Math.min(available, Math.max(0, quantity));
  if (freeQty > 0) {
    state.freePurchasesByItem[key] = available - freeQty;
  }
  return freeQty;
}

export function getItemCurrentPriceAction(state, itemId) {
  const shopEntry = Array.isArray(state.shop)
    ? state.shop.find((entry) => entry.itemId === itemId)
    : null;
  if (shopEntry && typeof shopEntry.price === 'number') {
    return Math.max(0, shopEntry.price);
  }
  const item = Array.isArray(state.items)
    ? state.items.find((it) => it.id === itemId)
    : null;
  return Math.max(0, Number(item?.price) || 0);
}

export function calculateInventoryValueAction(state, getItemCurrentPrice) {
  if (!Array.isArray(state.inventory)) return 0;
  return state.inventory.reduce((total, entry) => {
    const qty = Number(entry?.quantity) || 0;
    if (qty <= 0) return total;
    return total + getItemCurrentPrice(entry.itemId) * qty;
  }, 0);
}

export function calculateGridValueAction(state, getItemCurrentPrice) {
  if (!Array.isArray(state.gridItems)) return 0;
  return state.gridItems.reduce((total, itemId) => {
    if (!itemId) return total;
    return total + getItemCurrentPrice(itemId);
  }, 0);
}

export function calculateNetWorthAction(state, calculateInventoryValue, calculateGridValue) {
  const cash = Number(state.player?.cash) || 0;
  return cash + calculateInventoryValue() + calculateGridValue();
}

export function updateNetWorthAction(state, calculateNetWorth) {
  if (!state.player || typeof state.player !== 'object') return 0;
  state.player.netWorth = calculateNetWorth();
  return state.player.netWorth;
}

export function clampPlayerLevelAction(levelRaw, playerLevelCap) {
  const numeric = Math.floor(Number(levelRaw) || 1);
  return Math.max(1, Math.min(playerLevelCap, numeric));
}

export function getXpToNextLevelAction(levelRaw, clampPlayerLevel) {
  const level = clampPlayerLevel(levelRaw);
  return Math.max(1, Math.round(30 * Math.pow(1.18, Math.max(0, level - 1))));
}

export function roundEnergyValueAction(valueRaw) {
  const value = Number(valueRaw);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

export function formatEnergyValueAction(valueRaw, roundEnergyValue) {
  const rounded = roundEnergyValue(valueRaw);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function getEnergyMaxForLevelAction(levelRaw, clampPlayerLevel) {
  const level = clampPlayerLevel(levelRaw);
  return 5 + Math.max(0, level - 1);
}

function getMarketRollCountForLevel(levelRaw) {
  const level = Math.max(1, Math.floor(Number(levelRaw) || 1));
  if (level <= 4) return 1;
  return Math.min(20, Math.floor((level - 5) / 5) + 2);
}

export function ensurePlayerProgressStateAction(
  state,
  clampPlayerLevel,
  getXpToNextLevel,
  getEnergyMaxForLevel,
  roundEnergyValue,
  playerLevelCap
) {
  if (!state.player || typeof state.player !== 'object') return;
  state.player.playerLevel = clampPlayerLevel(state.player.playerLevel);
  const atCap = state.player.playerLevel >= playerLevelCap;
  const xp = Math.max(0, Math.floor(Number(state.player.playerXp) || 0));
  state.player.playerXp = atCap ? 0 : Math.min(xp, getXpToNextLevel(state.player.playerLevel) - 1);
  state.player.energyMax = getEnergyMaxForLevel(state.player.playerLevel);
  if (typeof state.player.energy !== 'number') {
    state.player.energy = state.player.energyMax;
  }
  const maxEnergy = Number(state.player.energyMax) || 1;
  const currentEnergy = roundEnergyValue(state.player.energy);
  state.player.energy = Math.max(0, Math.min(currentEnergy, maxEnergy));
}

export function enqueueLevelUpCelebrationAction(
  state,
  level,
  changeText,
  showNextGoalCelebration,
  unlockedItem,
  rollCelebrationText = ''
) {
  if (!Array.isArray(state.goalCelebrationQueue)) {
    state.goalCelebrationQueue = [];
  }
  const unlockedText = unlockedItem && unlockedItem.name
    ? ` | Unlocked item: ${unlockedItem.name}`
    : '';
  state.goalCelebrationQueue.push({
    id: `level-up-${level}-${Date.now()}`,
    title: 'Level Up',
    rewardText: `Level ${level} reached${unlockedText}${rollCelebrationText} | ${changeText}`,
    imageSrc: unlockedItem?.imageSrc || 'resources/profiles/player_level_up.png',
    imageAlt: unlockedItem?.imageAlt || 'Level up',
    seedPacketImageSrc: unlockedItem?.seedPacketImageSrc || '',
    seedOverlayIconImageSrc: unlockedItem?.seedOverlayIconImageSrc || ''
  });
  showNextGoalCelebration();
}

export function awardPlayerXpAction(amount, options, deps) {
  const {
    state,
    ensurePlayerProgressState,
    playerLevelCap,
    getXpToNextLevel,
    getEnergyMaxForLevel,
    formatEnergyValue,
    addMessage,
    unlockShopItemForLevel,
    enqueueLevelUpCelebration,
    showXpGainFeedback
  } = deps;

  ensurePlayerProgressState();
  const xpGain = Math.max(0, Math.floor(Number(amount) || 0));
  if (xpGain <= 0 || state.player.playerLevel >= playerLevelCap) return 0;

  state.player.playerXp += xpGain;
  let levelsGained = 0;
  while (state.player.playerLevel < playerLevelCap) {
    const xpToNext = getXpToNextLevel(state.player.playerLevel);
    if (state.player.playerXp < xpToNext) break;
    state.player.playerXp -= xpToNext;
    const previousLevel = state.player.playerLevel;
    const previousEnergyMax = getEnergyMaxForLevel(state.player.playerLevel);
    state.player.playerLevel += 1;
    levelsGained += 1;
    const rollCountIncreased = getMarketRollCountForLevel(state.player.playerLevel) > getMarketRollCountForLevel(previousLevel);
    const rollUnlockText = rollCountIncreased ? ' +1 Market roll unlocked.' : '';
    const rollCelebrationText = rollCountIncreased ? ' | +1 Market roll unlocked' : '';
    const currentEnergyMax = getEnergyMaxForLevel(state.player.playerLevel);
    state.player.energyMax = currentEnergyMax;
    state.player.energy = currentEnergyMax;
    const changeText = currentEnergyMax > previousEnergyMax
      ? `Max energy increased to ${formatEnergyValue(currentEnergyMax)}. Energy fully refilled.`
      : `Energy fully refilled to ${formatEnergyValue(currentEnergyMax)}.`;
    const unlockedItem = unlockShopItemForLevel(state.player.playerLevel);
    addMessage({
      id: 'progress.level_up',
      vars: {
        level: state.player.playerLevel,
        unlockedText: unlockedItem && unlockedItem.name ? ` Unlocked item: ${unlockedItem.name}.` : '',
        rollUnlockText,
        changeText
      },
      meta: {
        speaker: 'player',
        emotion: 'level_up',
        category: 'progress',
        priority: 'high'
      }
    });
    enqueueLevelUpCelebration(state.player.playerLevel, changeText, unlockedItem, rollCelebrationText);
  }

  if (state.player.playerLevel >= playerLevelCap) {
    state.player.playerXp = 0;
  }

  if (options && options.center) {
    showXpGainFeedback(xpGain, options.center);
  }
  return levelsGained;
}
