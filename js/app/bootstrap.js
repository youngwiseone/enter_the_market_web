export async function runAppBootstrap(deps) {
  const {
    loadJSONData,
    initialiseState,
    evaluateGoals,
    syncGuidedUnlocks,
    attachEventHandlers,
    startPlaytimeTracking,
    initialiseMessageUI,
    markStoreUnlocksSeen,
    updateToolButtons,
    updateCursorForTool,
    installSidePanelScrollHandlers,
    state,
    addMessage,
    saveState,
    showTab,
    renderHUD,
    applyTheme,
    updateGridSize,
    getInitialMainTab,
    onViewportChange,
    setReduceMotion,
    initFxLayer
  } = deps;

  await loadJSONData();
  initialiseState();
  evaluateGoals();
  syncGuidedUnlocks();
  attachEventHandlers();
  startPlaytimeTracking();
  initialiseMessageUI();
  markStoreUnlocksSeen();
  const header = document.getElementById('market-header');
  if (header) {
    Array.from(header.children).forEach((child) => {
      if (child.tagName === 'SPAN') child.remove();
    });
  }
  updateToolButtons();
  updateCursorForTool();
  installSidePanelScrollHandlers();

  if (!state.player.welcomeShown) {
    addMessage('Welcome to the market!');
    state.player.welcomeShown = true;
    saveState();
  }

  const initialMainTab = typeof getInitialMainTab === 'function' ? getInitialMainTab() : 'market';
  showTab(initialMainTab === 'farm' ? 'farm' : 'market');
  renderHUD();
  applyTheme(state.player.theme);
  updateGridSize();
  if (initialMainTab === 'farm') {
    showTab('farm');
  }

  const reduceMotionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  setReduceMotion(!!(reduceMotionQuery && reduceMotionQuery.matches));
  if (reduceMotionQuery) {
    reduceMotionQuery.addEventListener('change', (event) => {
      setReduceMotion(!!event.matches);
    });
  }

  initFxLayer();
  window.addEventListener('resize', () => {
    updateGridSize();
    updateToolButtons();
    if (typeof onViewportChange === 'function') onViewportChange();
  });
  window.addEventListener('orientationchange', () => {
    updateGridSize();
    updateToolButtons();
    if (typeof onViewportChange === 'function') onViewportChange();
  });
  if ('ResizeObserver' in window) {
    const observedElements = ['market-header', 'market-table-container', 'messages-history-panel']
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (observedElements.length > 0) {
      const resizeObserver = new ResizeObserver(() => {
        updateGridSize();
        if (typeof onViewportChange === 'function') onViewportChange();
      });
      observedElements.forEach((el) => resizeObserver.observe(el));
    }
  }
}
