export function hydrateDaySalesState(state, loadFn) {
  state.daySalesCount = Math.max(0, Number(loadFn('daySalesCount', null) ?? 0) || 0);
  state.daySalesTotal = Math.max(0, Number(loadFn('daySalesTotal', null) ?? 0) || 0);
  state.dayTopSale = loadFn('dayTopSale', null);
  state.dayItemSales = loadFn('dayItemSales', null) ?? {};
  state.marketPressureByItem = loadFn('marketPressureByItem', null) ?? {};
  state.daySummaryHistory = loadFn('daySummaryHistory', null) ?? [];
  state.pendingDaySummary = null;
}

export function normalizeDaySalesState(state) {
  state.daySalesCount = Math.max(0, Number(state.daySalesCount) || 0);
  state.daySalesTotal = Math.max(0, Number(state.daySalesTotal) || 0);
  if (!Array.isArray(state.daySummaryHistory)) {
    state.daySummaryHistory = [];
  }
  if (!state.dayTopSale || typeof state.dayTopSale !== 'object') {
    state.dayTopSale = null;
  } else {
    state.dayTopSale = {
      itemName: String(state.dayTopSale.itemName || 'Item'),
      value: Math.max(0, Number(state.dayTopSale.value) || 0),
      quantity: Math.max(1, Number(state.dayTopSale.quantity) || 1)
    };
  }
  state.pendingDaySummary = null;
  if (!state.dayItemSales || typeof state.dayItemSales !== 'object' || Array.isArray(state.dayItemSales)) {
    state.dayItemSales = {};
  }
  if (!state.marketPressureByItem || typeof state.marketPressureByItem !== 'object' || Array.isArray(state.marketPressureByItem)) {
    state.marketPressureByItem = {};
  }
}
