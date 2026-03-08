export function renderAllAction(deps) {
  const {
    trackRenderCall,
    syncGuidedUnlocks,
    renderHUD,
    renderEnergyBar,
    renderProfileGoalSummary,
    renderGuidancePanel,
    renderMarket,
    renderData,
    renderSelectedItemInsight,
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
  renderData();
  renderSelectedItemInsight();
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
