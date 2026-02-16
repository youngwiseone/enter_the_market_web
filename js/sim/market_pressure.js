export function getHeldQuantityForItemState(state, itemId) {
  const safeItemId = Number(itemId);
  if (!Number.isFinite(safeItemId)) return 0;
  const inventoryQty = Array.isArray(state.inventory)
    ? state.inventory.reduce((sum, entry) => {
      if (!entry || Number(entry.itemId) !== safeItemId) return sum;
      return sum + Math.max(0, Number(entry.quantity) || 0);
    }, 0)
    : 0;
  const gridQty = Array.isArray(state.gridItems)
    ? state.gridItems.reduce((sum, gridItemId) => sum + (Number(gridItemId) === safeItemId ? 1 : 0), 0)
    : 0;
  return inventoryQty + gridQty;
}

export function getMarketPressureRecordState(state, itemId, clampMarketBias) {
  if (!state.marketPressureByItem || typeof state.marketPressureByItem !== 'object' || Array.isArray(state.marketPressureByItem)) {
    state.marketPressureByItem = {};
  }
  const key = String(itemId);
  const current = state.marketPressureByItem[key];
  if (!current || typeof current !== 'object') {
    state.marketPressureByItem[key] = { holdDays: 0, holdBias: 0, sellShock: 0 };
    return state.marketPressureByItem[key];
  }
  current.holdDays = Math.max(0, Number(current.holdDays) || 0);
  current.holdBias = clampMarketBias(current.holdBias, 0, 1);
  current.sellShock = clampMarketBias(current.sellShock, 0, 1);
  return current;
}

export function getMarketDirectionalBiasState(state, itemId, clampMarketBias) {
  const pressure = getMarketPressureRecordState(state, itemId, clampMarketBias);
  const upward = clampMarketBias(pressure.holdBias, 0, 1);
  const downward = clampMarketBias(pressure.sellShock, 0, 1);
  return {
    upward,
    downward,
    net: upward - downward
  };
}

export function registerItemSalePressureState(state, itemId, quantity) {
  if (!state.dayItemSales || typeof state.dayItemSales !== 'object' || Array.isArray(state.dayItemSales)) {
    state.dayItemSales = {};
  }
  const key = String(itemId);
  const soldQty = Math.max(0, Number(quantity) || 0);
  state.dayItemSales[key] = (Math.max(0, Number(state.dayItemSales[key]) || 0)) + soldQty;
}

export function updateMarketPressureForNextDayState(deps) {
  const {
    state,
    clampMarketBias,
    holdingLotThreshold,
    holdBiasQtyRange,
    holdBiasStreakDays,
    sellShockQtyRange
  } = deps;

  if (!Array.isArray(state.items)) {
    state.dayItemSales = {};
    return;
  }
  state.items.forEach((item) => {
    if (!item || typeof item.id !== 'number') return;
    const key = String(item.id);
    const pressure = getMarketPressureRecordState(state, item.id, clampMarketBias);
    const heldQty = getHeldQuantityForItemState(state, item.id);
    const soldQty = Math.max(0, Number(state.dayItemSales?.[key]) || 0);
    if (heldQty >= holdingLotThreshold) {
      pressure.holdDays = Math.min(30, pressure.holdDays + 1);
    } else {
      pressure.holdDays = Math.max(0, pressure.holdDays - 1);
    }
    const qtyFactor = clampMarketBias((heldQty - holdingLotThreshold + 1) / holdBiasQtyRange, 0, 1);
    const streakFactor = clampMarketBias(pressure.holdDays / holdBiasStreakDays, 0, 1);
    pressure.holdBias = clampMarketBias(qtyFactor * streakFactor, 0, 1);
    if (soldQty > 0) {
      pressure.holdDays = Math.max(0, pressure.holdDays - Math.ceil(soldQty / 4));
    }
    const sellShockAdded = clampMarketBias(soldQty / sellShockQtyRange, 0, 1);
    pressure.sellShock = clampMarketBias((pressure.sellShock * 0.45) + sellShockAdded, 0, 1);
  });
  state.dayItemSales = {};
}

export function getDailyRollItemWeightState(state, itemId, clampMarketBias) {
  const pressure = getMarketPressureRecordState(state, itemId, clampMarketBias);
  return 1 + (pressure.holdBias * 1.6) + (pressure.sellShock * 1.2);
}
