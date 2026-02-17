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

export function getCurrentStoreUnlockIdsAction(state, isShopItemUnlocked) {
  const ids = [];
  if (Array.isArray(state.items)) {
    state.items.forEach((item) => {
      if (!item || typeof item.id !== 'number') return;
      if (isShopItemUnlocked(item.id)) ids.push(`shop:${item.id}`);
    });
  }
  if (state.store && Array.isArray(state.store.cosmetics)) {
    state.store.cosmetics.forEach((cosmetic) => {
      if (!cosmetic || typeof cosmetic.id !== 'string') return;
      if (cosmetic.unlocked) ids.push(`cosmetic:${cosmetic.id}`);
    });
  }
  return ids;
}

export function markStoreUnlocksSeenAction(seenStoreUnlockIds, getCurrentStoreUnlockIds) {
  seenStoreUnlockIds.clear();
  getCurrentStoreUnlockIds().forEach((id) => seenStoreUnlockIds.add(id));
}

export function getNewStoreUnlockCountAction(seenStoreUnlockIds, getCurrentStoreUnlockIds) {
  let count = 0;
  getCurrentStoreUnlockIds().forEach((id) => {
    if (!seenStoreUnlockIds.has(id)) count += 1;
  });
  return count;
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
    markStoreUnlocksSeen,
    setTabBadgeCount,
    getPendingGoalsCount,
    getNewStoreUnlockCount
  } = deps;
  if (activeMainTab === 'store') {
    markStoreUnlocksSeen();
  }
  setTabBadgeCount('tab-goals-badge', getPendingGoalsCount());
  setTabBadgeCount('tab-store-badge', getNewStoreUnlockCount());
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
