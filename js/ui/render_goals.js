import { FARM_TWO_PURCHASE_COST, GRID_CELL_COUNT } from '../sim/constants.js';
import { getQuickRollPreference, setQuickRollPreference } from './daily_roll_modal.js';
import { getTradingChallengeView } from '../state/trading_challenge.js';

function getGoalMetricCategory(metric) {
  if (typeof metric !== 'string' || !metric) return 'other';
  if (metric === 'harvestCount' || metric.startsWith('itemsHarvested.')) return 'harvest';
  if (metric === 'gridUnlockedCount') return 'tiles';
  if (metric === 'cash') return 'cash';
  if (metric === 'day') return 'day';
  if (metric === 'netWorth') return 'networth';
  return 'other';
}

function getGoalCategories(goal, getGoalConditions) {
  const categories = new Set();
  getGoalConditions(goal).forEach((condition) => {
    categories.add(getGoalMetricCategory(condition.metric));
  });
  return categories;
}

function goalMatchesFilter(goal, filterId, getGoalConditions) {
  if (filterId === 'all') return true;
  const categories = getGoalCategories(goal, getGoalConditions);
  return categories.has(filterId);
}

function formatGoalMetric(metric, state) {
  if (typeof metric !== 'string' || !metric) return metric;
  if (metric === 'cash') return 'Cash';
  if (metric === 'netWorth') return 'Net Worth';
  if (metric === 'day') return 'Day';
  if (metric === 'harvestCount') return 'Harvest Count';
  if (metric === 'gridUnlockedCount') return 'Tiles Unlocked';
  if (metric.startsWith('itemsHarvested.')) {
    const itemId = Number(metric.split('.')[1]);
    const item = state.items.find((it) => it.id === itemId);
    return item ? `${item.name} Harvested` : `Item ${itemId} Harvested`;
  }
  return metric;
}

function formatGoalCondition(condition, state) {
  if (!condition || typeof condition !== 'object') return '';
  const metricLabel = formatGoalMetric(condition.metric, state);
  const target = Math.max(0, Number(condition.value) || 0);
  const operator = condition.operator || '>=';
  const isMoneyMetric = condition.metric === 'cash' || condition.metric === 'netWorth';
  const targetText = isMoneyMetric ? `$${target.toFixed(2)}` : `${target}`;
  return `${metricLabel} ${operator} ${targetText}`;
}

function formatGoalReward(reward, state) {
  if (!reward || typeof reward !== 'object') return 'Reward pending';
  const parts = [];
  const cashBonus = Math.max(0, Number(reward.cashBonus) || 0);
  if (cashBonus > 0) parts.push(`Cash: $${cashBonus.toFixed(2)}`);
  if (typeof reward.unlockTool === 'string') parts.push(`Tool: ${reward.unlockTool}`);
  if (reward.freePurchases && typeof reward.freePurchases === 'object') {
    const itemId = Number(reward.freePurchases.itemId);
    const count = Number(reward.freePurchases.count) || 0;
    const item = state.items.find((it) => it.id === itemId);
    parts.push(`${count} free purchases (${item ? item.name : itemId})`);
  }
  if (typeof reward.grantCosmetic === 'string') {
    const cosmetic = state.store?.cosmetics?.find((c) => c.id === reward.grantCosmetic);
    parts.push(`Cosmetic: ${cosmetic ? cosmetic.name : reward.grantCosmetic}`);
  }
  if (typeof reward.setFlag === 'string') parts.push(`Flag: ${reward.setFlag}`);
  return parts.length ? parts.join(' | ') : 'Reward pending';
}

