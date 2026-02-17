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
  const itemKey = String(pick.itemId ?? pick.itemName ?? '');
  let chip = null;
  Array.from(summaryEl.querySelectorAll('.daily-roll-result-chip')).some((node) => {
    if (String(node.dataset.itemId || '') === itemKey) {
      chip = node;
      return true;
    }
    return false;
  });

  if (!chip) {
    chip = document.createElement('div');
    chip.className = 'daily-roll-result-chip';
    chip.dataset.itemId = itemKey;

    const icon = document.createElement('img');
    icon.className = 'daily-roll-result-icon';
    icon.loading = 'eager';

    const name = document.createElement('span');
    name.className = 'daily-roll-result-name';

    const impact = document.createElement('span');
    impact.className = 'daily-roll-impact-chip';

    chip.appendChild(icon);
    chip.appendChild(name);
    chip.appendChild(impact);
    summaryEl.appendChild(chip);
  }

  chip.classList.remove('daily-roll-result-chip-stack-2', 'daily-roll-result-chip-stack-3plus');
  if (stackCount >= 3) {
    chip.classList.add('daily-roll-result-chip-stack-3plus');
  } else if (stackCount === 2) {
    chip.classList.add('daily-roll-result-chip-stack-2');
  }

  const icon = chip.querySelector('.daily-roll-result-icon');
  if (icon) {
    icon.src = pick.harvestImage || '';
    icon.alt = pick.itemName || 'Item';
    icon.title = pick.itemName || 'Unknown';
  }
  const name = chip.querySelector('.daily-roll-result-name');
  if (name) {
    name.textContent = pick.itemName || 'Unknown';
  }
  const impact = chip.querySelector('.daily-roll-impact-chip');
  if (impact) {
    impact.className = `daily-roll-impact-chip ${trendClass}`;
    impact.textContent = `${sign}${impactPct.toFixed(0)}%`;
  }

  let stack = chip.querySelector('.daily-roll-reel-stack');
  if (stackCount > 1) {
    if (!stack) {
      stack = document.createElement('span');
      stack.className = 'daily-roll-reel-stack';
      chip.appendChild(stack);
    }
    stack.classList.remove('positive', 'negative');
    stack.classList.add(trendClass);
    stack.textContent = `x${stackCount}`;
  } else if (stack) {
    stack.remove();
  }
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
    setDailyRollOpen,
    incrementDailyRollAnimationToken
  } = deps;
  incrementDailyRollAnimationToken();
  setDailyRollOpen(false);
  return true;
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
    daySummary = null,
    getUnlockedRollItems,
    getHarvestImagePath,
    getCurrentDailyRollAnimationToken,
    incrementDailyRollAnimationToken,
    consumeDailyRollSkipRequested,
    setDailyRollCanContinue,
    isDailyRollOpen,
    setDailyRollOpen,
    isReduceMotion
  } = deps;

  const modal = document.getElementById('daily-roll-modal');
  const summaryEl = document.getElementById('daily-roll-results');
  const fatigueEl = document.getElementById('daily-roll-fatigue');
  const fatigueNoteEl = document.getElementById('daily-roll-fatigue-note');
  const daySummarySubtitleEl = document.getElementById('daily-roll-day-summary-subtitle');
  const daySummarySoldEl = document.getElementById('daily-roll-day-summary-sold');
  const daySummarySalesEl = document.getElementById('daily-roll-day-summary-sales');
  const continueBtn = document.getElementById('daily-roll-continue');
  if (!modal || !Array.isArray(rollResult?.picks)) return;

  const unlockedItems = getUnlockedRollItems().map((item) => ({
    itemId: item.id,
    itemName: item.name,
    harvestImage: getHarvestImagePath(item)
  }));
  const reelEl = document.getElementById('daily-roll-reel');
  const trackEl = document.getElementById('daily-roll-track');
  if (!reelEl || !trackEl || unlockedItems.length === 0) return;

  const animationToken = incrementDailyRollAnimationToken();
  setDailyRollCanContinue(false);
  const isCurrentAnimation = () => animationToken === getCurrentDailyRollAnimationToken() && isDailyRollOpen();
  const shouldSkip = () => typeof consumeDailyRollSkipRequested === 'function' && consumeDailyRollSkipRequested();

  if (continueBtn) {
    continueBtn.disabled = true;
    continueBtn.setAttribute('aria-disabled', 'true');
  }

  if (daySummarySubtitleEl) {
    daySummarySubtitleEl.textContent = `Day ${Math.max(1, Number(daySummary?.day) || 1)} wrap-up`;
  }
  if (daySummarySoldEl) {
    daySummarySoldEl.textContent = String(Math.max(0, Number(daySummary?.itemsSold) || 0));
  }
  if (daySummarySalesEl) {
    daySummarySalesEl.textContent = `$${(Math.max(0, Number(daySummary?.salesTotal) || 0)).toFixed(2)}`;
  }

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

  const picks = Array.isArray(rollResult?.picks) ? rollResult.picks : [];
  if (picks.length === 0) {
    setDailyRollCanContinue(true);
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.setAttribute('aria-disabled', 'false');
    }
    return;
  }

  const totalDurationMs = isReduceMotion() ? 1800 : 3000;
  const emitIntervalMs = Math.max(60, Math.floor(totalDurationMs / Math.max(1, picks.length)));
  const spinSlowdownStartMs = isReduceMotion() ? 1700 : 2500;
  const fastSpinIntervalMs = isReduceMotion() ? 55 : 24;
  const finalSpinIntervalMs = isReduceMotion() ? 95 : 92;
  const finalPick = picks[picks.length - 1];
  const startedAt = Date.now();
  let emittedCount = 0;
  const emittedByItem = new Map();
  let wasSkipped = false;

  const emitPickEffects = (pick) => {
    const pickImpact = Number(pick?.impactPct) || 0;
    const current = emittedByItem.get(pick.itemId) || {
      itemId: pick.itemId,
      itemName: pick.itemName,
      hits: 0,
      adjustedImpactPct: 0
    };
    current.hits += 1;
    current.adjustedImpactPct += pickImpact;
    emittedByItem.set(pick.itemId, current);
    triggerDailyRollLandingEffects(reelEl, isReduceMotion(), Math.max(1, Number(current.hits) || 1));
    if (summaryEl) {
      renderDailyRollResultChip(summaryEl, pick, current);
    }
    const trendClass = pickImpact >= 0 ? 'positive' : 'negative';
    const sign = pickImpact >= 0 ? '+' : '';
    const fxItem = document.createElement('img');
    fxItem.className = 'daily-roll-emit-item';
    fxItem.src = pick.harvestImage || '';
    fxItem.alt = '';
    fxItem.style.setProperty('--emit-rot-start', `${Math.round(-40 + Math.random() * 80)}deg`);
    fxItem.style.setProperty('--emit-rot-end', `${Math.round(-460 + Math.random() * 920)}deg`);
    fxItem.style.setProperty('--emit-drift-x', `${Math.round(-28 + Math.random() * 56)}px`);
    fxItem.style.setProperty('--emit-drop-y', `${Math.round(42 + Math.random() * 34)}px`);
    fxItem.style.left = `${20 + Math.random() * 60}%`;
    fxItem.style.top = `${25 + Math.random() * 35}%`;
    reelEl.appendChild(fxItem);
    fxItem.addEventListener('animationend', () => fxItem.remove(), { once: true });

    const launchDelayMs = isReduceMotion() ? 26 : 44;
    window.setTimeout(() => {
      if (!isCurrentAnimation()) return;
      const fxText = document.createElement('span');
      fxText.className = `daily-roll-emit-text ${trendClass}`;
      fxText.textContent = `${sign}${pickImpact.toFixed(0)}%`;
      fxText.style.setProperty('--emit-text-rot-start', `${Math.round(-18 + Math.random() * 36)}deg`);
      fxText.style.setProperty('--emit-text-rot-end', `${Math.round(-130 + Math.random() * 260)}deg`);
      fxText.style.setProperty('--emit-text-drift-x', `${Math.round(-24 + Math.random() * 48)}px`);
      fxText.style.setProperty('--emit-text-drop-y', `${Math.round(28 + Math.random() * 26)}px`);
      fxText.style.left = `${18 + Math.random() * 64}%`;
      fxText.style.top = `${20 + Math.random() * 40}%`;
      reelEl.appendChild(fxText);
      fxText.addEventListener('animationend', () => fxText.remove(), { once: true });
    }, launchDelayMs);
  };

  while (isCurrentAnimation()) {
    if (shouldSkip()) {
      wasSkipped = true;
      emittedCount = picks.length;
      if (summaryEl) summaryEl.innerHTML = '';
      const seen = new Set();
      picks.forEach((pick) => {
        if (seen.has(pick.itemId)) return;
        seen.add(pick.itemId);
        renderDailyRollResultChip(summaryEl, pick, rollResult.byItem.get(pick.itemId));
      });
      break;
    }

    const now = Date.now();
    const elapsed = now - startedAt;

    const randomMid = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
    renderDailyRollStage(trackEl, unlockedItems, randomMid);

    const dueCount = Math.min(
      picks.length,
      Math.floor((now - startedAt) / emitIntervalMs)
    );
    while (emittedCount < dueCount) {
      const pick = picks[emittedCount];
      if (pick) emitPickEffects(pick);
      emittedCount += 1;
    }
    if (elapsed >= totalDurationMs) break;
    let spinIntervalMs = fastSpinIntervalMs;
    if (elapsed > spinSlowdownStartMs) {
      const tailProgress = Math.max(0, Math.min(1, (elapsed - spinSlowdownStartMs) / Math.max(1, totalDurationMs - spinSlowdownStartMs)));
      spinIntervalMs = Math.round(
        fastSpinIntervalMs + ((finalSpinIntervalMs - fastSpinIntervalMs) * tailProgress)
      );
    }
    await waitForDailyRoll(spinIntervalMs);
  }

  if (!isCurrentAnimation()) return;
  if (emittedCount < picks.length) {
    if (summaryEl) summaryEl.innerHTML = '';
    const seen = new Set();
    picks.forEach((pick) => {
      if (seen.has(pick.itemId)) return;
      seen.add(pick.itemId);
      renderDailyRollResultChip(summaryEl, pick, rollResult.byItem.get(pick.itemId));
    });
  }
  renderDailyRollStage(trackEl, unlockedItems, finalPick);
  reelEl.classList.remove('final');
  void reelEl.offsetWidth;
  reelEl.classList.add('final');
  triggerDailyRollLandingEffects(reelEl, isReduceMotion(), Math.max(1, Number(rollResult.byItem.get(finalPick.itemId)?.hits) || 1));
  await waitForDailyRoll(Math.max(40, isReduceMotion() ? 60 : 120));
  if (wasSkipped) {
    await waitForDailyRoll(isReduceMotion() ? 220 : 320);
  }
  if (!isCurrentAnimation()) return;
  setDailyRollCanContinue(true);
  if (continueBtn) {
    continueBtn.disabled = false;
    continueBtn.setAttribute('aria-disabled', 'false');
  }
}
