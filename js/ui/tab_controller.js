export function updateMainViewVisibilityDom(activeMainTab) {
  const marketTable = document.getElementById('market-table-container');
  const storePanel = document.getElementById('store');
  const goalsPanel = document.getElementById('goals-panel');
  const messagesPanel = document.getElementById('messages-history-panel');
  const isMarket = activeMainTab === 'market';
  const isStore = activeMainTab === 'store';
  const isGoals = activeMainTab === 'goals';
  const isMessages = activeMainTab === 'messages';
  if (marketTable) marketTable.style.display = isMarket ? 'block' : 'none';
  if (storePanel) storePanel.style.display = isStore ? 'block' : 'none';
  if (goalsPanel) goalsPanel.style.display = isGoals ? 'block' : 'none';
  if (messagesPanel) messagesPanel.style.display = isMessages ? 'flex' : 'none';
}

export function updateMainTabButtonsDom(activeMainTab, isStoreTabUnlocked, isGoalsTabUnlocked) {
  const marketTab = document.getElementById('tab-market');
  const storeTab = document.getElementById('tab-store');
  const goalsTab = document.getElementById('tab-goals');
  const storeUnlocked = isStoreTabUnlocked();
  const goalsUnlocked = isGoalsTabUnlocked();
  const isMarket = activeMainTab === 'market';
  const isStore = activeMainTab === 'store';
  const isGoals = activeMainTab === 'goals';
  if (marketTab) {
    marketTab.classList.toggle('active', isMarket);
    marketTab.setAttribute('aria-selected', isMarket ? 'true' : 'false');
  }
  if (storeTab) {
    storeTab.classList.toggle('active', isStore);
    storeTab.setAttribute('aria-selected', isStore ? 'true' : 'false');
    storeTab.disabled = !storeUnlocked;
    storeTab.setAttribute('aria-disabled', storeUnlocked ? 'false' : 'true');
    storeTab.title = storeUnlocked ? 'Open Shop' : 'Unlocks after first harvest';
  }
  if (goalsTab) {
    goalsTab.classList.toggle('active', isGoals);
    goalsTab.setAttribute('aria-selected', isGoals ? 'true' : 'false');
    goalsTab.disabled = !goalsUnlocked;
    goalsTab.setAttribute('aria-disabled', goalsUnlocked ? 'false' : 'true');
    goalsTab.title = goalsUnlocked ? 'Open Goal' : 'Unlocks after first harvest and rest';
  }
}

export function toggleMessagesPanelDom(deps) {
  const {
    getActiveMainTab,
    getTabBeforeMessages,
    setTabBeforeMessages,
    setActiveMainTab,
    showTab,
    updateMainViewVisibility,
    updateMainTabButtons,
    updateGridSize
  } = deps;
  if (getActiveMainTab() === 'messages') {
    showTab(getTabBeforeMessages() || 'market');
    return;
  }
  setTabBeforeMessages(getActiveMainTab());
  setActiveMainTab('messages');
  updateMainViewVisibility();
  updateMainTabButtons();
  const chatLog = document.getElementById('chat-log');
  if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
  updateGridSize();
}

export function showTabDom(tabName, deps) {
  const perfStart = performance.now();
  const {
    syncGuidedUnlocks,
    requestLockedTab,
    setTabBeforeMessages,
    setActiveMainTab,
    updateMainViewVisibility,
    updateMainTabButtons,
    markStoreUnlocksSeen,
    renderMarket,
    renderSelectedItemInsight,
    renderGuidancePanel,
    renderEnergyBar,
    renderStore,
    renderGoals,
    updateTabNotificationBadges,
    updateGridSize,
    trackActionDuration
  } = deps;
  try {
    syncGuidedUnlocks();
    if ((tabName === 'store' || tabName === 'goals') && !requestLockedTab(tabName)) {
      updateMainTabButtons();
      renderGuidancePanel();
      return;
    }
    if (tabName !== 'messages') setTabBeforeMessages(tabName);
    setActiveMainTab(tabName);
    if (tabName === 'store') markStoreUnlocksSeen();
    updateMainViewVisibility();
    updateMainTabButtons();
    renderMarket();
    renderSelectedItemInsight();
    renderGuidancePanel();
    renderEnergyBar();
    if (tabName === 'store') renderStore();
    if (tabName === 'goals') renderGoals();
    updateTabNotificationBadges();
    updateGridSize();
  } finally {
    trackActionDuration('showTab', performance.now() - perfStart);
  }
}
