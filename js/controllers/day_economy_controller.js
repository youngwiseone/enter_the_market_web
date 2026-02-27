import { isProduceItem } from '../content/item_types.js';

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
  let weatherForecastNoticeDay = null;

  function registerSaleEvent(itemName, saleValue, quantity = 1) {
    const safeValue = Math.max(0, Number(saleValue) || 0);
    const safeQty = Math.max(1, Number(quantity) || 1);
    state.daySalesCount = Math.max(0, Number(state.daySalesCount) || 0) + safeQty;
    state.daySalesTotal = Math.max(0, Number(state.daySalesTotal) || 0) + safeValue;
    state.totalItemsSold = Math.max(0, Number(state.totalItemsSold) || 0) + safeQty;
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
      if (reason) {
        addMessage({
          id: 'system.not_enough_energy_reason',
          vars: { reason },
          meta: { speaker: 'player', emotion: 'tired', category: 'system', priority: 'normal' }
        });
      } else {
        addMessage({
          id: 'system.not_enough_energy',
          meta: { speaker: 'player', emotion: 'tired', category: 'system', priority: 'normal' }
        });
      }
      return false;
    }
    state.player.energy = Math.max(0, roundEnergyValue(state.player.energy - cost));
    state.dayEnergySpent = Math.max(0, Number(state.dayEnergySpent) || 0) + cost;
    if (state.player.energy <= 2 && lowEnergyNoticeDay !== state.player.day) {
      lowEnergyNoticeDay = state.player.day;
      addMessage({
        id: 'tip.low_energy_consider_day_end',
        vars: {
          energy: formatEnergyValue(state.player.energy),
          energyMax: formatEnergyValue(state.player.energyMax)
        },
        meta: {
          speaker: 'player',
          emotion: 'tired',
          category: 'tips',
          priority: 'low',
          replaceKey: 'tip:low-energy'
        }
      });
    }
    const currentEnergyMax = Math.max(1, Number(state.player.energyMax) || 1);
    const energyRatio = Math.max(0, Number(state.player.energy) || 0) / currentEnergyMax;
    const isRainTomorrow = String(state.nextDayWeather?.id || '') === 'rain';
    if (energyRatio <= 0.10 && isRainTomorrow && weatherForecastNoticeDay !== state.player.day) {
      weatherForecastNoticeDay = state.player.day;
      addMessage({
        id: 'weather.storm_tomorrow_warning',
        meta: {
          speaker: 'farmer',
          emotion: 'neutral',
          category: 'weather',
          priority: 'low',
          replaceKey: 'weather:forecast'
        }
      });
    }
    return true;
  }

  function resetLowEnergyNoticeDay() {
    lowEnergyNoticeDay = null;
    weatherForecastNoticeDay = null;
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
    addMessage({
      id: 'economy.alert',
      vars: { topList: top.join(', '), extra },
      meta: {
        speaker: 'farmer',
        category: 'economy',
        priority: 'normal'
      }
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
    return state.items.filter((item) => item && isProduceItem(item) && isShopItemUnlocked(item.id));
  }

  function generateDailyTip() {
    const isRainDay = String(state.weather?.id || '') === 'rain';
    if (isRainDay) return;
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
      optionalTips.push({
        id: 'tip.daily_buy_below_avg',
        vars: { itemName: bestBuy.name }
      });
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
      optionalTips.push({
        id: 'tip.daily_sell_above_cost',
        vars: { itemName: bestSell.name }
      });
    }

    optionalTips.push({
      id: 'tip.daily_current_cash',
      vars: { cash: state.player.cash.toFixed(2) }
    });
    const tipOptions = optionalTips.length > 0 ? optionalTips : [{
      id: 'tip.daily_current_cash',
      vars: { cash: state.player.cash.toFixed(2) }
    }];
    const idx = Math.floor(Math.random() * tipOptions.length);
    const selectedTip = tipOptions[idx];
    addMessage({
      id: selectedTip.id,
      vars: selectedTip.vars,
      meta: { category: 'tips', priority: 'low' }
    });
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
