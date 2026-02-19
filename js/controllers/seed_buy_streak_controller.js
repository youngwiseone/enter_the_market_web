const BUY_STREAK_THRESHOLD = 5;

const buyStreakState = {
  day: null,
  sameItemId: null,
  sameItemCount: 0,
  runCount: 0,
  runItemIds: new Set(),
  announcedSame: false,
  announcedMixed: false
};

function isSeedItem(item) {
  return !!(item && typeof item.name === 'string' && item.name.toLowerCase().includes('seed'));
}

function getPurchaseUnits(quantity) {
  return Math.max(1, Number(quantity) || 1);
}

function resetBuyStreakForDay(dayIndex) {
  buyStreakState.day = dayIndex;
  buyStreakState.sameItemId = null;
  buyStreakState.sameItemCount = 0;
  buyStreakState.runCount = 0;
  buyStreakState.runItemIds.clear();
  buyStreakState.announcedSame = false;
  buyStreakState.announcedMixed = false;
}

export function consumeSeedBuyStreakMessageId(dayIndex, itemId, quantity, item) {
  const nextDay = Number(dayIndex) || 0;
  if (buyStreakState.day !== nextDay) {
    resetBuyStreakForDay(nextDay);
  }

  if (!isSeedItem(item)) {
    buyStreakState.sameItemId = null;
    buyStreakState.sameItemCount = 0;
    buyStreakState.runCount = 0;
    buyStreakState.runItemIds.clear();
    return '';
  }

  const units = getPurchaseUnits(quantity);
  buyStreakState.runCount += units;
  buyStreakState.runItemIds.add(itemId);

  if (buyStreakState.sameItemId === itemId) {
    buyStreakState.sameItemCount += units;
  } else {
    buyStreakState.sameItemId = itemId;
    buyStreakState.sameItemCount = units;
  }

  if (!buyStreakState.announcedSame && buyStreakState.sameItemCount >= BUY_STREAK_THRESHOLD) {
    buyStreakState.announcedSame = true;
    return 'commerce.buy_streak_seed';
  }

  if (!buyStreakState.announcedMixed
    && buyStreakState.runCount >= BUY_STREAK_THRESHOLD
    && buyStreakState.runItemIds.size >= 2) {
    buyStreakState.announcedMixed = true;
    return 'commerce.buy_streak_seed_mixed';
  }

  return '';
}

export function shouldSuppressSeedStandardBuyMessage(itemId, item) {
  if (!isSeedItem(item)) return false;
  return buyStreakState.sameItemId === itemId && buyStreakState.sameItemCount >= BUY_STREAK_THRESHOLD;
}
