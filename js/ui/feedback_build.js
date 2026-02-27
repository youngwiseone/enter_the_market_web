export function startPlaytimeTrackingAction(playtestStats, options = {}) {
  const onPersistSessionMs = typeof options.onPersistSessionMs === 'function'
    ? options.onPersistSessionMs
    : null;
  let didPersistSessionPlaytime = false;

  const persistSessionPlaytime = () => {
    if (didPersistSessionPlaytime || !onPersistSessionMs) return;
    const totalSessionMs = getActivePlaytimeMsAction(playtestStats);
    onPersistSessionMs(totalSessionMs);
    didPersistSessionPlaytime = true;
  };

  playtestStats.lastActiveAt = document.hidden ? null : performance.now();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (playtestStats.lastActiveAt !== null) {
        playtestStats.activeMs += performance.now() - playtestStats.lastActiveAt;
        playtestStats.lastActiveAt = null;
      }
      return;
    }
    if (playtestStats.lastActiveAt === null) {
      playtestStats.lastActiveAt = performance.now();
    }
  });
  window.addEventListener('pagehide', persistSessionPlaytime, { once: true });
  window.addEventListener('beforeunload', persistSessionPlaytime, { once: true });
}

export function getActivePlaytimeMsAction(playtestStats) {
  let total = playtestStats.activeMs;
  if (playtestStats.lastActiveAt !== null) {
    total += performance.now() - playtestStats.lastActiveAt;
  }
  return Math.max(0, total);
}

export function formatPlaytimeAction(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours <= 0) {
    return `${minutes}m${seconds}s`;
  }
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatMoneyAction(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 'n/a';
  return numberValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getGrowablePlantCountAction(deps) {
  const { state, getFarmState, FARM_PRIMARY_ID, FARM_SECONDARY_ID } = deps;
  if (!state.farms || typeof state.farms !== 'object') return null;
  if (!Array.isArray(state.items)) {
    return null;
  }
  const itemById = new Map(state.items.map((item) => [item.id, item]));
  const farmsToCount = [getFarmState(FARM_PRIMARY_ID), getFarmState(FARM_SECONDARY_ID)];
  return farmsToCount.reduce((farmTotal, farm) => {
    if (!Array.isArray(farm.gridItems)) return farmTotal;
    let count = 0;
    farm.gridItems.forEach((itemId) => {
      if (!itemId) return;
      const item = itemById.get(itemId);
      const growDays = Number(item?.growDays) || 0;
      if (growDays > 0) {
        count += 1;
      }
    });
    return farmTotal + count;
  }, 0);
}

export function getGoalsSummaryAction(state) {
  if (!Array.isArray(state.goals)) {
    return null;
  }
  if (!state.goalsClaimed || typeof state.goalsClaimed !== 'object') {
    return null;
  }
  const total = state.goals.length;
  const completed = Object.keys(state.goalsClaimed).length;
  return { completed, total };
}

export function buildFeedbackStringAction(deps) {
  const {
    BUILD_VERSION,
    state,
    getActivePlaytimeMs,
    formatPlaytime,
    formatMoney,
    getGrowablePlantCount,
    getGoalsSummary
  } = deps;

  const played = formatPlaytime(getActivePlaytimeMs());
  const dayValue = Number(state.player?.day);
  const dayText = Number.isFinite(dayValue) ? String(dayValue) : 'n/a';
  const moneyFormatted = formatMoney(state.player?.cash);
  const moneyText = moneyFormatted === 'n/a' ? 'n/a' : `$${moneyFormatted}`;
  const plantsCount = getGrowablePlantCount();
  const plantsText = Number.isFinite(plantsCount) ? String(plantsCount) : 'n/a';
  const goalsSummary = getGoalsSummary();
  const goalsText = goalsSummary ? `${goalsSummary.completed}/${goalsSummary.total}` : 'n/a';

  return `EnterTheMarket ${BUILD_VERSION} | Played: ${played} | Day: ${dayText} | Money: ${moneyText} | Plants: ${plantsText} | Goals: ${goalsText}`;
}
