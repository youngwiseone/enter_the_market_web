const GOAL_CELEBRATION_SPARKLE_IMAGES = [
  'resources/effects/sparkle_gold_01.png',
  'resources/effects/sparkle_gold_02.png',
  'resources/effects/prism_sparkle_01.png',
  'resources/effects/prism_sparkle_02.png'
];
const GOAL_CELEBRATION_ICON_BURST_IMAGES = [
  'resources/effects/sparkle_gold_01.png',
  'resources/effects/sparkle_gold_02.png',
  'resources/effects/prism_sparkle_01.png',
  'resources/effects/prism_sparkle_02.png',
  'resources/effects/dust_puff_01.png',
  'resources/effects/dust_puff_02.png'
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
    const iconBurstLayer = document.getElementById('goal-celebration-icon-burst-layer');
    if (iconBurstLayer) {
      iconBurstLayer.innerHTML = '';
    }
  }

  function getGoalCelebrationIconBurstLayer() {
    const panel = document.getElementById('goal-celebration-panel');
    if (!panel) return null;
    let layer = document.getElementById('goal-celebration-icon-burst-layer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'goal-celebration-icon-burst-layer';
    layer.className = 'goal-celebration-icon-burst-layer';
    panel.appendChild(layer);
    return layer;
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
    const layer = options.layerEl || document.getElementById('goal-celebration-sparkles');
    if (!layer) return;
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const img = document.createElement('img');
    img.className = `goal-celebration-sparkle${options.isAmbient ? ' is-ambient' : ''}${options.isIconBurst ? ' is-icon-burst' : ''}`;
    const imagePool = Array.isArray(options.imagePool) && options.imagePool.length > 0
      ? options.imagePool
      : GOAL_CELEBRATION_SPARKLE_IMAGES;
    const src = imagePool[Math.floor(Math.random() * imagePool.length)];
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

  function spawnSeedUnlockIconBurst() {
    if (isReduceMotion()) return;
    const layer = getGoalCelebrationIconBurstLayer();
    const icon = document.getElementById('goal-celebration-seed-icon');
    if (!layer || !icon || icon.hidden) return;
    const layerRect = layer.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    if (!iconRect.width || !iconRect.height) return;
    const centerX = iconRect.left - layerRect.left + (iconRect.width / 2);
    const centerY = iconRect.top - layerRect.top + (iconRect.height / 2);

    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18;
      const radius = 8 + (Math.random() * 14);
      const isDust = Math.random() < 0.35;
      spawnGoalCelebrationSparkle({
        layerEl: layer,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        size: isDust ? (18 + Math.random() * 16) : (12 + Math.random() * 12),
        lifeMs: isDust ? (700 + Math.random() * 260) : (520 + Math.random() * 220),
        dx: Math.cos(angle) * (24 + Math.random() * 56),
        dy: isDust
          ? (-8 + (Math.random() * 22))
          : (-26 - (Math.random() * 56)),
        rot: (Math.random() - 0.5) * 260,
        imagePool: isDust
          ? ['resources/effects/dust_puff_01.png', 'resources/effects/dust_puff_02.png']
          : GOAL_CELEBRATION_ICON_BURST_IMAGES,
        isIconBurst: true,
        isAmbient: false
      });
    }
  }

  function getGoalCelebrationUnlockIconsRow() {
    const panel = document.getElementById('goal-celebration-panel');
    if (!panel) return null;
    let row = document.getElementById('goal-celebration-unlock-icons-row');
    if (row) return row;
    row = document.createElement('div');
    row.id = 'goal-celebration-unlock-icons-row';
    row.className = 'goal-celebration-unlock-icons-row';
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.justifyContent = 'center';
    row.style.flexWrap = 'wrap';
    row.style.margin = '8px 0 6px';
    const continueBtn = document.getElementById('goal-celebration-continue');
    if (continueBtn && continueBtn.parentElement === panel) {
      panel.insertBefore(row, continueBtn);
    } else {
      panel.appendChild(row);
    }
    return row;
  }

  function renderUnlockIconsRow(unlockItems) {
    const row = getGoalCelebrationUnlockIconsRow();
    if (!row) return;
    row.innerHTML = '';
    const items = Array.isArray(unlockItems) ? unlockItems.filter(Boolean).slice(0, 6) : [];
    if (!items.length) {
      row.hidden = true;
      row.setAttribute('aria-hidden', 'true');
      return;
    }
    items.forEach((entry) => {
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.style.width = '42px';
      wrap.style.height = '42px';
      wrap.style.display = 'inline-flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      wrap.style.borderRadius = '8px';
      wrap.style.background = 'rgba(255,255,255,0.08)';
      wrap.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.14)';
      wrap.title = entry.name || entry.imageAlt || 'Unlocked item';

      if (entry.seedPacketImageSrc && entry.seedOverlayIconImageSrc) {
        const packet = document.createElement('img');
        packet.src = entry.seedPacketImageSrc;
        packet.alt = '';
        packet.setAttribute('aria-hidden', 'true');
        packet.style.width = '36px';
        packet.style.height = '36px';
        packet.style.imageRendering = 'pixelated';
        wrap.appendChild(packet);

        const icon = document.createElement('img');
        icon.src = entry.seedOverlayIconImageSrc;
        icon.alt = entry.imageAlt || entry.name || 'Unlocked item';
        icon.style.position = 'absolute';
        icon.style.width = '18px';
        icon.style.height = '18px';
        icon.style.imageRendering = 'pixelated';
        wrap.appendChild(icon);
      } else {
        const img = document.createElement('img');
        img.src = entry.imageSrc || '';
        img.alt = entry.imageAlt || entry.name || 'Unlocked item';
        img.style.width = '30px';
        img.style.height = '30px';
        img.style.objectFit = 'contain';
        wrap.appendChild(img);
      }
      row.appendChild(wrap);
    });
    row.hidden = false;
    row.setAttribute('aria-hidden', 'false');
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
    const panelEl = document.getElementById('goal-celebration-panel');
    const imageEl = document.getElementById('goal-celebration-image');
    const seedCompositeEl = document.getElementById('goal-celebration-seed-composite');
    const seedPacketImageEl = document.getElementById('goal-celebration-seed-packet');
    const seedOverlayIconImageEl = document.getElementById('goal-celebration-seed-icon');
    const unlockItems = Array.isArray(next.unlockItems) ? next.unlockItems : [];
    const hasMultiUnlockIcons = unlockItems.length > 1;
    const hasSeedUnlockImages = !!(next.seedPacketImageSrc && next.seedOverlayIconImageSrc);
    if (titleEl) titleEl.textContent = next.title;
    if (unlockEl) unlockEl.textContent = next.rewardText;
    if (panelEl) {
      panelEl.classList.toggle('goal-celebration-has-seed-unlock', hasSeedUnlockImages);
    }
    if (imageEl && !hasSeedUnlockImages) {
      imageEl.hidden = false;
      imageEl.src = next.imageSrc || 'resources/profiles/player_goal_unlocked.png';
      imageEl.alt = next.imageAlt || 'Goal unlocked';
    } else if (imageEl) {
      imageEl.hidden = true;
    }
    if (seedCompositeEl) {
      seedCompositeEl.hidden = !hasSeedUnlockImages || hasMultiUnlockIcons;
      seedCompositeEl.setAttribute('aria-hidden', (!hasSeedUnlockImages || hasMultiUnlockIcons) ? 'true' : 'false');
    }
    if (seedPacketImageEl && hasSeedUnlockImages) {
      seedPacketImageEl.src = next.seedPacketImageSrc;
      seedPacketImageEl.alt = next.imageAlt || 'Unlocked seed packet';
    }
    if (seedOverlayIconImageEl && hasSeedUnlockImages) {
      seedOverlayIconImageEl.src = next.seedOverlayIconImageSrc;
      seedOverlayIconImageEl.alt = `${next.imageAlt || 'Unlocked item'} icon`;
    }
    renderUnlockIconsRow(unlockItems);

    setGoalCelebrationOpen(true);
    startGoalCelebrationSparkles();
    if (hasSeedUnlockImages) {
      window.requestAnimationFrame(() => {
        spawnSeedUnlockIconBurst();
      });
      window.setTimeout(() => {
        spawnSeedUnlockIconBurst();
      }, 180);
    }
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
