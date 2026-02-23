export function updateMainViewVisibilityDom(activeMainTab) {
  const isMobileLayout = !!(document.body && document.body.classList.contains('mobile-layout'));
  const effectiveTab = (!isMobileLayout && activeMainTab === 'farm') ? 'market' : activeMainTab;
  if (document.body) {
    document.body.setAttribute('data-active-main-tab', effectiveTab);
  }
  const farmPanel = document.getElementById('farm-panel');
  const marketRoot = document.getElementById('market');
  const marketTable = document.getElementById('market-table-container');
  const goalsPanel = document.getElementById('goals-panel');
  const messagesPanel = document.getElementById('messages-history-panel');
  const isFarm = effectiveTab === 'farm';
  const isMarket = effectiveTab === 'market';
  const isGoals = effectiveTab === 'goals';
  const isMessages = effectiveTab === 'messages';

  if (isMobileLayout) {
    if (farmPanel) farmPanel.style.display = isFarm ? 'flex' : 'none';
    if (marketRoot) marketRoot.style.display = isFarm ? 'none' : 'flex';
    if (marketTable) marketTable.style.display = isMarket ? 'block' : 'none';
    if (goalsPanel) goalsPanel.style.display = isGoals ? 'block' : 'none';
    if (messagesPanel) messagesPanel.style.display = isMessages ? 'flex' : 'none';
    return;
  }

  if (farmPanel) farmPanel.style.display = '';
  if (marketRoot) marketRoot.style.display = 'flex';
  if (marketTable) marketTable.style.display = isMarket ? 'block' : 'none';
  if (goalsPanel) goalsPanel.style.display = isGoals ? 'block' : 'none';
  if (messagesPanel) messagesPanel.style.display = isMessages ? 'flex' : 'none';
}

export function updateMainTabButtonsDom(activeMainTab, _isStoreTabUnlocked, isGoalsTabUnlocked) {
  const isMobileLayout = !!(document.body && document.body.classList.contains('mobile-layout'));
  const effectiveTab = (!isMobileLayout && activeMainTab === 'farm') ? 'market' : activeMainTab;
  const farmTabs = Array.from(document.querySelectorAll('[data-main-tab="farm"]'));
  const marketTab = document.getElementById('tab-market');
  const goalsTab = document.getElementById('tab-goals');
  const marketTabs = Array.from(new Set([marketTab, ...Array.from(document.querySelectorAll('[data-main-tab="market"]'))].filter(Boolean)));
  const goalsTabs = Array.from(new Set([goalsTab, ...Array.from(document.querySelectorAll('[data-main-tab="goals"]'))].filter(Boolean)));
  const goalsUnlocked = isGoalsTabUnlocked();
  const isFarm = effectiveTab === 'farm';
  const isMarket = effectiveTab === 'market';
  const isGoals = effectiveTab === 'goals';
  farmTabs.forEach((tab) => {
    tab.classList.toggle('active', isFarm);
    tab.setAttribute('aria-selected', isFarm ? 'true' : 'false');
  });
  marketTabs.forEach((tab) => {
    tab.classList.toggle('active', isMarket);
    tab.setAttribute('aria-selected', isMarket ? 'true' : 'false');
  });
  goalsTabs.forEach((tab) => {
    tab.classList.toggle('active', isGoals);
    tab.setAttribute('aria-selected', isGoals ? 'true' : 'false');
    tab.disabled = !goalsUnlocked;
    tab.setAttribute('aria-disabled', goalsUnlocked ? 'false' : 'true');
    tab.title = goalsUnlocked ? 'Open Goal' : 'Unlocks after first harvest and rest';
  });
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
    renderMarket,
    renderSelectedItemInsight,
    renderGuidancePanel,
    renderEnergyBar,
    renderGoals,
    updateTabNotificationBadges,
    updateGridSize,
    trackActionDuration
  } = deps;
  try {
    syncGuidedUnlocks();
    if (tabName === 'goals' && !requestLockedTab(tabName)) {
      updateMainTabButtons();
      renderGuidancePanel();
      return;
    }
    if (tabName !== 'messages') setTabBeforeMessages(tabName);
    setActiveMainTab(tabName);
    updateMainViewVisibility();
    updateMainTabButtons();
    renderMarket();
    renderSelectedItemInsight();
    renderGuidancePanel();
    renderEnergyBar();
    if (tabName === 'goals') renderGoals();
    updateTabNotificationBadges();
    updateGridSize();
  } finally {
    trackActionDuration('showTab', performance.now() - perfStart);
  }
}
