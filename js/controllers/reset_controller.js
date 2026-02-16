export async function resetGameAction(deps) {
  const {
    state,
    loadJSONData,
    initialiseState,
    createEmptyFarmState,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    applyFarmStateToActiveGrid,
    TOOL_GLOVE,
    clone,
    defaultGoals,
    getDefaultUnlockedTools,
    getDefaultUnlockedShopItems,
    persistResetState,
    saveToStorage,
    renderAll,
    updateToolButtons,
    updateCursorForTool,
    addMessage,
    saveState,
    clearGoalCelebrationSparkles,
    setGoalCelebrationOpen
  } = deps;

  if (!confirm('Are you sure you want to reset your progress? This will erase all saved data.')) {
    return;
  }
  localStorage.clear();
  try {
    await loadJSONData();
  } catch (e) {
    console.error('Error reloading data during reset', e);
  }
  initialiseState();
  state.farms = {
    [FARM_PRIMARY_ID]: createEmptyFarmState(),
    [FARM_SECONDARY_ID]: createEmptyFarmState()
  };
  state.secondFarmPurchased = false;
  state.activeFarmId = FARM_PRIMARY_ID;
  applyFarmStateToActiveGrid(FARM_PRIMARY_ID);
  state.activeTool = TOOL_GLOVE;
  state.goals = clone(defaultGoals);
  state.goalsClaimed = {};
  state.unlockedTools = getDefaultUnlockedTools();
  state.unlockedShopItems = getDefaultUnlockedShopItems(state.items);
  state.freePurchasesByItem = {};
  state.goalFlags = {};
  state.goalStats = { harvestCount: 0, itemsHarvested: {} };
  state.dayActionCount = 0;
  state.dailyMarketRollHistory = [];
  state.lastRollFatiguePercent = 0;
  state.lastRollImpactMultiplier = 1;
  state.daySalesCount = 0;
  state.daySalesTotal = 0;
  state.dayTopSale = null;
  state.daySummaryHistory = [];
  state.pendingDaySummary = null;
  state.goalCelebrationQueue = [];
  state.activeGoalCelebration = null;
  clearGoalCelebrationSparkles();
  setGoalCelebrationOpen(false);
  persistResetState(saveToStorage, state);
  renderAll();
  updateToolButtons();
  updateCursorForTool();
  if (!state.player.welcomeShown) {
    addMessage('Welcome to the market!');
    state.player.welcomeShown = true;
    saveState();
  }
  alert('Game has been reset to default values.');
}
