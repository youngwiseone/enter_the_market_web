export function countPlantedTilesAction(state) {
  if (!Array.isArray(state.gridItems)) return 0;
  return state.gridItems.reduce((sum, itemId) => sum + (itemId ? 1 : 0), 0);
}

export function getPrimaryGuidedStateAction(deps) {
  const { state, selectedShopItemId, GUIDED_FLAGS, countPlantedTiles } = deps;
  const plantedTiles = countPlantedTiles();
  const harvested = Math.max(0, Number(state.goalStats?.harvestCount) || 0);
  const hasSelection = !!selectedShopItemId || !!state.goalFlags?.[GUIDED_FLAGS.selected];
  return {
    plantedTiles,
    harvested,
    hasSelection,
    hasPlanted: plantedTiles > 0 || !!state.goalFlags?.[GUIDED_FLAGS.planted],
    hasHarvested: harvested > 0 || !!state.goalFlags?.[GUIDED_FLAGS.harvest],
    hasRested: (Number(state.player?.day) || 1) > 1 || !!state.goalFlags?.[GUIDED_FLAGS.firstRest]
  };
}

export function isStoreTabUnlockedAction(state, GUIDED_FLAGS) {
  return !!state.goalFlags?.[GUIDED_FLAGS.storeUnlocked];
}

export function isGoalsTabUnlockedAction(state, GUIDED_FLAGS) {
  return !!state.goalFlags?.[GUIDED_FLAGS.goalsUnlocked];
}

export function syncGuidedUnlocksAction(deps) {
  const {
    state,
    GUIDED_FLAGS,
    getPrimaryGuidedState,
    isStoreTabUnlocked,
    isGoalsTabUnlocked,
    addMessage
  } = deps;

  if (!state.goalFlags || typeof state.goalFlags !== 'object') return;
  const guided = getPrimaryGuidedState();
  const currentDay = Math.max(1, Number(state.player?.day) || 1);
  if (guided.hasSelection) {
    state.goalFlags[GUIDED_FLAGS.selected] = true;
  }
  if (guided.hasPlanted) {
    state.goalFlags[GUIDED_FLAGS.planted] = true;
  }
  if (guided.hasHarvested) {
    state.goalFlags[GUIDED_FLAGS.harvest] = true;
  }
  if (guided.hasHarvested || currentDay >= 2) {
    state.goalFlags[GUIDED_FLAGS.storeUnlocked] = true;
  }
  if (guided.hasRested) {
    state.goalFlags[GUIDED_FLAGS.firstRest] = true;
  }
  if (isStoreTabUnlocked() && (guided.hasRested || currentDay >= 2)) {
    state.goalFlags[GUIDED_FLAGS.goalsUnlocked] = true;
  }
  if (!state.goalFlags[GUIDED_FLAGS.storeAnnounced] && isStoreTabUnlocked()) {
    state.goalFlags[GUIDED_FLAGS.storeAnnounced] = true;
    addMessage({ id: 'progress.store_unlocked' });
  }
  if (!state.goalFlags[GUIDED_FLAGS.goalsAnnounced] && isGoalsTabUnlocked()) {
    state.goalFlags[GUIDED_FLAGS.goalsAnnounced] = true;
    addMessage({ id: 'progress.goals_unlocked', meta: { emotion: 'excited' } });
  }
}

export function requestLockedTabAction(deps) {
  const { tabName, isStoreTabUnlocked, isGoalsTabUnlocked, addMessage } = deps;
  if (tabName === 'store' && !isStoreTabUnlocked()) {
    addMessage({ id: 'tip.unlock_store' });
    return false;
  }
  if (tabName === 'goals' && !isGoalsTabUnlocked()) {
    addMessage({ id: 'tip.unlock_goals' });
    return false;
  }
  return true;
}

