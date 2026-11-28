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

// The latest summary travels through the existing save/reset flow. Prior
// summaries retain the stall takings but no longer retain yesterday's paper.
export function recordDaySummary(state, summary) {
  const history = Array.isArray(state.daySummaryHistory) ? state.daySummaryHistory : [];
  const previous = history.slice(-6).map((entry) => {
    if (!Array.isArray(entry?.marketBulletin)) return entry;
    const { marketBulletin, ...takings } = entry;
    return takings;
  });
  state.daySummaryHistory = [...previous, summary];
}

export function getCurrentGazette(state) {
  const issue = Array.isArray(state.daySummaryHistory) ? state.daySummaryHistory.at(-1) : null;
  if (!issue || Number(issue.day) + 1 !== Number(state.player?.day) || !Array.isArray(issue.marketBulletin)) {
    return null;
  }
  // Legacy summaries omit the paper. If a saved paper is damaged, hide it
  // rather than guessing the reasons for the day’s price movement.
  return issue.marketBulletin.length <= 3 && issue.marketBulletin.every((move) => move
    && typeof move.itemName === 'string'
    && [move.previous, move.current, move.changeCents, move.cycleCents, move.rollCents].every(Number.isFinite)
    && (!move.priorRange || [move.priorRange.low, move.priorRange.high, move.priorRange.count].every(Number.isFinite)))
    ? issue : null;
}
