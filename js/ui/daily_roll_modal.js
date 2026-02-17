function createDailyRollSlotNode(item, extraClass = '') {
  const slot = document.createElement('div');
  slot.className = `daily-roll-reel-slot ${extraClass}`.trim();
  const icon = document.createElement('img');
  icon.src = item?.harvestImage || '';
  icon.alt = item?.itemName || 'Item';
  icon.title = item?.itemName || 'Unknown';
  icon.loading = 'eager';
  slot.appendChild(icon);
  return slot;
}

function triggerDailyRollLandingEffects(reelEl, reduceMotion, hitCount = 1) {
  if (!reelEl) return;
  if (hitCount > 1) {
    reelEl.classList.remove('duplicate-hit');
    void reelEl.offsetWidth;
    reelEl.classList.add('duplicate-hit');
    reelEl.addEventListener('animationend', () => reelEl.classList.remove('duplicate-hit'), { once: true });
  }
  const sparkImages = ['resources/effects/sparkle_gold_01.png', 'resources/effects/sparkle_gold_02.png'];
  const baseSparkCount = reduceMotion ? 4 : 8;
  const sparkCount = baseSparkCount + Math.max(0, Math.min(8, (Math.max(1, Number(hitCount) || 1) - 1) * 2));
  for (let i = 0; i < sparkCount; i += 1) {
    const spark = document.createElement('img');
    spark.className = 'daily-roll-spark';
    spark.src = sparkImages[Math.floor(Math.random() * sparkImages.length)];
    spark.alt = '';
    spark.style.left = `${10 + Math.random() * (Math.max(10, reelEl.clientWidth - 20))}px`;
    spark.style.top = `${20 + Math.random() * 40}px`;
    spark.style.setProperty('--spark-dx', `${Math.round((Math.random() - 0.5) * 60)}px`);
    spark.style.setProperty('--spark-dy', `${Math.round(-20 - Math.random() * 50)}px`);
    spark.style.setProperty('--spark-rot', `${Math.round((Math.random() - 0.5) * 260)}deg`);
    reelEl.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove(), { once: true });
  }
}

function renderDailyRollResultChip(summaryEl, pick, itemEffect) {
  if (!summaryEl || !pick) return;
  const impactPct = Number(itemEffect?.adjustedImpactPct) || 0;
  const sign = impactPct >= 0 ? '+' : '';
  const stackCount = Math.max(1, Number(itemEffect?.hits) || 1);
  const trendClass = impactPct >= 0 ? 'positive' : 'negative';
  const chip = document.createElement('div');
  chip.className = 'daily-roll-result-chip';

  const icon = document.createElement('img');
  icon.className = 'daily-roll-result-icon';
  icon.src = pick.harvestImage || '';
  icon.alt = pick.itemName || 'Item';
  icon.loading = 'eager';

  const name = document.createElement('span');
  name.className = 'daily-roll-result-name';
  name.textContent = pick.itemName || 'Unknown';

  const impact = document.createElement('span');
  impact.className = `daily-roll-impact-chip ${trendClass}`;
  impact.textContent = `${sign}${impactPct.toFixed(0)}%`;

  chip.appendChild(icon);
  chip.appendChild(name);
  chip.appendChild(impact);

  if (stackCount > 1) {
    const stack = document.createElement('span');
    stack.className = 'daily-roll-reel-stack';
    stack.textContent = `x${stackCount}`;
    chip.appendChild(stack);
  }
  summaryEl.appendChild(chip);
}

function waitForDailyRoll(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
  });
}

function renderDailyRollStage(trackEl, unlockedItems, midItem) {
  if (!trackEl || !Array.isArray(unlockedItems) || unlockedItems.length === 0 || !midItem) return;
  const topItem = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
  const bottomItem = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
  trackEl.innerHTML = '';
  trackEl.appendChild(createDailyRollSlotNode(topItem, 'ghost'));
  trackEl.appendChild(createDailyRollSlotNode(midItem, 'mid'));
  trackEl.appendChild(createDailyRollSlotNode(bottomItem, 'ghost'));
}

export function isDailyRollOpenDom() {
  const modal = document.getElementById('daily-roll-modal');
  return !!(modal && modal.classList.contains('is-open'));
}

export function isDaySummaryOpenDom() {
  const modal = document.getElementById('day-summary-modal');
  return !!(modal && modal.classList.contains('is-open'));
}