export function calculateGoalProgress(goal, deps) {
  const { getGoalConditions, getGoalMetricValue, doesConditionMeet } = deps;
  const conditions = getGoalConditions(goal);
  if (!conditions.length) return { current: 0, target: 0, percent: 0, progressText: '0 / 0' };

  if (conditions.length === 1) {
    const metric = conditions[0].metric;
    const target = Math.max(0, Number(conditions[0].value) || 0);
    const current = Math.max(0, getGoalMetricValue(metric));
    const operator = conditions[0].operator || '>=';
    let percent = 0;
    if (target <= 0) {
      percent = 100;
    } else if (operator === '==') {
      percent = current === target ? 100 : Math.min(99, Math.round((current / target) * 100));
    } else {
      percent = Math.min(100, Math.round((current / target) * 100));
    }
    const isMoneyMetric = metric === 'cash' || metric === 'netWorth';
    const progressText = isMoneyMetric
      ? `$${current.toFixed(2)} / $${target.toFixed(2)}`
      : `${current} / ${target}`;
    return { current, target, percent, progressText };
  }

  let totalPercent = 0;
  let metCount = 0;
  conditions.forEach((condition) => {
    const metric = condition.metric;
    const target = Math.max(0, Number(condition.value) || 0);
    const current = Math.max(0, getGoalMetricValue(metric));
    const operator = condition.operator || '>=';
    let percent = 0;
    if (target <= 0) {
      percent = 100;
    } else if (operator === '==') {
      percent = current === target ? 100 : Math.min(99, Math.round((current / target) * 100));
    } else {
      percent = Math.min(100, Math.round((current / target) * 100));
    }
    totalPercent += percent;
    if (doesConditionMeet(condition)) metCount += 1;
  });
  const avgPercent = Math.round(totalPercent / conditions.length);
  return {
    current: metCount,
    target: conditions.length,
    percent: avgPercent,
    progressText: `${metCount} / ${conditions.length} conditions`
  };
}

