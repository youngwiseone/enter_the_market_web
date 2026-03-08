export const MARKET_HISTORY_LIMIT = 180;

function roundHistoryValue(value) {
  return Math.round((Math.max(0, Number(value) || 0) + Number.EPSILON) * 100) / 100;
}

function normalizePriceMap(rawPrices) {
  if (!rawPrices || typeof rawPrices !== 'object' || Array.isArray(rawPrices)) return {};
  const normalized = {};
  Object.entries(rawPrices).forEach(([itemId, price]) => {
    const normalizedId = String(itemId || '').trim();
    const normalizedPrice = roundHistoryValue(price);
    if (!normalizedId || !Number.isFinite(normalizedPrice)) return;
    normalized[normalizedId] = normalizedPrice;
  });
  return normalized;
}

export function normalizeMarketHistoryState(rawHistory, limit = MARKET_HISTORY_LIMIT) {
  if (!Array.isArray(rawHistory)) return [];
  const byDay = new Map();
  rawHistory.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const day = Math.max(1, Math.floor(Number(entry.day) || 0));
    if (!day) return;
    byDay.set(day, {
      day,
      cash: roundHistoryValue(entry.cash),
      netWorth: roundHistoryValue(entry.netWorth),
      prices: normalizePriceMap(entry.prices)
    });
  });
  return Array.from(byDay.values())
    .sort((left, right) => left.day - right.day)
    .slice(-Math.max(1, Math.floor(Number(limit) || MARKET_HISTORY_LIMIT)));
}

export function buildMarketHistorySnapshotAction(state, isShopItemUnlocked) {
  const prices = {};
  const cash = roundHistoryValue(state?.player?.cash);
  const rawNetWorth = Number(state?.player?.netWorth);
  const shopEntries = Array.isArray(state?.shop) ? state.shop : [];
  shopEntries.forEach((entry) => {
    const itemId = Number(entry?.itemId);
    if (!itemId || !isShopItemUnlocked(itemId)) return;
    prices[String(itemId)] = roundHistoryValue(entry.price);
  });
  return {
    day: Math.max(1, Math.floor(Number(state?.player?.day) || 1)),
    cash,
    netWorth: Number.isFinite(rawNetWorth) && rawNetWorth > 0 ? roundHistoryValue(rawNetWorth) : cash,
    prices
  };
}

export function upsertCurrentMarketHistorySnapshotAction(state, isShopItemUnlocked, limit = MARKET_HISTORY_LIMIT) {
  const history = normalizeMarketHistoryState(state?.marketHistory, limit);
  const nextEntry = buildMarketHistorySnapshotAction(state, isShopItemUnlocked);
  const previousLast = history.length > 0 ? history[history.length - 1] : null;
  let changed = history.length !== (Array.isArray(state?.marketHistory) ? state.marketHistory.length : 0);

  if (previousLast && previousLast.day === nextEntry.day) {
    const previousSerialized = JSON.stringify(previousLast);
    const nextSerialized = JSON.stringify(nextEntry);
    if (previousSerialized !== nextSerialized) {
      history[history.length - 1] = nextEntry;
      changed = true;
    }
  } else {
    history.push(nextEntry);
    changed = true;
  }

  const cappedHistory = history.slice(-Math.max(1, Math.floor(Number(limit) || MARKET_HISTORY_LIMIT)));
  if (!changed && cappedHistory.length !== history.length) {
    changed = true;
  }
  state.marketHistory = cappedHistory;
  return changed;
}
