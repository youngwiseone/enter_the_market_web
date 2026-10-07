import { isPlantWateredForDay } from './fertiliser_controller.js';
export function countPlantedTilesAction(state) {
  if (!Array.isArray(state.gridItems)) return 0;
  return state.gridItems.reduce((sum, itemId) => sum + (itemId ? 1 : 0), 0);
}

export function getPrimaryGuidedStateAction(deps) {
  const { state, selectedShopItemId, GUIDED_FLAGS, countPlantedTiles } = deps;
  const plantedTiles = countPlantedTiles();
  const harvested = Math.max(0, Number(state.goalStats?.harvestCount) || 0);
  const hasSelection = !!selectedShopItemId || plantedTiles > 0 || harvested > 0 || !!state.goalFlags?.[GUIDED_FLAGS.selected];
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
    if (!state.player?.openingTrade || state.player.openingTrade.completed) addMessage({ id: 'progress.store_unlocked' });
  }
  if (!state.goalFlags[GUIDED_FLAGS.goalsAnnounced] && isGoalsTabUnlocked()) {
    state.goalFlags[GUIDED_FLAGS.goalsAnnounced] = true;
    if (!state.player?.openingTrade || state.player.openingTrade.completed) addMessage({ id: 'progress.goals_unlocked', meta: { emotion: 'excited' } });
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

export function getBestReadySellSignal(state, getGridCellSellSnapshot) {
  let best = null;
  if (!Array.isArray(state.gridItems) || typeof getGridCellSellSnapshot !== 'function') return null;
  state.gridItems.forEach((itemId, cellIndex) => {
    if (!itemId) return;
    const snapshot = getGridCellSellSnapshot(cellIndex);
    if (!snapshot?.isProduce) return;
    const entry = state.shop?.find((candidate) => candidate.itemId === itemId);
    const avg = getAveragePrice(entry);
    if (avg <= 0) return;
    const diff = ((Number(entry.price) || 0) - avg) / avg;
    if (best && diff <= best.premiumPct / 100) return;
    const item = Array.isArray(state.items) ? state.items.find((it) => it?.id === entry.itemId) : null;
    if (!item) return;
    best = {
      itemName: item.name,
      premiumPct: diff * 100,
      farmId: state.activeFarmId || 1,
      cellIndex,
      saleValue: snapshot.sellNow
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
    isShopItemUnlocked,
    getGridCellSellSnapshot
  } = deps;

  const opening = state.player?.openingTrade;
  if (opening) {
    const last = opening.lastSale;
    if (last && !opening.payoffDismissed) {
      return { objective: last.profit > 0 ? 'First trading loop complete!' : 'Your first trade — try another price window', hint: `Cost $${last.cost.toFixed(2)} → sale $${last.saleValue.toFixed(2)} → ${last.profit >= 0 ? 'profit' : 'loss'} $${Math.abs(last.profit).toFixed(2)}. ${last.profit > 0 ? 'Keep farming. Mine a second growing space next.' : 'Prices moved while you grew. Rarity adds value; holding can help, but prices can fall too.'}`, progressText: last.profit > 0 ? 'Keep farming' : 'Try again', chipClass: last.profit > 0 ? '' : 'warn' };
    }
    if (opening.completed && opening.payoffDismissed && !state.goalsClaimed?.['tomato-first-harvest']) return { objective: 'Next milestone: Tomato Starter', hint: 'Harvest one Tomato to earn two free Tomato seeds. Keep growing to unlock it; mine a second tile when you want more room.', progressText: '0/1 Tomato', chipClass: '' };
    if (!opening.completed) {
      const index = state.gridItems?.findIndex(Boolean) ?? -1;
      if (index < 0) return { objective: 'Plant your first carrot', hint: opening.carrotAvailable ? 'Market → Carrot → cleared soil. First crop: 2 watered days.' : 'Plant again → 6 watered days. Compare prices before selling.', progressText: 'Plant', chipClass: '' };
      const ready = countReadyToHarvestTiles() > 0;
      const watered = isPlantWateredForDay(state, index);
      return { objective: ready ? 'Inspect today’s price: sell or wait' : watered ? 'Rest to grow and see new prices' : 'Water your carrot', hint: ready ? 'Tap crop → compare price. Hold = tile stays occupied.' : watered ? 'Rest → growth + new prices.' : 'Water → tap crop. Once per day.', progressText: ready ? 'Sell or wait' : watered ? 'Rest' : 'Water', chipClass: '' };
    }
  }
  const guided = getPrimaryGuidedState();
  const energy = Number(state.player?.energy) || 0;
  const readyTiles = Math.max(0, Number(countReadyToHarvestTiles()) || 0);
  const rollPreview = getRollStrengthPreview(state);
  const bestSell = getBestReadySellSignal(state, getGridCellSellSnapshot);
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
        hint: 'Tap the ready crop to inspect its price, then choose Sell or hold it for another day.',
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
      objective: 'Choose: sell today or hold for another price',
      hint: bestSell
        ? `Your ready ${bestSell.itemName} on Farm ${bestSell.farmId} is about ${bestSell.premiumPct.toFixed(0)}% above average. Sell today or hold for an uncertain next price.`
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
      hint: `Seed buying opportunity: ${bestBuy.itemName} is about ${bestBuy.discountPct.toFixed(0)}% below average. Harvest prices may change.`,
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
    hint: 'Plant into discounts and hold for useful prices. Leaving energy unused keeps the extra market roll calmer; ordinary prices can still move.',
    progressText: `Roll ${rollPreview.strengthPct}%`,
    chipClass: ''
  };
}