export function renderGoalsPanel(deps) {
  const {
    state,
    currentGoalFilter,
    highlightedGoalId,
    setCurrentGoalFilter,
    goalFilterOptions,
    getGoalConditions,
    getGoalMetricValue,
    doesConditionMeet,
    getTotalPlaytimeMs,
    formatPlaytime,
    getAlwaysShowGridItemInfo,
    setAlwaysShowGridItemInfo,
    rerender,
    startTradingChallenge
  } = deps;

  const container = document.getElementById('goals-content');
  if (!container) return;
  container.innerHTML = '';
  const optionsTitle = document.createElement('div');
  optionsTitle.className = 'panel-title';
  optionsTitle.textContent = 'Options';
  container.appendChild(optionsTitle);

  const optionsRow = document.createElement('div');
  optionsRow.style.margin = '4px 0 8px';
  const itemInfoToggle = document.createElement('button');
  itemInfoToggle.type = 'button';
  itemInfoToggle.className = 'button';
  const alwaysOn = typeof getAlwaysShowGridItemInfo === 'function'
    ? !!getAlwaysShowGridItemInfo()
    : false;
  itemInfoToggle.textContent = alwaysOn
    ? 'Item Info: Always On'
    : 'Item Info: Default';
  itemInfoToggle.title = alwaysOn
    ? 'Always show crop % and sprinkler tank info on grid items.'
    : 'Use default behavior (timed fade, plus selection/roll context).';
  itemInfoToggle.setAttribute('aria-pressed', alwaysOn ? 'true' : 'false');
  itemInfoToggle.onclick = () => {
    if (typeof setAlwaysShowGridItemInfo !== 'function') return;
    setAlwaysShowGridItemInfo(!alwaysOn);
    rerender();
  };
  optionsRow.appendChild(itemInfoToggle);
  const quickRoll = document.createElement('button');
  quickRoll.type = 'button';
  quickRoll.className = 'button';
  quickRoll.style.marginLeft = '4px';
  const quickOn = getQuickRollPreference();
  quickRoll.textContent = `Quick market rolls: ${quickOn ? 'On' : 'Off'}`;
  quickRoll.setAttribute('aria-pressed', String(quickOn));
  quickRoll.title = 'Show the settled market results immediately. Days, prices and growth still advance normally.';
  quickRoll.onclick = () => { setQuickRollPreference(!quickOn); rerender(); };
  optionsRow.appendChild(quickRoll);
  container.appendChild(optionsRow);

  const goalsTitle = document.createElement('div');
  goalsTitle.className = 'panel-title';
  goalsTitle.textContent = 'Goals';
  container.appendChild(goalsTitle);
  const upcoming = getNextMeaningfulUnlock(state);
  if (upcoming) {
    const preview = document.createElement('div');
    preview.className = 'next-unlock-preview';
    const title = document.createElement('strong');
    title.textContent = `${upcoming.title} · ${upcoming.requirement}`;
    const detail = document.createElement('p');
    detail.textContent = upcoming.detail;
    preview.append(title, detail);
    container.appendChild(preview);
  }
  const challenge = getTradingChallengeView(state);
  const challengeCard = document.createElement('details');
  challengeCard.className = 'next-unlock-preview trading-challenge';
  const challengeTitle = document.createElement('summary');
  challengeTitle.textContent = `Optional: Market Timing · ${challenge.status === 'won' ? 'Complete' : challenge.status === 'active' ? `$${challenge.profit.toFixed(2)}/${challenge.targetProfit} · ${challenge.saleDays}/${challenge.targetSaleDays} sale days` : challenge.status === 'locked' ? `Level ${challenge.minLevel}` : challenge.status === 'expired' ? 'Try again' : 'Ready to start'}`;
  const challengeRules = document.createElement('p');
  challengeRules.textContent = `Earn $${challenge.targetProfit} of realised crop trading profit across ${challenge.targetSaleDays} sale days within ${challenge.windowDays} days. Only paid seeds bought and planted during the window count. Costs are attributed when sold: sale-time market value and rarity less actual seed and treatment spending. Unsold crops, existing crops or inventory, free seeds, unknown older treatment costs, Farm 2's bonus, rewards and resale do not count. No penalty if time runs out. Completion earns an achievement and goal XP.`;
  challengeCard.append(challengeTitle, challengeRules);
  if (challenge.status === 'active' || challenge.status === 'expired') {
    const windowNote = document.createElement('p');
    windowNote.textContent = `Window: Day ${challenge.startDay} through Day ${challenge.endDay}, inclusive.`;
    challengeCard.appendChild(windowNote);
  }
  if ((challenge.status === 'available' || challenge.status === 'expired') && typeof startTradingChallenge === 'function') {
    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.className = 'button';
    startButton.textContent = challenge.status === 'expired' ? 'Start a fresh window' : `Start ${challenge.windowDays}-day challenge`;
    startButton.onclick = () => startTradingChallenge();
    challengeCard.appendChild(startButton);
  }
  container.appendChild(challengeCard);

  const playtimeRow = document.createElement('div');
  playtimeRow.style.margin = '4px 0 6px';
  const totalPlaytimeMs = typeof getTotalPlaytimeMs === 'function'
    ? Math.max(0, Number(getTotalPlaytimeMs()) || 0)
    : 0;
  const playtimeText = typeof formatPlaytime === 'function'
    ? formatPlaytime(totalPlaytimeMs)
    : `${Math.max(0, Math.floor(totalPlaytimeMs / 1000))}s`;
  playtimeRow.textContent = `Total Playtime: ${playtimeText}`;
  container.appendChild(playtimeRow);

  const filterBar = document.createElement('div');
  filterBar.style.display = 'flex';
  filterBar.style.flexWrap = 'wrap';
  filterBar.style.gap = '4px';
  filterBar.style.margin = '6px 0';
  goalFilterOptions.forEach((filter) => {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = filter.label;
    button.disabled = currentGoalFilter === filter.id;
    button.setAttribute('aria-pressed', currentGoalFilter === filter.id ? 'true' : 'false');
    button.onclick = () => {
      setCurrentGoalFilter(filter.id);
      rerender();
    };
    filterBar.appendChild(button);
  });
  container.appendChild(filterBar);

  const table = document.createElement('table');
  table.className = 'zebra-table';
  const headerRow = document.createElement('tr');
  ['Goal', 'Progress', 'Reward', 'Status'].forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  const progressDeps = { getGoalConditions, getGoalMetricValue, doesConditionMeet };
  const goals = Array.isArray(state.goals) ? state.goals.slice() : [];
  goals.sort((a, b) => {
    const aDone = state.goalsClaimed?.[a.id] ? 1 : 0;
    const bDone = state.goalsClaimed?.[b.id] ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aProgress = calculateGoalProgress(a, progressDeps).percent;
    const bProgress = calculateGoalProgress(b, progressDeps).percent;
    return bProgress - aProgress;
  });

  const filteredGoals = goals.filter((goal) => !goal.optional && goalMatchesFilter(goal, currentGoalFilter, getGoalConditions));
  filteredGoals.forEach((goal) => {
    const row = document.createElement('tr');
    row.dataset.goalId = goal.id || '';
    if (highlightedGoalId && goal.id === highlightedGoalId) row.classList.add('goal-row-highlight');

    const goalCell = document.createElement('td');
    const conditions = getGoalConditions(goal);
    const metricLabel = conditions.length > 1
      ? conditions.map((condition) => formatGoalCondition(condition, state)).join(' + ')
      : formatGoalMetric(goal.goal?.metric, state);
    goalCell.textContent = `${goal.name || goal.id} - ${goal.description || metricLabel}`;
    row.appendChild(goalCell);

    const progressCell = document.createElement('td');
    const progress = calculateGoalProgress(goal, progressDeps);
    progressCell.textContent = `${progress.progressText} (${progress.percent}%)`;
    row.appendChild(progressCell);

    const rewardCell = document.createElement('td');
    rewardCell.textContent = formatGoalReward(goal.reward, state);
    row.appendChild(rewardCell);

    const statusCell = document.createElement('td');
    const isCompleted = !!state.goalsClaimed?.[goal.id];
    statusCell.textContent = isCompleted ? 'Completed' : 'In Progress';
    statusCell.className = isCompleted ? 'goal-status-completed' : 'goal-status-progress';
    row.appendChild(statusCell);

    table.appendChild(row);
  });

  container.appendChild(table);
  if (filteredGoals.length === 0) {
    const empty = document.createElement('div');
    empty.style.marginTop = '6px';
    empty.textContent = 'No goals match this filter yet.';
    container.appendChild(empty);
  }
  if (highlightedGoalId) {
    const highlightedRow = table.querySelector(`tr[data-goal-id="${highlightedGoalId}"]`);
    if (highlightedRow) highlightedRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

export function getNextMeaningfulUnlock(state) {
  const level = Math.max(1, Number(state.player?.playerLevel) || 1);
  if (level < 10) return { title: 'Next feature: crop treatments', requirement: `Level ${level}/10`, detail: 'One-crop treatments can retain water, shorten growth or improve unresolved rarity. Each application costs cash and energy.' };
  if (level < 20) return { title: 'Next feature: irrigation', requirement: `Level ${level}/20`, detail: 'Sprinklers water adjacent growing crops at dawn. Arrange your plots around them; refill their tanks or use rain.' };
  if (!state.secondFarmPurchased) {
    const farm = Number(state.activeFarmId || 1) === 1 ? state : state.farms?.[1];
    const cleared = farm?.gridUnlocked?.filter(Boolean).length || 0;
    return { title: 'Next feature: Farm 2', requirement: `${cleared}/${GRID_CELL_COUNT} Farm 1 plots · $${FARM_TWO_PURCHASE_COST.toFixed(0)}`, detail: 'Clear every Farm 1 plot, then buy Farm 2 with the farm button. Its crops sell for 2× value, with a separate growing space.' };
  }
  return null;
}
