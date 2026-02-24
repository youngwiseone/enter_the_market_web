export function getPendingGoalsCountAction(state, doesGoalMeetCondition) {
  if (!Array.isArray(state.goals)) return 0;
  return state.goals.reduce((count, goal) => {
    if (!goal || typeof goal !== 'object' || typeof goal.id !== 'string') return count;
    if (goal.enabled === false) return count;
    if (state.goalsClaimed?.[goal.id]) return count;
    if (doesGoalMeetCondition(goal)) return count + 1;
    return count;
  }, 0);
}

export function getCurrentMarketUnlockIdsAction(state, isShopItemUnlocked) {
  const ids = [];
  if (Array.isArray(state.items)) {
    state.items.forEach((item) => {
      if (!item || typeof item.id !== 'number') return;
      if (isShopItemUnlocked(item.id)) ids.push(`shop:${item.id}`);
    });
  }
  const cosmetics = Array.isArray(state?.store?.cosmetics) ? state.store.cosmetics : [];
  cosmetics.forEach((item) => {
    if (!item || typeof item.id !== 'string') return;
    if (item.unlocked) ids.push(`cosmetic:${item.id}`);
  });
  return ids;
}

function getUnlockPrefixForMarketView(viewId) {
  if (viewId === 'cosmetics') return 'cosmetic:';
  if (viewId === 'items' || viewId === 'produce') return 'shop:';
  return null;
}

export function markMarketUnlocksSeenAction(seenMarketUnlockIds, getCurrentMarketUnlockIds) {
  seenMarketUnlockIds.clear();
  getCurrentMarketUnlockIds().forEach((id) => seenMarketUnlockIds.add(id));
}

export function markMarketUnlocksSeenForViewAction(seenMarketUnlockIds, getCurrentMarketUnlockIds, viewId) {
  const prefix = getUnlockPrefixForMarketView(viewId);
  if (!prefix) return;
  getCurrentMarketUnlockIds().forEach((id) => {
    if (String(id).startsWith(prefix)) {
      seenMarketUnlockIds.add(id);
    }
  });
}

export function getNewMarketUnlockCountsAction(seenMarketUnlockIds, getCurrentMarketUnlockIds) {
  let market = 0;
  let cosmetics = 0;
  getCurrentMarketUnlockIds().forEach((id) => {
    if (seenMarketUnlockIds.has(id)) return;
    if (String(id).startsWith('cosmetic:')) {
      cosmetics += 1;
      return;
    }
    market += 1;
  });
  return {
    market,
    cosmetics,
    total: market + cosmetics
  };
}

export function getNewMarketUnlockCountAction(seenMarketUnlockIds, getCurrentMarketUnlockIds) {
  return getNewMarketUnlockCountsAction(seenMarketUnlockIds, getCurrentMarketUnlockIds).total;
}

export function setTabBadgeCountAction(badgeId, count) {
  const value = Math.max(0, Number(count) || 0);
  const candidates = [];
  const primary = document.getElementById(badgeId);
  if (primary) candidates.push(primary);
  document.querySelectorAll(`[data-badge-for="${badgeId}"]`).forEach((node) => {
    if (!candidates.includes(node)) candidates.push(node);
  });
  candidates.forEach((badge) => {
    badge.textContent = String(value);
    badge.classList.toggle('has-count', value > 0);
  });
}

export function updateTabNotificationBadgesAction(deps) {
  const {
    activeMainTab,
    activeMarketTableView,
    markMarketUnlocksSeenForView,
    setTabBadgeCount,
    getPendingGoalsCount,
    getNewMarketUnlockCounts
  } = deps;
  if (activeMainTab === 'market') {
    markMarketUnlocksSeenForView(activeMarketTableView);
  }
  const unlockCounts = getNewMarketUnlockCounts();
  setTabBadgeCount('tab-goals-badge', getPendingGoalsCount());
  setTabBadgeCount('tab-market-badge', unlockCounts.total);
  document.querySelectorAll('[data-main-tab="market"]').forEach((tab) => {
    if (!(tab instanceof HTMLElement)) return;
    tab.title = unlockCounts.total > 0
      ? `Open Market (${unlockCounts.total} new market/cosmetic unlock${unlockCounts.total === 1 ? '' : 's'})`
      : 'Open Market';
  });
}

export function renderProfileGoalSummaryAction(deps) {
  const {
    state,
    getGoalProgress,
    highlightedGoalIdRef,
    setCurrentGoalFilter,
    showTab
  } = deps;
  const list = document.getElementById('profile-goals-list');
  if (!list) return;
  list.innerHTML = '';
  if (!Array.isArray(state.goals)) return;
  const rows = state.goals
    .filter((goal) => goal && typeof goal.id === 'string' && goal.enabled !== false && !state.goalsClaimed?.[goal.id])
    .map((goal) => {
      const progress = getGoalProgress(goal);
      return { goal, percent: progress.percent };
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2);
  if (rows.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No pending goals';
    list.appendChild(li);
    return;
  }
  rows.forEach((row) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button profile-goal-button';
    button.textContent = `${row.goal.name || row.goal.id} ${row.percent}%`;
    button.addEventListener('click', () => {
      highlightedGoalIdRef.value = row.goal.id;
      setCurrentGoalFilter('all');
      showTab('goals');
    });
    li.appendChild(button);
    list.appendChild(li);
  });
}
