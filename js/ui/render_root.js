export function renderAllAction(deps) {
  const {
    trackRenderCall,
    syncGuidedUnlocks,
    renderHUD,
    renderEnergyBar,
    renderProfileGoalSummary,
    renderGuidancePanel,
    renderMarket,
    renderSelectedItemInsight,
    renderStore,
    renderGoals,
    updateMainViewVisibility,
    updateMainTabButtons,
    updateTabNotificationBadges,
    updateTimeOfDayMood,
    updateGridSize
  } = deps;

  trackRenderCall();
  syncGuidedUnlocks();
  renderHUD();
  renderEnergyBar();
  renderProfileGoalSummary();
  renderGuidancePanel();
  renderMarket();
  renderSelectedItemInsight();

  const storeEl = document.getElementById('store');
  if (storeEl && window.getComputedStyle(storeEl).display !== 'none') {
    renderStore();
  }
  const goalsEl = document.getElementById('goals-panel');
  if (goalsEl && window.getComputedStyle(goalsEl).display !== 'none') {
    renderGoals();
  }

  updateMainViewVisibility();
  updateMainTabButtons();
  updateTabNotificationBadges();
  updateTimeOfDayMood();
  updateGridSize();
}
