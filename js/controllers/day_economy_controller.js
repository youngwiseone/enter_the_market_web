const ECONOMY_ALERT_THRESHOLD = 0.15;

export function createDayEconomyController(deps) {
  const {
    state,
    addMessage,
    roundEnergyValue,
    formatEnergyValue,
    calculateNetWorth,
    countReadyToHarvestTiles,
    isShopItemUnlocked
  } = deps;

  let lowEnergyNoticeDay = null;

  function registerSaleEvent(itemName, saleValue, quantity = 1) {
    const safeValue = Math.max(0, Number(saleValue) || 0);
    const safeQty = Math.max(1, Number(quantity) || 1);
    state.daySalesCount = Math.max(0, Number(state.daySalesCount) || 0) + safeQty;
    state.daySalesTotal = Math.max(0, Number(state.daySalesTotal) || 0) + safeValue;
    const currentTop = state.dayTopSale && typeof state.dayTopSale === 'object'
      ? (Number(state.dayTopSale.value) || 0)
      : 0;
    if (!state.dayTopSale || safeValue > currentTop) {
      state.dayTopSale = {
        itemName: String(itemName || 'Item'),
        value: safeValue,
        quantity: safeQty
      };
    }
  }

  function consumeEnergy(amount, reason) {
    const cost = Math.max(0, Number(amount) || 0);
    const max = Math.max(1, Number(state.player.energyMax) || 10);
    if (typeof state.player.energy !== 'number') {
      state.player.energy = max;
    }
    if (state.player.energy + 0.0001 < cost) {
      const message = reason ? `Not enough energy to ${reason}.` : 'Not enough energy.';
      addMessage(message, { speaker: 'player', emotion: 'tired', category: 'system', priority: 'normal' });
      return false;
    }
    state.player.energy = Math.max(0, roundEnergyValue(state.player.energy - cost));
    if (state.player.energy <= 2 && lowEnergyNoticeDay !== state.player.day) {
      lowEnergyNoticeDay = state.player.day;
      addMessage(
        `Low energy: ${formatEnergyValue(state.player.energy)}/${formatEnergyValue(state.player.energyMax)}. Consider ending the day.`,
        {
          speaker: 'player',
          emotion: 'tired',
          category: 'tips',
          priority: 'low',
          replaceKey: 'tip:low-energy'
        }
      );
    }
    return true;
  }

  function resetLowEnergyNoticeDay() {
    lowEnergyNoticeDay = null;
  }

  function getCurrentDaySnapshot() {
    return {
      day: Number(state.player?.day) || 1,
      cash: Number(state.player?.cash) || 0,
      netWorth: calculateNetWorth(),
      readyTiles: countReadyToHarvestTiles(),
      unlockedTiles: Array.isArray(state.gridUnlocked)
        ? state.gridUnlocked.reduce((sum, value) => sum + (value ? 1 : 0), 0)
        : 0,
      harvestCount: Math.max(0, Number(state.goalStats?.harvestCount) || 0)
    };
  }

  function emitEconomyAlert(priceMoves) {
    if (!Array.isArray(priceMoves) || priceMoves.length === 0) return;
    const significant = priceMoves
      .filter((move) => Math.abs(move.pctChange) >= ECONOMY_ALERT_THRESHOLD)
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
    if (significant.length === 0) return;
    const top = significant.slice(0, 3).map((move) => {
      const sign = move.pctChange >= 0 ? '+' : '';
      return `${move.itemName} ${sign}${(move.pctChange * 100).toFixed(0)}%`;
    });
    const extra = significant.length > 3 ? ` (+${significant.length - 3} more)` : '';
    addMessage(`Economy alert: ${top.join(', ')}${extra}.`, {
      speaker: 'farmer',
      category: 'economy',
      priority: 'normal'
    });
  }

  function registerDayAction() {
    state.dayActionCount = Math.max(0, Number(state.dayActionCount) || 0) + 1;
  }

  function clampMarketBias(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function getUnlockedRollItems() {
    if (!Array.isArray(state.items)) return [];
    return state.items.filter((item) => item && isShopItemUnlocked(item.id));
  }

  function generateDailyTip() {
    const optionalTips = [];
    let bestBuy = null;
    let bestBuyDiff = 0;
    state.shop.forEach((entry) => {
      if (!isShopItemUnlocked(entry.itemId)) return;
      const item = state.items.find((it) => it.id === entry.itemId);
      if (!item) return;
      const avgPrice = (entry.daysCount && entry.priceSum) ? (entry.priceSum / entry.daysCount) : null;
      if (avgPrice && entry.price < avgPrice) {
        const diff = (avgPrice - entry.price) / avgPrice;
        if (diff > bestBuyDiff) {
          bestBuyDiff = diff;
          bestBuy = item;
        }
      }
    });
    if (bestBuy && bestBuyDiff > 0.05) {
      optionalTips.push(`Tip: Consider buying ${bestBuy.name} - price is below its average.`);
    }

    let bestSell = null;
    let bestSellDiff = 0;
    state.inventory.forEach((entry) => {
      const item = state.items.find((it) => it.id === entry.itemId);
      if (!item) return;
      if (!isShopItemUnlocked(entry.itemId)) return;
      const shopEntry = state.shop.find((shopRecord) => shopRecord.itemId === entry.itemId);
      if (!shopEntry) return;
      const sellPrice = shopEntry.price;
      const avgCost = entry.avgCost || 0;
      if (sellPrice > avgCost && avgCost > 0) {
        const diff = (sellPrice - avgCost) / avgCost;
        if (diff > bestSellDiff) {
          bestSellDiff = diff;
          bestSell = item;
        }
      }
    });
    if (bestSell && bestSellDiff > 0.05) {
      optionalTips.push(`Tip: Consider selling ${bestSell.name} - price is above your average cost.`);
    }

    optionalTips.push(`Current cash: $${state.player.cash.toFixed(2)}`);
    const tipOptions = optionalTips.length > 0 ? optionalTips : [`Current cash: $${state.player.cash.toFixed(2)}`];
    const idx = Math.floor(Math.random() * tipOptions.length);
    addMessage(tipOptions[idx], { category: 'tips', priority: 'low' });
  }

  return {
    registerSaleEvent,
    consumeEnergy,
    resetLowEnergyNoticeDay,
    getCurrentDaySnapshot,
    emitEconomyAlert,
    registerDayAction,
    clampMarketBias,
    getUnlockedRollItems,
    generateDailyTip
  };
}
