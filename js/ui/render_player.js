function getHudWeatherVisual(state) {
  const weatherId = String(state?.weather?.id || '').trim().toLowerCase();
  const nextWeatherId = String(state?.nextDayWeather?.id || '').trim().toLowerCase();
  if (weatherId === 'rain') {
    return {
      src: 'resources/weather/rainy.png',
      alt: 'Rainy today'
    };
  }
  if (nextWeatherId === 'rain') {
    return {
      src: 'resources/weather/cloudy.png',
      alt: 'Cloudy, rain likely tomorrow'
    };
  }
  return {
    src: 'resources/weather/sunny.png',
    alt: 'Sunny today'
  };
}

function renderItemsSoldHud(el, totalItemsSold, weatherVisual) {
  if (!el) return;
  el.classList.add('hud-items-sold');
  el.textContent = '';

  if (weatherVisual?.src) {
    const icon = document.createElement('img');
    icon.className = 'hud-weather-icon';
    icon.src = weatherVisual.src;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    icon.title = weatherVisual.alt || '';
    el.appendChild(icon);
  }

  const text = document.createElement('span');
  text.textContent = `Items Sold: ${totalItemsSold.toLocaleString('en-US')}`;
  el.appendChild(text);

  if (weatherVisual?.alt) {
    el.title = weatherVisual.alt;
    el.setAttribute('aria-label', `${text.textContent}. ${weatherVisual.alt}.`);
  }
}

function getRollStrengthLabel(state) {
  const rollStrength = Math.max(0, Math.round(Number(state?.dayEnergySpent) || 0));
  return `Roll: ${rollStrength}%`;
}

function getBuyModeItem(state, selectedShopItemId) {
  if (!selectedShopItemId || !Array.isArray(state?.items)) return null;
  return state.items.find((item) => item && item.id === selectedShopItemId) || null;
}

function getBuyModePriceLabel(item, selectedShopItemId, getItemCurrentPrice) {
  if (!item) return '$0.00';
  const itemType = String(item.type || '').trim().toLowerCase();
  const usesMarketPricing = itemType === 'produce';
  const priceValue = usesMarketPricing && typeof getItemCurrentPrice === 'function'
    ? Math.max(0, Number(getItemCurrentPrice(selectedShopItemId)) || 0)
    : Math.max(0, Number(item.price) || 0);
  return `$${priceValue.toFixed(2)}`;
}

function getBuyModeItemImagePath(item, resolveResourcePath, getHarvestImagePath) {
  if (!item || typeof item !== 'object') return '';
  if (typeof getHarvestImagePath === 'function') {
    const harvestPath = getHarvestImagePath(item);
    if (harvestPath) return harvestPath;
  }
  if (typeof item.image === 'string' && item.image) {
    return typeof resolveResourcePath === 'function' ? resolveResourcePath(item.image) : item.image;
  }
  return '';
}

function setMobileRestButtonState(deps, selectedItem, priceText) {
  const {
    clearShopSelection,
    nextDay
  } = deps;
  const restButton = document.getElementById('next-day');
  if (!restButton) return;
  const isMobileLayout = !!(document.body && document.body.classList.contains('mobile-layout'));
  const farmPanel = document.getElementById('farm-panel');
  const isFarmVisible = !!(farmPanel && window.getComputedStyle(farmPanel).display !== 'none');

  if (selectedItem && isMobileLayout && isFarmVisible) {
    const itemName = String(selectedItem.name || 'item');
    restButton.textContent = `Buy ${itemName} (${priceText}) - tap to cancel`;
    restButton.title = 'Tap to cancel selected item';
    restButton.onclick = (event) => {
      if (event) event.preventDefault();
      if (typeof clearShopSelection === 'function') clearShopSelection();
    };
    restButton.dataset.buyModeOverride = 'true';
    return;
  }

  if (restButton.dataset.buyModeOverride === 'true') {
    restButton.textContent = 'Rest';
    restButton.title = 'Rest';
    restButton.onclick = typeof nextDay === 'function' ? nextDay : null;
    delete restButton.dataset.buyModeOverride;
  }
}

