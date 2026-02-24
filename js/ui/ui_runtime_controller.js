const GOAL_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'harvest', label: 'Harvest' },
  { id: 'tiles', label: 'Tiles' },
  { id: 'cash', label: 'Cash' },
  { id: 'day', label: 'Day' },
  { id: 'networth', label: 'Net Worth' },
  { id: 'other', label: 'Other' }
];

const MARKET_TABLE_VIEW_STORAGE_KEY = 'etm.market_table_view';

function normalizeMarketTableView(view) {
  if (view === 'cosmetics') return 'cosmetics';
  if (view === 'utility') return 'utility';
  if (view === 'decorations') return 'decorations';
  return 'items';
}

function readPersistedMarketTableView() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'items';
    return normalizeMarketTableView(window.localStorage.getItem(MARKET_TABLE_VIEW_STORAGE_KEY));
  } catch {
    return 'items';
  }
}

function persistMarketTableView(view) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(MARKET_TABLE_VIEW_STORAGE_KEY, normalizeMarketTableView(view));
  } catch {
    // Ignore storage failures; UI state still works for this session.
  }
}

export function createUiRuntimeController(deps) {
  const {
    state,
    trackRenderCall,
    trackActionDuration,
    calculateGoalProgress,
    renderGoalsPanel,
    updateMainViewVisibilityDom,
    updateMainTabButtonsDom,
    toggleMessagesPanelDom,
    showTabDom,
    renderAllAction,
    getPendingGoalsCountAction,
    getCurrentMarketUnlockIdsAction,
    markMarketUnlocksSeenAction,
    markMarketUnlocksSeenForViewAction,
    getNewMarketUnlockCountAction,
    getNewMarketUnlockCountsAction,
    setTabBadgeCountAction,
    updateTabNotificationBadgesAction,
    renderProfileGoalSummaryAction
  } = deps;

  let currentGoalFilter = 'all';
  let currentMarketTableView = readPersistedMarketTableView();
  let activeMainTab = 'market';
  let tabBeforeMessages = 'market';
  let highlightedGoalId = null;
  const seenMarketUnlockIds = new Set();

  function getCurrentGoalFilter() {
    return currentGoalFilter;
  }

  function setCurrentGoalFilter(filterId) {
    currentGoalFilter = filterId;
  }

  function getCurrentMarketTableView() {
    return currentMarketTableView;
  }

  function setCurrentMarketTableView(viewId) {
    currentMarketTableView = normalizeMarketTableView(viewId);
    persistMarketTableView(currentMarketTableView);
  }

  function getGoalProgress(goal) {
    return calculateGoalProgress(goal, {
      getGoalConditions: deps.getGoalConditions,
      getGoalMetricValue: deps.getGoalMetricValue,
      doesConditionMeet: deps.doesConditionMeet
    });
  }

  function renderGoals() {
    renderGoalsPanel({
      state,
      currentGoalFilter,
      highlightedGoalId,
      setCurrentGoalFilter: (filterId) => {
        currentGoalFilter = filterId;
      },
      goalFilterOptions: GOAL_FILTER_OPTIONS,
      getGoalConditions: deps.getGoalConditions,
      getGoalMetricValue: deps.getGoalMetricValue,
      doesConditionMeet: deps.doesConditionMeet,
      rerender: renderGoals
    });
  }

  function updateMainViewVisibility() {
    updateMainViewVisibilityDom(activeMainTab);
  }

  function isActiveMainTabMarket() {
    return activeMainTab === 'market';
  }

  function updateMainTabButtons() {
    updateMainTabButtonsDom(activeMainTab, deps.isStoreTabUnlocked, deps.isGoalsTabUnlocked);
  }

  function toggleMessagesPanel() {
    toggleMessagesPanelDom({
      getActiveMainTab: () => activeMainTab,
      getTabBeforeMessages: () => tabBeforeMessages,
      setTabBeforeMessages: (tabName) => {
        tabBeforeMessages = tabName;
      },
      setActiveMainTab: (tabName) => {
        activeMainTab = tabName;
      },
      showTab,
      updateMainViewVisibility,
      updateMainTabButtons,
      updateGridSize: deps.updateGridSize
    });
  }

  function showTab(tabName) {
    showTabDom(tabName, {
      syncGuidedUnlocks: deps.syncGuidedUnlocks,
      requestLockedTab: deps.requestLockedTab,
      setTabBeforeMessages: (nextTab) => {
        tabBeforeMessages = nextTab;
      },
      setActiveMainTab: (nextTab) => {
        activeMainTab = nextTab;
      },
      updateMainViewVisibility,
      updateMainTabButtons,
      renderMarket: deps.renderMarket,
      renderSelectedItemInsight: deps.renderSelectedItemInsight,
      renderGuidancePanel: deps.renderGuidancePanel,
      renderEnergyBar: deps.renderEnergyBar,
      renderGoals,
      updateTabNotificationBadges,
      updateGridSize: deps.updateGridSize,
      trackActionDuration
    });
  }

  function getPendingGoalsCount() {
    return getPendingGoalsCountAction(state, deps.doesGoalMeetCondition);
  }

  function getCurrentMarketUnlockIds() {
    return getCurrentMarketUnlockIdsAction(state, deps.isShopItemUnlocked);
  }

  function markMarketUnlocksSeen() {
    markMarketUnlocksSeenAction(seenMarketUnlockIds, getCurrentMarketUnlockIds);
  }

  function markMarketUnlocksSeenForView(viewId = currentMarketTableView) {
    markMarketUnlocksSeenForViewAction(seenMarketUnlockIds, getCurrentMarketUnlockIds, viewId);
  }

  function getNewMarketUnlockCount() {
    return getNewMarketUnlockCountAction(seenMarketUnlockIds, getCurrentMarketUnlockIds);
  }

  function getNewMarketUnlockCounts() {
    return getNewMarketUnlockCountsAction(seenMarketUnlockIds, getCurrentMarketUnlockIds);
  }

  function setTabBadgeCount(badgeId, count) {
    setTabBadgeCountAction(badgeId, count);
  }

  function updateTabNotificationBadges() {
    updateTabNotificationBadgesAction({
      activeMainTab,
      activeMarketTableView: currentMarketTableView,
      markMarketUnlocksSeenForView,
      setTabBadgeCount,
      getPendingGoalsCount,
      getNewMarketUnlockCounts
    });
  }

  function renderProfileGoalSummary() {
    const highlightedGoalIdRef = {
      get value() {
        return highlightedGoalId;
      },
      set value(nextValue) {
        highlightedGoalId = nextValue;
      }
    };
    renderProfileGoalSummaryAction({
      state,
      getGoalProgress,
      highlightedGoalIdRef,
      setCurrentGoalFilter: (nextFilter) => {
        currentGoalFilter = nextFilter;
      },
      showTab
    });
  }

  function renderAll() {
    renderAllAction({
      trackRenderCall,
      syncGuidedUnlocks: deps.syncGuidedUnlocks,
      renderHUD: deps.renderHUD,
      renderEnergyBar: deps.renderEnergyBar,
      renderProfileGoalSummary,
      renderGuidancePanel: deps.renderGuidancePanel,
      renderMarket: deps.renderMarket,
      renderSelectedItemInsight: deps.renderSelectedItemInsight,
      renderGoals,
      updateMainViewVisibility,
      updateMainTabButtons,
      updateTabNotificationBadges,
      updateTimeOfDayMood: deps.updateTimeOfDayMood,
      updateGridSize: deps.updateGridSize
    });
  }

  return {
    getCurrentGoalFilter,
    setCurrentGoalFilter,
    getCurrentMarketTableView,
    setCurrentMarketTableView,
    getGoalProgress,
    renderGoals,
    updateMainViewVisibility,
    isActiveMainTabMarket,
    updateMainTabButtons,
    toggleMessagesPanel,
    showTab,
    getPendingGoalsCount,
    getCurrentMarketUnlockIds,
    markMarketUnlocksSeen,
    markMarketUnlocksSeenForView,
    getNewMarketUnlockCount,
    getNewMarketUnlockCounts,
    setTabBadgeCount,
    updateTabNotificationBadges,
    renderProfileGoalSummary,
    renderAll
  };
}