export function getBestBuyOpportunityAction(deps) {
  const { state, isShopItemUnlocked } = deps;
  let best = null;
  let bestDiff = 0;
  if (!Array.isArray(state.shop)) return null;
  state.shop.forEach((entry) => {
    if (!entry || !isShopItemUnlocked(entry.itemId)) return;
    const avg = (entry.daysCount && entry.priceSum) ? (entry.priceSum / entry.daysCount) : 0;
    if (avg <= 0) return;
    const diff = (avg - entry.price) / avg;
    if (diff > bestDiff) {
      const item = state.items.find((it) => it.id === entry.itemId);
      if (!item) return;
      bestDiff = diff;
      best = { itemName: item.name, discountPct: diff * 100 };
    }
  });
  return best && best.discountPct >= 5 ? best : null;
}

export function getGuidancePayloadAction(deps) {
  const {
    state,
    GUIDED_FLAGS,
    getPrimaryGuidedState,
    countReadyToHarvestTiles,
    getBestBuyOpportunity
  } = deps;

  const guided = getPrimaryGuidedState();
  const energy = Number(state.player?.energy) || 0;
  if (!state.goalFlags?.[GUIDED_FLAGS.selected]) {
    return {
      objective: 'Select your first seed',
      hint: 'Tap a market row to pick a seed to place.',
      progressText: '0%',
      chipClass: 'warn'
    };
  }
  if (!state.goalFlags?.[GUIDED_FLAGS.planted]) {
    return {
      objective: 'Plant 1 seed on your farm',
      hint: 'Tap any unlocked farm tile to place the selected seed.',
      progressText: `${Math.min(1, guided.plantedTiles)}/1`,
      chipClass: 'warn'
    };
  }
  if (!state.goalFlags?.[GUIDED_FLAGS.harvest]) {
    const readyTiles = countReadyToHarvestTiles();
    if (readyTiles > 0) {
      return {
        objective: 'Harvest your first crop',
        hint: 'Tap the ready crop tile to cash out.',
        progressText: `${Math.min(1, guided.harvested)}/1`,
        chipClass: ''
      };
    }
    return {
      objective: 'Grow and harvest your first crop',
      hint: 'Use Rest to advance day and finish growth faster.',
      progressText: `${Math.min(1, guided.harvested)}/1`,
      chipClass: 'warn'
    };
  }
  if (!state.goalFlags?.[GUIDED_FLAGS.firstRest]) {
    return {
      objective: 'Rest to roll the next market day',
      hint: 'Tap Rest when you are ready for new prices.',
      progressText: `${guided.hasRested ? 1 : 0}/1`,
      chipClass: ''
    };
  }
  if (!state.goalFlags?.[GUIDED_FLAGS.firstProfit]) {
    const baselineCash = Number(state.dayStartSnapshot?.cash) || 0;
    const cashDelta = (Number(state.player?.cash) || 0) - baselineCash;
    if (cashDelta > 0) {
      state.goalFlags[GUIDED_FLAGS.firstProfit] = true;
    } else {
      return {
        objective: 'Build your first profit streak',
        hint: 'Buy below average prices, then harvest and sell into stronger prices.',
        progressText: `$${cashDelta.toFixed(2)}`,
        chipClass: cashDelta < 0 ? 'bad' : 'warn'
      };
    }
  }
  if (energy <= 1) {
    return {
      objective: 'Keep momentum',
      hint: 'Energy is low. Rest to refresh and reroll opportunities.',
      progressText: `Energy ${Math.max(0, energy)}`,
      chipClass: 'warn'
    };
  }
  const bestBuy = getBestBuyOpportunity();
  if (bestBuy) {
    return {
      objective: 'Play the best value move',
      hint: `Buy ${bestBuy.itemName}: about ${bestBuy.discountPct.toFixed(0)}% below average.`,
      progressText: 'Value',
      chipClass: ''
    };
  }
  return {
    objective: 'Keep the loop going',
    hint: 'Plant, water, harvest, then rest for new market shifts.',
    progressText: 'Flow',
    chipClass: ''
  };
}