function renderBuyModeHudAction(deps) {
  const {
    state,
    getSelectedShopItemId,
    getItemCurrentPrice,
    resolveResourcePath,
    getHarvestImagePath,
    clearShopSelection,
    nextDay
  } = deps;

  const selectedShopItemId = typeof getSelectedShopItemId === 'function' ? getSelectedShopItemId() : null;
  const selectedItem = getBuyModeItem(state, selectedShopItemId);
  const profile = document.getElementById('chat-profile');

  if (!selectedItem) {
    setMobileRestButtonState({ clearShopSelection, nextDay }, null, '$0.00');
    if (profile) {
      profile.classList.remove('buy-mode-avatar');
      if (profile.dataset.buyModeOriginalSrc) {
        profile.src = profile.dataset.buyModeOriginalSrc;
        profile.alt = profile.dataset.buyModeOriginalAlt || 'profile';
        delete profile.dataset.buyModeOriginalSrc;
        delete profile.dataset.buyModeOriginalAlt;
      }
    }
    return;
  }

  const itemName = String(selectedItem.name || 'item');
  const priceText = getBuyModePriceLabel(selectedItem, selectedShopItemId, getItemCurrentPrice);
  const iconPath = getBuyModeItemImagePath(
    selectedItem,
    resolveResourcePath,
    getHarvestImagePath
  );
  setMobileRestButtonState({ clearShopSelection, nextDay }, selectedItem, priceText);

  if (!profile) return;
  if (!iconPath) {
    profile.classList.remove('buy-mode-avatar');
    if (profile.dataset.buyModeOriginalSrc) {
      profile.src = profile.dataset.buyModeOriginalSrc;
      profile.alt = profile.dataset.buyModeOriginalAlt || 'profile';
      delete profile.dataset.buyModeOriginalSrc;
      delete profile.dataset.buyModeOriginalAlt;
    }
    return;
  }
  if (!profile.dataset.buyModeOriginalSrc) {
    profile.dataset.buyModeOriginalSrc = profile.getAttribute('src') || '';
    profile.dataset.buyModeOriginalAlt = profile.getAttribute('alt') || '';
  }
  profile.src = iconPath;
  profile.alt = `${itemName} selected`;
  profile.classList.add('buy-mode-avatar');
}

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
  const desktopRollIndicator = document.getElementById('desktop-roll-indicator');
  const mobileRollIndicator = document.getElementById('mobile-roll-indicator');
  if (!bar || !state.player) return;
  const max = Math.max(1, Number(state.player.energyMax) || 10);
  const current = Math.max(0, Math.min(roundEnergyValue(state.player.energy ?? max), max));
  const isMobileLayout = !!(document.body && document.body.classList.contains('mobile-layout'));
  const useCompactLabel = isMobileLayout || max > ENERGY_SEGMENT_CAP;
  bar.classList.toggle('energy-bar-compact', useCompactLabel);
  bar.innerHTML = '';
  if (useCompactLabel) {
    const fill = document.createElement('span');
    fill.className = 'energy-bar-fill';
    fill.style.width = `${Math.max(0, Math.min(100, (current / Math.max(1, max)) * 100))}%`;
    bar.appendChild(fill);

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
  bar.title = '';
  if (text) {
    text.textContent = `Energy: ${formatEnergyValue(current)}/${formatEnergyValue(max)}`;
  }
  if (desktopRollIndicator) {
    desktopRollIndicator.textContent = getRollStrengthLabel(state);
  }
  if (mobileRollIndicator) {
    mobileRollIndicator.textContent = getRollStrengthLabel(state);
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
  const { day, cash } = state.player;
  const totalItemsSold = Math.max(0, Number(state.totalItemsSold) || 0);
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dow = daysOfWeek[(day - 1) % 7];
  const weatherId = String(state.weather?.id || '');
  const weatherLabel = weatherId === 'rain' ? 'Rain' : '';
  const weatherVisual = getHudWeatherVisual(state);
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
    renderItemsSoldHud(el, totalItemsSold, weatherVisual);
  });
  renderBuyModeHudAction(deps);
  renderPlayerLevelStatus();
}
