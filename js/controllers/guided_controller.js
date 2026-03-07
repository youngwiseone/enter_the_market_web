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
  const { tabName, isGoalsTabUnlocked, addMessage } = deps;
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

function getAveragePrice(entry) {
  if (!entry || typeof entry !== 'object') return 0;
  const currentPrice = Math.max(0, Number(entry.price) || 0);
  if (!entry.daysCount || !entry.priceSum) return currentPrice;
  return Number(entry.priceSum) / Number(entry.daysCount);
}

function getBestSellSignal(state, isShopItemUnlocked) {
  let best = null;
  let bestDiff = 0;
  if (!Array.isArray(state.shop)) return null;
  state.shop.forEach((entry) => {
    if (!entry || !isShopItemUnlocked(entry.itemId)) return;
    const avg = getAveragePrice(entry);
    if (avg <= 0) return;
    const diff = ((Number(entry.price) || 0) - avg) / avg;
    if (diff <= bestDiff) return;
    const item = Array.isArray(state.items) ? state.items.find((it) => it?.id === entry.itemId) : null;
    if (!item) return;
    bestDiff = diff;
    best = {
      itemName: item.name,
      premiumPct: diff * 100
    };
  });
  return best && best.premiumPct >= 5 ? best : null;
}

function getRollStrengthPreview(state) {
  const energySpent = Math.max(0, Number(state.dayEnergySpent) || 0);
  const energyMax = Math.max(1, Number(state.player?.energyMax) || 1);
  return {
    energySpent,
    energyMax,
    strengthPct: Math.max(0, Math.round(energySpent))
  };
}

export function getGuidancePayloadAction(deps) {
  const {
    state,
    GUIDED_FLAGS,
    getPrimaryGuidedState,
    countReadyToHarvestTiles,
    getBestBuyOpportunity,
    isShopItemUnlocked
  } = deps;

  const guided = getPrimaryGuidedState();
  const energy = Number(state.player?.energy) || 0;
  const readyTiles = Math.max(0, Number(countReadyToHarvestTiles()) || 0);
  const rollPreview = getRollStrengthPreview(state);
  const bestSell = getBestSellSignal(state, isShopItemUnlocked);
  const nextWeatherId = String(state.nextDayWeather?.id || '').trim().toLowerCase();
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
  if (readyTiles > 0) {
    return {
      objective: 'Cash out ready crops before resting',
      hint: bestSell
        ? `${bestSell.itemName} is about ${bestSell.premiumPct.toFixed(0)}% above average. Sell into strength while today lasts.`
        : `You have ${readyTiles} ready crop${readyTiles === 1 ? '' : 's'} that can be sold at today's prices.`,
      progressText: `${readyTiles} ready`,
      chipClass: ''
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
  if (nextWeatherId === 'rain' && guided.plantedTiles > 0) {
    return {
      objective: 'Use tomorrow\'s rain window',
      hint: 'Rain is forecast next day. Rest when ready to get free watering and refill sprinklers.',
      progressText: 'Rain next',
      chipClass: ''
    };
  }
  if (energy > 0 && rollPreview.strengthPct < 8) {
    return {
      objective: 'Charge a stronger tomorrow roll',
      hint: `You have ${energy} energy left and only ${rollPreview.strengthPct}% roll strength banked. One more action can improve tomorrow's move.`,
      progressText: `Roll ${rollPreview.strengthPct}%`,
      chipClass: 'warn'
    };
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
  if (bestSell) {
    return {
      objective: 'Watch for premium sell windows',
      hint: `${bestSell.itemName} is roughly ${bestSell.premiumPct.toFixed(0)}% above average. If you are holding any, today is a strong cash-out day.`,
      progressText: 'Sell high',
      chipClass: ''
    };
  }
  return {
    objective: 'Keep the loop going',
    hint: 'Plant into discounts, spend energy to shape tomorrow\'s roll, then rest for new market shifts.',
    progressText: `Roll ${rollPreview.strengthPct}%`,
    chipClass: ''
  };
}
