export function getGoalMetricValueAction(deps) {
  const {
    state,
    metric,
    calculateNetWorth,
    getUnlockedTileCountForFarm,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID
  } = deps;

  if (typeof metric !== 'string') return 0;
  if (metric === 'cash') return Number(state.player?.cash) || 0;
  if (metric === 'netWorth') return calculateNetWorth();
  if (metric === 'day') return Number(state.player?.day) || 0;
  if (metric === 'harvestCount') return Number(state.goalStats?.harvestCount) || 0;
  if (metric === 'gridUnlockedCount') {
    return Math.max(
      getUnlockedTileCountForFarm(FARM_PRIMARY_ID),
      getUnlockedTileCountForFarm(FARM_SECONDARY_ID)
    );
  }
  if (metric.startsWith('itemsHarvested.')) {
    const itemId = metric.split('.')[1];
    return Number(state.goalStats?.itemsHarvested?.[itemId]) || 0;
  }
  return 0;
}

export function getGoalConditionsAction(goal) {
  if (!goal || typeof goal !== 'object' || !goal.goal || typeof goal.goal !== 'object') {
    return [];
  }
  if (Array.isArray(goal.goal.all)) {
    return goal.goal.all.filter((condition) => condition && typeof condition.metric === 'string');
  }
  if (typeof goal.goal.metric === 'string') {
    return [goal.goal];
  }
  return [];
}

export function doesConditionMeetAction(deps) {
  const { condition, getGoalMetricValue } = deps;
  if (!condition || typeof condition !== 'object' || typeof condition.metric !== 'string') return false;
  const metricValue = getGoalMetricValue(condition.metric);
  const targetValue = Number(condition.value) || 0;
  const operator = condition.operator || '>=';
  if (operator === '<') return metricValue < targetValue;
  if (operator === '<=') return metricValue <= targetValue;
  if (operator === '>') return metricValue > targetValue;
  if (operator === '==') return metricValue === targetValue;
  return metricValue >= targetValue;
}

export function doesGoalMeetConditionAction(deps) {
  const { goal, getGoalConditions, doesConditionMeet } = deps;
  const conditions = getGoalConditions(goal);
  if (!conditions.length) return false;
  return conditions.every((condition) => doesConditionMeet(condition));
}

export function applyGoalRewardAction(deps) {
  const {
    state,
    goal,
    updateNetWorth,
    TOOL_LIST,
    resetShopEntryToBasePrice,
    getFreePurchaseCount
  } = deps;

  if (!goal || typeof goal !== 'object') return false;
  const reward = goal.reward || {};
  let changed = false;
  const cashBonus = Math.max(0, Number(reward.cashBonus) || 0);
  if (cashBonus > 0) {
    state.player.cash = (Number(state.player.cash) || 0) + cashBonus;
    updateNetWorth();
    changed = true;
  }
  if (typeof reward.unlockTool === 'string' && TOOL_LIST.includes(reward.unlockTool)) {
    if (!state.unlockedTools[reward.unlockTool]) {
      state.unlockedTools[reward.unlockTool] = true;
      changed = true;
    }
  }
  if (typeof reward.unlockShopItem === 'number') {
    const itemId = reward.unlockShopItem;
    if (!state.unlockedShopItems[itemId]) {
      state.unlockedShopItems[itemId] = true;
      resetShopEntryToBasePrice(itemId);
      changed = true;
    }
  }
  if (Array.isArray(reward.unlockShopItems)) {
    reward.unlockShopItems.forEach((itemIdRaw) => {
      const itemId = Number(itemIdRaw);
      if (!Number.isInteger(itemId)) return;
      if (!state.unlockedShopItems[itemId]) {
        state.unlockedShopItems[itemId] = true;
        resetShopEntryToBasePrice(itemId);
        changed = true;
      }
    });
  }
  if (reward.freePurchases && typeof reward.freePurchases === 'object') {
    const itemId = reward.freePurchases.itemId;
    const count = Math.max(0, Number(reward.freePurchases.count) || 0);
    if (typeof itemId === 'number' && count > 0) {
      const key = String(itemId);
      const previous = getFreePurchaseCount(itemId);
      state.freePurchasesByItem[key] = previous + count;
      changed = true;
    }
  }
  if (typeof reward.grantCosmetic === 'string' && state.store && Array.isArray(state.store.cosmetics)) {
    const cosmetic = state.store.cosmetics.find((c) => c.id === reward.grantCosmetic);
    if (cosmetic && !cosmetic.unlocked) {
      cosmetic.unlocked = true;
      changed = true;
    }
  }
  if (typeof reward.setFlag === 'string' && reward.setFlag) {
    if (!state.goalFlags[reward.setFlag]) {
      state.goalFlags[reward.setFlag] = true;
      changed = true;
    }
  }
  return changed;
}

export function evaluateGoalsAction(deps) {
  const {
    state,
    getGoalProgress,
    addMessage,
    doesGoalMeetCondition,
    applyGoalReward,
    awardPlayerXp,
    XP_REWARDS,
    enqueueGoalCelebration,
    isToolUnlocked,
    TOOL_GLOVE,
    saveState,
    updateToolButtons,
    updateCursorForTool
  } = deps;

  if (!Array.isArray(state.goals) || !state.goals.length) return 0;
  let completedCount = 0;
  const milestonePercents = [25, 50, 75];
  state.goals.forEach((goal) => {
    if (!goal || typeof goal !== 'object' || typeof goal.id !== 'string') return;
    if (goal.enabled === false) return;
    if (state.goalsClaimed[goal.id]) return;

    const progress = getGoalProgress(goal);
    milestonePercents.forEach((percent) => {
      const key = `goalMilestone:${goal.id}:${percent}`;
      if (progress.percent >= percent && !state.goalFlags[key]) {
        state.goalFlags[key] = true;
        addMessage(`${goal.name || goal.id} progress: ${percent}% complete.`, {
          speaker: 'player',
          emotion: 'neutral',
          category: 'goal',
          priority: 'normal'
        });
      }
    });

    if (!doesGoalMeetCondition(goal)) return;
    applyGoalReward(goal);
    awardPlayerXp(XP_REWARDS.goal);
    state.goalsClaimed[goal.id] = true;
    completedCount += 1;
    const message = goal.message || `Goal complete: ${goal.name || goal.id}.`;
    addMessage(message, { speaker: 'player', emotion: 'goal_unlocked', category: 'goal', priority: 'high' });
    enqueueGoalCelebration(goal);
  });
  if (completedCount > 0) {
    if (state.activeTool && !isToolUnlocked(state.activeTool)) {
      state.activeTool = TOOL_GLOVE;
    }
    saveState();
    updateToolButtons();
    updateCursorForTool();
  }
  return completedCount;
}