export function setDailyRollOpenDom(isOpen, moveFocusOutsideModal) {
  const modal = document.getElementById('daily-roll-modal');
  if (!modal) return;
  if (!isOpen) {
    moveFocusOutsideModal(modal);
  }
  modal.classList.toggle('is-open', !!isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

export function continueDailyRollModalAction(deps) {
  const {
    pendingDaySummary,
    setDailyRollOpen,
    showDaySummaryModal,
    incrementDailyRollAnimationToken
  } = deps;
  incrementDailyRollAnimationToken();
  setDailyRollOpen(false);
  if (pendingDaySummary) {
    showDaySummaryModal(pendingDaySummary);
    return true;
  }
  return false;
}

export function setDaySummaryOpenDom(isOpen, moveFocusOutsideModal) {
  const modal = document.getElementById('day-summary-modal');
  if (!modal) return;
  if (!isOpen) {
    moveFocusOutsideModal(modal);
  }
  modal.classList.toggle('is-open', !!isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

export function showDaySummaryModalDom(summary, setDaySummaryOpen) {
  if (!summary || typeof summary !== 'object') return;
  const subtitleEl = document.getElementById('day-summary-subtitle');
  const soldEl = document.getElementById('day-summary-sold');
  const salesEl = document.getElementById('day-summary-sales');
  const deltaEl = document.getElementById('day-summary-delta');
  const topEl = document.getElementById('day-summary-top');
  const nextEl = document.getElementById('day-summary-next');
  if (subtitleEl) {
    subtitleEl.textContent = `Day ${summary.day || 1} wrap-up`;
  }
  if (soldEl) {
    soldEl.textContent = String(Math.max(0, Number(summary.itemsSold) || 0));
  }
  if (salesEl) {
    salesEl.textContent = `$${(Math.max(0, Number(summary.salesTotal) || 0)).toFixed(2)}`;
  }
  if (deltaEl) {
    const delta = Number(summary.cashDelta) || 0;
    deltaEl.textContent = `${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}`;
    deltaEl.style.color = delta >= 0 ? '#1f7a1f' : '#9a1c1c';
  }
  if (topEl) {
    if (summary.topSale && typeof summary.topSale === 'object') {
      const topName = String(summary.topSale.itemName || 'Item');
      const topValue = Math.max(0, Number(summary.topSale.value) || 0);
      topEl.textContent = `${topName} ($${topValue.toFixed(2)})`;
    } else {
      topEl.textContent = 'None';
    }
  }
  if (nextEl) {
    nextEl.textContent = summary.nextOpportunity || 'No special opportunities noted.';
  }
  setDaySummaryOpen(true);
}

export function continueDaySummaryModalAction(setDaySummaryOpen) {
  setDaySummaryOpen(false);
}

export async function showDailyMarketRollModalAction(deps) {
  const {
    rollResult,
    summaryText,
    fatiguePercent = 0,
    getUnlockedRollItems,
    getHarvestImagePath,
    getCurrentDailyRollAnimationToken,
    incrementDailyRollAnimationToken,
    isDailyRollOpen,
    setDailyRollOpen,
    isReduceMotion
  } = deps;

  const modal = document.getElementById('daily-roll-modal');
  const summaryEl = document.getElementById('daily-roll-results');
  const fatigueEl = document.getElementById('daily-roll-fatigue');
  const fatigueNoteEl = document.getElementById('daily-roll-fatigue-note');
  if (!modal || !Array.isArray(rollResult?.picks) || rollResult.picks.length === 0) return;

  const unlockedItems = getUnlockedRollItems().map((item) => ({
    itemId: item.id,
    itemName: item.name,
    harvestImage: getHarvestImagePath(item)
  }));
  const reelEl = document.getElementById('daily-roll-reel');
  const trackEl = document.getElementById('daily-roll-track');
  if (!reelEl || !trackEl || unlockedItems.length === 0) return;

  const animationToken = incrementDailyRollAnimationToken();
  const isCurrentAnimation = () => animationToken === getCurrentDailyRollAnimationToken() && isDailyRollOpen();

  const fatigueClamped = Math.max(0, Math.round(fatiguePercent));
  const fatigueDetail = `Energy used sets today's roll strength. ${fatigueClamped}% roll strength applied this day.`;
  if (fatigueEl) {
    fatigueEl.textContent = `Roll Strength: ${fatigueClamped}%`;
    fatigueEl.title = fatigueDetail;
    fatigueEl.setAttribute('aria-label', `Market roll strength ${fatigueClamped} percent. ${fatigueDetail}`);
  }
  if (fatigueNoteEl) {
    fatigueNoteEl.title = fatigueDetail;
  }

  if (summaryEl) {
    summaryEl.innerHTML = '';
    summaryEl.title = summaryText || '';
  }
  reelEl.classList.remove('final');
  reelEl.classList.remove('duplicate-hit');
  renderDailyRollStage(trackEl, unlockedItems, unlockedItems[Math.floor(Math.random() * unlockedItems.length)]);
  setDailyRollOpen(true);

  for (let index = 0; index < 3; index += 1) {
    if (!isCurrentAnimation()) return;
    const finalPick = rollResult.picks[index] || rollResult.picks[rollResult.picks.length - 1];
    if (!finalPick) continue;
    const itemEffect = rollResult.byItem.get(finalPick.itemId);

    const spinIntervalMs = isReduceMotion() ? 80 : 54;
    const spinTarget = isReduceMotion() ? 4 : 11;
    for (let spins = 0; spins < spinTarget; spins += 1) {
      if (!isCurrentAnimation()) return;
      const midItem = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
      renderDailyRollStage(trackEl, unlockedItems, midItem);
      await waitForDailyRoll(spinIntervalMs);
    }

    if (!isCurrentAnimation()) return;
    renderDailyRollStage(trackEl, unlockedItems, finalPick);
    reelEl.classList.remove('final');
    void reelEl.offsetWidth;
    reelEl.classList.add('final');
    triggerDailyRollLandingEffects(reelEl, isReduceMotion(), Math.max(1, Number(itemEffect?.hits) || 1));
    if (summaryEl) {
      renderDailyRollResultChip(summaryEl, finalPick, itemEffect);
    }
    await waitForDailyRoll(isReduceMotion() ? 70 : 150);
  }

  if (!isCurrentAnimation()) return;
  await waitForDailyRoll(isReduceMotion() ? 40 : 90);
}
