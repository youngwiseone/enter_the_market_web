const GOAL_CELEBRATION_SPARKLE_IMAGES = [
  'resources/effects/sparkle_gold_01.png',
  'resources/effects/sparkle_gold_02.png',
  'resources/effects/prism_sparkle_01.png',
  'resources/effects/prism_sparkle_02.png'
];

export function createGoalCelebrationController(deps) {
  const {
    state,
    getActiveGoalCelebration,
    setActiveGoalCelebration,
    getGoalCelebrationQueue,
    setGoalCelebrationQueue,
    moveFocusOutsideModal,
    isReduceMotion,
    getToolDisplayName
  } = deps;

  let goalCelebrationAmbientTimer = null;
  let goalCelebrationAmbientStopTimer = null;

  function isGoalCelebrationOpen() {
    return !!getActiveGoalCelebration();
  }

  function clearGoalCelebrationSparkles() {
    if (goalCelebrationAmbientTimer) {
      window.clearInterval(goalCelebrationAmbientTimer);
      goalCelebrationAmbientTimer = null;
    }
    if (goalCelebrationAmbientStopTimer) {
      window.clearTimeout(goalCelebrationAmbientStopTimer);
      goalCelebrationAmbientStopTimer = null;
    }
    const sparkleLayer = document.getElementById('goal-celebration-sparkles');
    if (sparkleLayer) {
      sparkleLayer.innerHTML = '';
    }
  }

  function setGoalCelebrationOpen(isOpen) {
    const modal = document.getElementById('goal-celebration-modal');
    if (!modal) return;
    if (!isOpen) {
      moveFocusOutsideModal(modal);
    }
    modal.classList.toggle('is-open', !!isOpen);
    modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }

  function getGoalCelebrationRewardText(goal) {
    if (!goal || typeof goal !== 'object') return 'New reward unlocked.';
    const reward = goal.reward || {};
    const parts = [];
    const cashBonus = Math.max(0, Number(reward.cashBonus) || 0);
    if (cashBonus > 0) {
      parts.push(`Cash bonus: $${cashBonus.toFixed(2)}`);
    }
    if (typeof reward.unlockTool === 'string') {
      parts.push(`Unlocked: ${getToolDisplayName(reward.unlockTool)}`);
    }
    if (typeof reward.unlockShopItem === 'number') {
      const item = state.items.find((it) => it.id === reward.unlockShopItem);
      parts.push(`Unlocked in shop: ${item ? item.name : `Item ${reward.unlockShopItem}`}`);
    }
    if (Array.isArray(reward.unlockShopItems) && reward.unlockShopItems.length > 0) {
      const labels = reward.unlockShopItems
        .map((itemId) => state.items.find((it) => it.id === Number(itemId)))
        .filter(Boolean)
        .map((item) => item.name);
      if (labels.length > 0) {
        parts.push(`Unlocked in shop: ${labels.join(', ')}`);
      }
    }
    if (reward.freePurchases && typeof reward.freePurchases === 'object') {
      const itemId = Number(reward.freePurchases.itemId);
      const count = Math.max(0, Number(reward.freePurchases.count) || 0);
      const item = state.items.find((it) => it.id === itemId);
      const itemLabel = item ? item.name : `Item ${itemId}`;
      if (count > 0) {
        parts.push(`Unlocked: Next ${count} ${itemLabel} purchase${count === 1 ? '' : 's'} free`);
      }
    }
    if (typeof reward.grantCosmetic === 'string') {
      const cosmetic = state.store?.cosmetics?.find((c) => c.id === reward.grantCosmetic);
      parts.push(`Unlocked cosmetic: ${cosmetic ? cosmetic.name : reward.grantCosmetic}`);
    }
    if (typeof reward.setFlag === 'string' && reward.setFlag) {
      parts.push('Unlocked: New feature');
    }
    if (parts.length > 0) return parts.join(' | ');
    const fallback = (goal.message || '').replace(/^Goal complete:\s*/i, '').trim();
    return fallback || 'New reward unlocked.';
  }

  function spawnGoalCelebrationSparkle(options) {
    const layer = document.getElementById('goal-celebration-sparkles');
    if (!layer) return;
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const img = document.createElement('img');
    img.className = `goal-celebration-sparkle${options.isAmbient ? ' is-ambient' : ''}`;
    const src = GOAL_CELEBRATION_SPARKLE_IMAGES[Math.floor(Math.random() * GOAL_CELEBRATION_SPARKLE_IMAGES.length)];
    img.src = src;
    img.alt = '';
    const size = options.size || (16 + Math.random() * 24);
    const lifeMs = options.lifeMs || (560 + Math.random() * 360);
    const dx = options.dx ?? ((Math.random() - 0.5) * 160);
    const dy = options.dy ?? (-40 - Math.random() * 120);
    const rot = options.rot ?? ((Math.random() - 0.5) * 360);
    const x = Math.max(0, Math.min(rect.width, options.x));
    const y = Math.max(0, Math.min(rect.height, options.y));
    img.style.left = `${x - size / 2}px`;
    img.style.top = `${y - size / 2}px`;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.setProperty('--sparkle-life', `${Math.round(lifeMs)}ms`);
    img.style.setProperty('--sparkle-dx', `${Math.round(dx)}px`);
    img.style.setProperty('--sparkle-dy', `${Math.round(dy)}px`);
    img.style.setProperty('--sparkle-rot', `${Math.round(rot)}deg`);
    layer.appendChild(img);
    img.addEventListener('animationend', () => img.remove(), { once: true });
  }

  function startGoalCelebrationSparkles() {
    if (isReduceMotion()) return;
    const panel = document.getElementById('goal-celebration-panel');
    const layer = document.getElementById('goal-celebration-sparkles');
    if (!panel || !layer) return;
    clearGoalCelebrationSparkles();
    const panelRect = panel.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const centerX = panelRect.left - layerRect.left + (panelRect.width / 2);
    const centerY = panelRect.top - layerRect.top + Math.min(140, panelRect.height * 0.32);

    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const radius = 12 + Math.random() * 28;
      spawnGoalCelebrationSparkle({
        x: centerX + (Math.cos(angle) * radius),
        y: centerY + (Math.sin(angle) * radius),
        size: 18 + Math.random() * 22,
        lifeMs: 620 + Math.random() * 380,
        dx: Math.cos(angle) * (40 + Math.random() * 90),
        dy: Math.sin(angle) * (20 + Math.random() * 90) - 50,
        rot: (Math.random() - 0.5) * 380,
        isAmbient: false
      });
    }

    goalCelebrationAmbientTimer = window.setInterval(() => {
      const edge = Math.floor(Math.random() * 4);
      const x = edge <= 1
        ? panelRect.left - layerRect.left + (Math.random() * panelRect.width)
        : panelRect.left - layerRect.left + (edge === 2 ? -20 : panelRect.width + 20);
      const y = edge >= 2
        ? panelRect.top - layerRect.top + (Math.random() * panelRect.height)
        : panelRect.top - layerRect.top + (edge === 0 ? -12 : panelRect.height + 10);
      spawnGoalCelebrationSparkle({
        x,
        y,
        size: 12 + Math.random() * 18,
        lifeMs: 500 + Math.random() * 600,
        dx: (Math.random() - 0.5) * 70,
        dy: -30 - (Math.random() * 80),
        rot: (Math.random() - 0.5) * 200,
        isAmbient: true
      });
    }, 140);

    goalCelebrationAmbientStopTimer = window.setTimeout(() => {
      if (goalCelebrationAmbientTimer) {
        window.clearInterval(goalCelebrationAmbientTimer);
        goalCelebrationAmbientTimer = null;
      }
    }, 2400);
  }

  function showNextGoalCelebration() {
    if (getActiveGoalCelebration()) return;
    const queue = getGoalCelebrationQueue();
    if (!Array.isArray(queue) || queue.length === 0) return;
    const next = queue.shift();
    if (!next) return;
    setGoalCelebrationQueue(queue);
    setActiveGoalCelebration(next);

    const titleEl = document.getElementById('goal-celebration-title');
    const unlockEl = document.getElementById('goal-celebration-unlock');
    const imageEl = document.getElementById('goal-celebration-image');
    if (titleEl) titleEl.textContent = next.title;
    if (unlockEl) unlockEl.textContent = next.rewardText;
    if (imageEl) {
      imageEl.src = next.imageSrc || 'resources/profiles/player_goal_unlocked.png';
      imageEl.alt = next.imageAlt || 'Goal unlocked';
    }

    setGoalCelebrationOpen(true);
    startGoalCelebrationSparkles();
    window.setTimeout(() => {
      const continueBtn = document.getElementById('goal-celebration-continue');
      if (continueBtn) continueBtn.focus();
    }, 80);
  }

  function enqueueGoalCelebration(goal) {
    if (!goal || typeof goal !== 'object') return;
    let queue = getGoalCelebrationQueue();
    if (!Array.isArray(queue)) {
      queue = [];
      setGoalCelebrationQueue(queue);
    }
    queue.push({
      id: goal.id || '',
      title: goal.name || 'Goal Complete',
      rewardText: getGoalCelebrationRewardText(goal),
      imageSrc: 'resources/profiles/player_goal_unlocked.png',
      imageAlt: 'Goal unlocked'
    });
    showNextGoalCelebration();
  }

  function continueGoalCelebration() {
    if (!getActiveGoalCelebration()) return;
    setActiveGoalCelebration(null);
    clearGoalCelebrationSparkles();
    setGoalCelebrationOpen(false);
    window.setTimeout(() => {
      showNextGoalCelebration();
    }, 120);
  }

  return {
    isGoalCelebrationOpen,
    clearGoalCelebrationSparkles,
    setGoalCelebrationOpen,
    showNextGoalCelebration,
    enqueueGoalCelebration,
    continueGoalCelebration
  };
}
