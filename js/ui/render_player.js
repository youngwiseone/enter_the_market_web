export function renderPlayerLevelStatusAction(deps) {
  const {
    state,
    ensurePlayerProgressState,
    PLAYER_LEVEL_CAP,
    getXpToNextLevel
  } = deps;

  ensurePlayerProgressState();
  const levelLabel = document.getElementById('player-level-label');
  const xpText = document.getElementById('player-xp-text');
  const xpFill = document.getElementById('player-xp-fill');
  const xpBar = document.getElementById('player-xp-bar');
  if (!state.player) return;
  const level = state.player.playerLevel;
  const atCap = level >= PLAYER_LEVEL_CAP;
  const currentXp = Math.max(0, Number(state.player.playerXp) || 0);
  const xpToNext = atCap ? 0 : getXpToNextLevel(level);
  const percent = atCap ? 100 : Math.min(100, Math.round((currentXp / Math.max(1, xpToNext)) * 100));
  if (levelLabel) {
    levelLabel.textContent = `Level: ${level}`;
  }
  if (xpText) {
    xpText.textContent = atCap ? 'MAX LEVEL' : `${currentXp} / ${xpToNext} XP`;
  }
  if (xpFill) {
    xpFill.style.width = `${percent}%`;
  }
  const xpHoverText = atCap ? 'MAX LEVEL' : `${currentXp} / ${xpToNext} XP`;
  if (levelLabel) {
    levelLabel.title = xpHoverText;
  }
  if (xpBar) {
    xpBar.title = xpHoverText;
  }
  if (xpBar) {
    xpBar.setAttribute('aria-valuenow', String(atCap ? 0 : currentXp));
    xpBar.setAttribute('aria-valuemax', String(atCap ? 1 : xpToNext));
  }
}

export function updateTimeOfDayMoodAction(state) {
  if (!document.body || !state.player) return;
  const max = Math.max(1, Number(state.player.energyMax) || 1);
  const energy = Math.max(0, Math.min(max, Number(state.player.energy) || 0));
  const ratio = energy / max;
  let mood = 'midday';
  if (ratio >= 0.67) mood = 'morning';
  else if (ratio <= 0.33) mood = 'night';
  document.body.setAttribute('data-time-of-day', mood);
}

export function renderEnergyBarAction(deps) {
  const {
    state,
    ENERGY_SEGMENT_CAP,
    roundEnergyValue,
    formatEnergyValue,
    renderPlayerLevelStatus,
    updateTimeOfDayMood
  } = deps;

  const bar = document.getElementById('energy-bar');
  const text = document.getElementById('energy-text');
  if (!bar || !state.player) return;
  const max = Math.max(1, Number(state.player.energyMax) || 10);
  const current = Math.max(0, Math.min(roundEnergyValue(state.player.energy ?? max), max));
  const isMobileLayout = !!(document.body && document.body.classList.contains('mobile-layout'));
  const useCompactLabel = isMobileLayout || max > ENERGY_SEGMENT_CAP;
  bar.classList.toggle('energy-bar-compact', useCompactLabel);
  bar.innerHTML = '';
  if (useCompactLabel) {
    const compactLabel = document.createElement('span');
    compactLabel.className = 'energy-compact-label';
    compactLabel.textContent = `${formatEnergyValue(current)} / ${formatEnergyValue(max)}`;
    bar.appendChild(compactLabel);
  } else {
    for (let i = 0; i < max; i += 1) {
      const segment = document.createElement('div');
      segment.className = 'energy-segment' + (i < current ? ' filled' : '');
      bar.appendChild(segment);
    }
  }
  bar.setAttribute('aria-valuenow', String(roundEnergyValue(current)));
  bar.setAttribute('aria-valuemax', String(roundEnergyValue(max)));
  if (text) {
    text.textContent = `Energy: ${formatEnergyValue(current)}/${formatEnergyValue(max)}`;
  }
  renderPlayerLevelStatus();
  updateTimeOfDayMood();
}

export function renderHUDAction(deps) {
  const {
    state,
    ensurePlayerProgressState,
    updateNetWorth,
    renderPlayerLevelStatus
  } = deps;

  ensurePlayerProgressState();
  updateNetWorth();
  const dayElems = document.querySelectorAll('#hud-day');
  const cashElems = document.querySelectorAll('#hud-cash');
  const storageElem = document.getElementById('hud-storage');
  const netElems = document.querySelectorAll('#hud-networth');
  const { day, cash, netWorth } = state.player;
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dow = daysOfWeek[(day - 1) % 7];
  const weatherId = String(state.weather?.id || '');
  const weatherLabel = weatherId === 'rain' ? 'Rain' : '';
  if (document.body) {
    document.body.setAttribute('data-weather', weatherId || 'clear');
  }
  dayElems.forEach((el) => {
    el.textContent = weatherLabel ? `${dow} - Day ${day} - ${weatherLabel}` : `${dow} - Day ${day}`;
  });
  cashElems.forEach((el) => {
    el.textContent = `Cash: $${cash.toFixed(2)}`;
  });
  if (storageElem) {
    storageElem.textContent = 'Storage: Unlimited';
  }
  netElems.forEach((el) => {
    el.textContent = `Net Worth: $${netWorth.toFixed(2)}`;
  });
  renderPlayerLevelStatus();
}
