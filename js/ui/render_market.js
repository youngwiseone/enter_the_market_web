const MARKET_SORT_KEYS = Object.freeze({
  NAME: 'name',
  PRICE: 'price',
  PERCENT: 'percent'
});

let activeMarketSortKey = MARKET_SORT_KEYS.PRICE;
let activeMarketSortDirection = 'asc';
let activeCosmeticsSortKey = 'price';
let activeCosmeticsSortDirection = 'asc';
const GRID_PRICE_BADGE_HIDE_FADE_MS = 240;
let lastGridPriceBadgeVisible = false;
let lastDesiredGridPriceBadgeVisible = false;
let gridPriceBadgeHideFadeUntilMs = 0;
const MARKET_SUBTAB_PANEL_ID = 'market-subtable-panel';

function getAveragePrice(entry) {
  if (!entry || typeof entry !== 'object') return 0;
  const currentPrice = Math.max(0, Number(entry.price) || 0);
  if (!entry.daysCount || !entry.priceSum) return currentPrice;
  return Number(entry.priceSum) / Number(entry.daysCount);
}

function getAverageDelta(entry) {
  const currentPrice = Math.max(0, Number(entry?.price) || 0);
  const averagePrice = getAveragePrice(entry);
  if (averagePrice <= 0) return 0;
  return (currentPrice - averagePrice) / averagePrice;
}

function getPriceBandLabel(avgDelta) {
  if (avgDelta <= -0.05) return 'Discounted';
  if (avgDelta >= 0.05) return 'Premium';
  return 'Fair Price';
}

function compareMarketRows(left, right, sortKey, sortDirection) {
  const leftName = String(left?.item?.name || '').toLowerCase();
  const rightName = String(right?.item?.name || '').toLowerCase();
  const leftPrice = Math.max(0, Number(left?.entry?.price) || 0);
  const rightPrice = Math.max(0, Number(right?.entry?.price) || 0);
  const leftDelta = getAverageDelta(left?.entry);
  const rightDelta = getAverageDelta(right?.entry);

  let primary = 0;
  if (sortKey === MARKET_SORT_KEYS.NAME) {
    primary = leftName.localeCompare(rightName);
    if (primary === 0) primary = leftPrice - rightPrice;
  } else if (sortKey === MARKET_SORT_KEYS.PERCENT) {
    primary = leftDelta - rightDelta;
    if (primary === 0) primary = leftPrice - rightPrice;
    if (primary === 0) primary = leftName.localeCompare(rightName);
  } else {
    primary = leftPrice - rightPrice;
    if (primary === 0) primary = leftName.localeCompare(rightName);
  }

  if (primary === 0) {
    const leftId = Number(left?.item?.id) || 0;
    const rightId = Number(right?.item?.id) || 0;
    primary = leftId - rightId;
  }

  return sortDirection === 'desc' ? -primary : primary;
}

function createGridPriceDeltaBadge(percentDelta, isFading = false) {
  if (typeof percentDelta !== 'number' || !Number.isFinite(percentDelta)) return null;
  const trendClass = percentDelta < 0 ? 'bad' : (percentDelta > 0 ? 'good' : 'neutral');
  const isPositive = percentDelta >= 0;
  const badge = document.createElement('span');
  badge.className = `grid-cell-price-delta ${trendClass}${isFading ? ' is-fading' : ''}`;
  badge.textContent = `${isPositive ? '+' : '-'}${Math.abs(percentDelta * 100).toFixed(0)}%`;
  badge.title = `Market ${isPositive ? 'above' : 'below'} average by ${(Math.abs(percentDelta) * 100).toFixed(0)}%`;
  badge.setAttribute('aria-label', `Market ${isPositive ? 'up' : 'down'} ${Math.abs(percentDelta * 100).toFixed(0)} percent`);
  return badge;
}

function createMarketTableSwitcher({
  activeView,
  canShowCosmetics,
  onSelectView,
  badgeCounts
}) {
  const switcher = document.createElement('div');
  switcher.className = 'market-table-switcher';
  switcher.setAttribute('role', 'tablist');
  switcher.setAttribute('aria-label', 'Market tables');

  const views = [
    {
      id: 'items',
      label: 'Market',
      disabled: false,
      title: 'View seed market',
      badgeCount: Math.max(0, Number(badgeCounts?.market) || 0)
    },
    {
      id: 'cosmetics',
      label: 'Cosmetics',
      disabled: !canShowCosmetics,
      title: canShowCosmetics ? 'View cosmetics shop' : 'Unlocks after first harvest',
      badgeCount: Math.max(0, Number(badgeCounts?.cosmetics) || 0)
    }
  ];

  const focusableViewIds = views.filter((view) => !view.disabled).map((view) => view.id);
  const moveFocus = (currentId, direction) => {
    const currentIndex = focusableViewIds.indexOf(currentId);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (direction === 'first') nextIndex = 0;
    else if (direction === 'last') nextIndex = focusableViewIds.length - 1;
    else nextIndex = (currentIndex + direction + focusableViewIds.length) % focusableViewIds.length;
    const nextId = focusableViewIds[nextIndex];
    if (nextId && nextId !== currentId) {
      onSelectView(nextId);
    }
  };

  views.forEach(({ id, label, disabled, title, badgeCount }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tab-button market-table-switcher-button${activeView === id ? ' active' : ''}`;
    button.id = `market-subtab-${id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', activeView === id ? 'true' : 'false');
    button.setAttribute('aria-controls', MARKET_SUBTAB_PANEL_ID);
    button.tabIndex = activeView === id ? 0 : -1;
    button.disabled = disabled;
    button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    button.title = title;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    button.appendChild(labelSpan);
    const badge = document.createElement('span');
    badge.className = `tab-badge${badgeCount > 0 ? ' has-count' : ''}`;
    badge.textContent = String(badgeCount);
    badge.setAttribute('aria-label', `${badgeCount} new unlock${badgeCount === 1 ? '' : 's'}`);
    button.appendChild(badge);

    button.addEventListener('click', () => {
      if (disabled || activeView === id) return;
      onSelectView(id);
    });
    button.addEventListener('keydown', (event) => {
      if (disabled) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(id, 1);
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(id, -1);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        moveFocus(id, 'first');
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        moveFocus(id, 'last');
      }
    });
    switcher.appendChild(button);
  });

  return switcher;
}

function compareCosmeticsRows(left, right, sortKey, sortDirection) {
  const leftName = String(left?.name || '').toLowerCase();
  const rightName = String(right?.name || '').toLowerCase();
  const leftPrice = left?.unlocked ? 0 : Math.max(0, Number(left?.price) || 0);
  const rightPrice = right?.unlocked ? 0 : Math.max(0, Number(right?.price) || 0);

  let primary = 0;
  if (sortKey === 'name') {
    primary = leftName.localeCompare(rightName);
    if (primary === 0) primary = leftPrice - rightPrice;
  } else {
    primary = leftPrice - rightPrice;
    if (primary === 0) primary = leftName.localeCompare(rightName);
  }

  if (primary === 0) {
    primary = String(left?.id || '').localeCompare(String(right?.id || ''));
  }

  return sortDirection === 'desc' ? -primary : primary;
}

function renderCosmeticsMarketTable(tableHost, state, purchaseCosmetic, selectCosmetic, rerender) {
  const hint = document.createElement('div');
  hint.className = 'market-subtable-note';
  hint.textContent = 'Unlocked cosmetics can be selected here.';
  tableHost.appendChild(hint);

  const table = document.createElement('table');
  table.className = 'zebra-table';
  const headerRow = document.createElement('tr');
  [
    { label: 'Name', sortKey: 'name' },
    { label: 'Price', sortKey: 'price' },
    { label: 'Buy/Select', sortKey: null }
  ].forEach(({ label, sortKey }) => {
    const th = document.createElement('th');
    if (!sortKey) {
      th.textContent = label;
      headerRow.appendChild(th);
      return;
    }
    const isActiveSort = activeCosmeticsSortKey === sortKey;
    const sortIndicator = isActiveSort ? (activeCosmeticsSortDirection === 'asc' ? ' ^' : ' v') : '';
    th.textContent = `${label}${sortIndicator}`;
    th.style.cursor = 'pointer';
    th.title = isActiveSort ? `Sorted ${activeCosmeticsSortDirection}. Click to toggle.` : 'Click to sort.';
    th.addEventListener('click', () => {
      if (activeCosmeticsSortKey === sortKey) {
        activeCosmeticsSortDirection = activeCosmeticsSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        activeCosmeticsSortKey = sortKey;
        activeCosmeticsSortDirection = sortKey === 'price' ? 'asc' : 'asc';
      }
      rerender();
    });
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  const cosmetics = Array.isArray(state?.store?.cosmetics) ? state.store.cosmetics : [];
  cosmetics
    .slice()
    .sort((left, right) => compareCosmeticsRows(left, right, activeCosmeticsSortKey, activeCosmeticsSortDirection))
    .forEach((item) => {
    const row = document.createElement('tr');
    row.classList.add('market-row');

    const nameCell = document.createElement('td');
    nameCell.textContent = String(item?.name || '');
    row.appendChild(nameCell);

    const priceCell = document.createElement('td');
    if (item?.unlocked) {
      priceCell.textContent = 'Unlocked';
    } else {
      const priceValue = Number(item?.price);
      priceCell.textContent = Number.isFinite(priceValue) ? `$${priceValue.toFixed(2)}` : '$0.00';
    }
    row.appendChild(priceCell);

    const actionCell = document.createElement('td');
    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.className = 'button';

    if (!item?.unlocked) {
      actionButton.textContent = 'Buy';
      actionButton.addEventListener('click', () => {
        purchaseCosmetic(item.id);
      });
    } else {
      const isSelected = state?.player?.theme === item.id;
      if (isSelected) row.classList.add('market-row-selected');
      actionButton.textContent = isSelected ? 'Selected' : 'Select';
      actionButton.disabled = isSelected;
      actionButton.addEventListener('click', () => {
        if (isSelected) return;
        selectCosmetic(item.id);
      });
    }

    actionCell.appendChild(actionButton);
    row.appendChild(actionCell);
    table.appendChild(row);
    });

  if (cosmetics.length === 0) {
    const row = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 3;
    emptyCell.textContent = 'Keep harvesting to unlock more cosmetics.';
    row.appendChild(emptyCell);
    table.appendChild(row);
  }

  tableHost.appendChild(table);
}

export function renderMarketAction(deps) {
  const {
    state,
    FARM_SECONDARY_ID,
    GRID_CELL_COUNT,
    getSelectedShopItemId,
    setSelectedShopItemId,
    getSelectedGridCellIndex,
    setSelectedGridCellIndex,
    selectedGridCellIndices,
    getSelectionPulseId,
    setSelectionPulseId,
    updateFarmToggleButton,
    isShopItemUnlocked,
    getGridCellSellSnapshot,
    getShopSeedVisualPath,
    getFreePurchaseCount,
    selectShopItem,
    getPlantGrowthState,
    getHarvestImagePath,
    getPlantStageImagePath,
    getGridRarity,
    assignGridRarity,
    normalizeRarity,
    addRareGrowthMessage,
    addMessage,
    getRarityMultiplier,
    getActiveFarmSellMultiplier,
    getGridPriceBadgeDisplayState,
    farmPointerState,
    applyGridActionForIndex,
    renderSelectedItemInsight,
    renderGuidancePanel,
    purchaseCosmetic,
    selectCosmetic,
    isStoreTabUnlocked,
    getCurrentMarketTableView,
    setCurrentMarketTableView,
    markMarketUnlocksSeenForView,
    isActiveMainTabMarket,
    getNewMarketUnlockCounts
  } = deps;

  const tableContainer = document.getElementById('market-table');
  const gridEl = document.getElementById('grid');
  const farmTitleEl = document.getElementById('farm-title');

  if (farmTitleEl) {
    farmTitleEl.textContent = state.activeFarmId === FARM_SECONDARY_ID ? 'Farm 2' : 'Farm 1';
  }
  if (gridEl) {
    gridEl.classList.toggle('farm-two', state.activeFarmId === FARM_SECONDARY_ID);
    gridEl.classList.toggle('weather-rain', String(state.weather?.id || '') === 'rain');
  }

  updateFarmToggleButton();

  const selectedShopItemId = getSelectedShopItemId();
  if (selectedShopItemId && !isShopItemUnlocked(selectedShopItemId)) {
    setSelectedShopItemId(null);
  }

  const selectedGridCellIndex = getSelectedGridCellIndex();
  if (
    selectedGridCellIndex !== null
    && (!Array.isArray(state.gridItems)
      || selectedGridCellIndex < 0
      || selectedGridCellIndex >= state.gridItems.length
      || !state.gridItems[selectedGridCellIndex])
  ) {
    setSelectedGridCellIndex(null);
  }

  if (selectedGridCellIndices.size) {
    const stale = [];
    selectedGridCellIndices.forEach((index) => {
      if (!getGridCellSellSnapshot(index)) {
        stale.push(index);
      }
    });
    stale.forEach((index) => selectedGridCellIndices.delete(index));
  }

  if (tableContainer) tableContainer.innerHTML = '';
  if (gridEl) gridEl.innerHTML = '';

  const canShowCosmetics = typeof isStoreTabUnlocked === 'function' ? !!isStoreTabUnlocked() : true;
  let activeMarketTableView = typeof getCurrentMarketTableView === 'function'
    ? getCurrentMarketTableView()
    : 'items';
  if (!canShowCosmetics && activeMarketTableView === 'cosmetics') {
    activeMarketTableView = 'items';
    if (typeof setCurrentMarketTableView === 'function') {
      setCurrentMarketTableView('items');
    }
  }
  if (
    typeof isActiveMainTabMarket === 'function'
    && isActiveMainTabMarket()
    && typeof markMarketUnlocksSeenForView === 'function'
  ) {
    markMarketUnlocksSeenForView(activeMarketTableView);
  }
  const marketUnlockBadgeCounts = typeof getNewMarketUnlockCounts === 'function'
    ? getNewMarketUnlockCounts()
    : { market: 0, cosmetics: 0, total: 0 };

  const tableHost = document.createElement('div');
  tableHost.id = MARKET_SUBTAB_PANEL_ID;
  tableHost.setAttribute('role', 'tabpanel');
  tableHost.setAttribute('aria-labelledby', `market-subtab-${activeMarketTableView}`);
  if (tableContainer) {
    tableContainer.appendChild(createMarketTableSwitcher({
      activeView: activeMarketTableView,
      canShowCosmetics,
      badgeCounts: marketUnlockBadgeCounts,
      onSelectView: (nextView) => {
        if (typeof setCurrentMarketTableView === 'function') {
          setCurrentMarketTableView(nextView);
        }
        renderMarketAction(deps);
      }
    }));
    tableContainer.appendChild(tableHost);
  }

  if (activeMarketTableView === 'cosmetics') {
    renderCosmeticsMarketTable(tableHost, state, purchaseCosmetic, selectCosmetic, () => renderMarketAction(deps));
  } else {
    const table = document.createElement('table');
    table.className = 'zebra-table';
    const headerRow = document.createElement('tr');
    [
      { label: 'Img', sortKey: null },
      { label: 'Item', sortKey: MARKET_SORT_KEYS.NAME },
      { label: 'Price', sortKey: MARKET_SORT_KEYS.PRICE },
      { label: '%', sortKey: MARKET_SORT_KEYS.PERCENT }
    ].forEach(({ label, sortKey }) => {
      const th = document.createElement('th');
      if (!sortKey) {
        th.textContent = label;
        headerRow.appendChild(th);
        return;
      }

      const isActiveSort = activeMarketSortKey === sortKey;
      const sortIndicator = isActiveSort ? (activeMarketSortDirection === 'asc' ? ' ^' : ' v') : '';
      th.textContent = `${label}${sortIndicator}`;
      th.style.cursor = 'pointer';
      th.title = isActiveSort ? `Sorted ${activeMarketSortDirection}. Click to toggle.` : 'Click to sort.';
      th.addEventListener('click', () => {
        if (activeMarketSortKey === sortKey) {
          activeMarketSortDirection = activeMarketSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          activeMarketSortKey = sortKey;
          activeMarketSortDirection = 'asc';
        }
        renderMarketAction(deps);
      });
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    const marketRows = [];
    state.shop.forEach((entry) => {
      if (!isShopItemUnlocked(entry.itemId)) return;
      const item = state.items.find((it) => it.id === entry.itemId);
      if (!item) return;
      marketRows.push({ entry, item });
    });

    marketRows
      .sort((left, right) => compareMarketRows(left, right, activeMarketSortKey, activeMarketSortDirection))
      .forEach(({ entry, item }) => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';

        const imgCell = document.createElement('td');
        const img = document.createElement('img');
        const seedImagePath = getShopSeedVisualPath(item);
        if (seedImagePath) {
          img.src = seedImagePath;
        } else {
          img.style.visibility = 'hidden';
        }
        img.alt = item.name;
        img.width = 48;
        img.height = 48;
        imgCell.appendChild(img);
        row.appendChild(imgCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = item.name || '';
        row.appendChild(nameCell);

        const avgDelta = getAverageDelta(entry);
        const avgDeltaPct = Math.abs(avgDelta * 100).toFixed(0);
        const avgDeltaSigned = `${avgDelta >= 0 ? '+' : '-'}${avgDeltaPct}%`;
        const priceBandLabel = getPriceBandLabel(avgDelta);

        const priceCell = document.createElement('td');
        const freeCount = getFreePurchaseCount(item.id);
        const priceText = document.createElement('span');
        priceText.className = 'market-price-value';
        priceText.textContent = freeCount > 0
          ? `$${entry.price.toFixed(2)} (${freeCount} free)`
          : `$${entry.price.toFixed(2)}`;
        priceCell.appendChild(priceText);
        row.appendChild(priceCell);

        const percentCell = document.createElement('td');
        const trendChip = document.createElement('span');
        trendChip.className = `insight-chip market-price-trend ${avgDelta <= -0.05 ? 'good' : (avgDelta >= 0.05 ? 'bad' : '')}`.trim();
        if (avgDelta <= -0.05) {
          trendChip.textContent = `${priceBandLabel} (${avgDeltaSigned})`;
          trendChip.title = `${Math.abs(avgDelta * 100).toFixed(0)}% below average market price`;
        } else if (avgDelta >= 0.05) {
          trendChip.textContent = `${priceBandLabel} (${avgDeltaSigned})`;
          trendChip.title = `${Math.abs(avgDelta * 100).toFixed(0)}% above average market price`;
        } else {
          trendChip.textContent = `${priceBandLabel} (${avgDeltaSigned})`;
          trendChip.title = 'Near average market price';
        }
        percentCell.appendChild(trendChip);
        row.appendChild(percentCell);

        row.classList.add('market-row');
        row.dataset.itemId = String(item.id);
        if (getSelectedShopItemId() === item.id) {
          row.classList.add('market-row-selected');
        }
        if (getSelectionPulseId() === item.id) {
          row.classList.add('market-row-pulse');
          row.addEventListener('animationend', () => {
            row.classList.remove('market-row-pulse');
          }, { once: true });
        }
        row.addEventListener('click', () => {
          selectShopItem(item.id);
        });

        table.appendChild(row);
      });

    tableHost.appendChild(table);
  }
  if (getSelectionPulseId() !== null) {
    setSelectionPulseId(null);
  }
  const desiredGridPriceBadgeDisplayState = typeof getGridPriceBadgeDisplayState === 'function'
    ? getGridPriceBadgeDisplayState()
    : { visible: false, fading: false };
  const runtimeFlags = (state.runtimeFlags && typeof state.runtimeFlags === 'object')
    ? state.runtimeFlags
    : null;
  const suppressHideFadeOnce = !!runtimeFlags?.suppressGridPriceBadgeHideFadeOnce;
  if (runtimeFlags && suppressHideFadeOnce) {
    runtimeFlags.suppressGridPriceBadgeHideFadeOnce = false;
  }
  const nowMs = Date.now();
  if (!suppressHideFadeOnce && !desiredGridPriceBadgeDisplayState.visible && lastDesiredGridPriceBadgeVisible) {
    gridPriceBadgeHideFadeUntilMs = nowMs + GRID_PRICE_BADGE_HIDE_FADE_MS;
  }
  if (desiredGridPriceBadgeDisplayState.visible) {
    gridPriceBadgeHideFadeUntilMs = 0;
  }
  const gridPriceBadgeDisplayState = (
    !desiredGridPriceBadgeDisplayState.visible
    && nowMs < gridPriceBadgeHideFadeUntilMs
  )
    ? { visible: true, fading: true }
    : desiredGridPriceBadgeDisplayState;
  lastDesiredGridPriceBadgeVisible = !!desiredGridPriceBadgeDisplayState.visible;
  lastGridPriceBadgeVisible = !!gridPriceBadgeDisplayState.visible;
  let gridPriceBadgeCountRendered = 0;

  for (let i = 0; i < GRID_CELL_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.index = String(i);
    if (getSelectedGridCellIndex() === i) {
      cell.classList.add('grid-cell-selected');
    }
    if (selectedGridCellIndices.has(i)) {
      cell.classList.add('grid-cell-bulk-selected');
    }

    const unlocked = Array.isArray(state.gridUnlocked) ? state.gridUnlocked[i] : false;
    if (unlocked) {
      cell.classList.add('revealed');
    }

    if (state.gridUnlocked && state.gridUnlocked[i] && state.gridItems && state.gridItems[i]) {
      const itmId = state.gridItems[i];
      const it = state.items.find((itm) => itm.id === itmId);
      if (it) {
        const shopEntry = state.shop.find((entry) => entry.itemId === itmId);
        const gridMarketPercentDelta = shopEntry ? getAverageDelta(shopEntry) : Number.NaN;
        const growth = getPlantGrowthState(it, i);
        const growDays = typeof it.growDays === 'number' ? it.growDays : 0;
        const img = document.createElement('img');
        img.width = 24;
        img.height = 24;
        const gridImagePath = growth.isGrown
          ? getHarvestImagePath(it)
          : getPlantStageImagePath(it, growth.stageIndex);
        if (gridImagePath) {
          img.src = gridImagePath;
        }
        img.alt = it.name;
        cell.appendChild(img);
        if (growth.isGrown) {
          const hadRarity = !!getGridRarity(i);
          const rarity = assignGridRarity(i);
          if (!hadRarity) {
            const normalizedRarity = normalizeRarity(rarity);
            if (normalizedRarity === 'rare' || normalizedRarity === 'mythic') {
              addRareGrowthMessage(it, normalizedRarity);
            } else {
              addMessage({
                id: 'progress.harvest_ready',
                vars: { itemName: it.name },
                meta: {
                  speaker: 'player',
                  emotion: 'excited',
                  category: 'progress',
                  priority: 'normal'
                }
              });
            }
          }
          if (rarity) {
            cell.classList.add('rarity-border', `rarity-${rarity}`);
            const frame = document.createElement('div');
            frame.className = 'rarity-frame';
            cell.appendChild(frame);
            if (rarity === 'mythic') {
              const holo = document.createElement('div');
              holo.className = 'rarity-holo';
              cell.appendChild(holo);
            }
          }
          const multiplier = getRarityMultiplier(rarity);
          const sellPrice = shopEntry ? shopEntry.price * multiplier * getActiveFarmSellMultiplier() : 0;
          cell.title = `Harvest for $${sellPrice.toFixed(2)}`;
        } else if (growDays > 0) {
          cell.title = `Grows in ${growth.daysLeft} day${growth.daysLeft === 1 ? '' : 's'}`;
        }
        if (gridPriceBadgeDisplayState.visible && growth.isGrown) {
          const priceDeltaBadge = createGridPriceDeltaBadge(gridMarketPercentDelta, !!gridPriceBadgeDisplayState.fading);
          if (priceDeltaBadge) {
            cell.appendChild(priceDeltaBadge);
            gridPriceBadgeCountRendered += 1;
          }
        }
      }
    }

    const miningHits = Array.isArray(state.gridMiningHits) ? state.gridMiningHits[i] : 0;
    if (!unlocked && miningHits > 0) {
      const crackIndex = Math.min(10, miningHits);
      const crackImg = document.createElement('img');
      crackImg.className = 'grid-overlay';
      crackImg.src = `resources/tools/crack${crackIndex}.png`;
      crackImg.alt = 'Mining progress';
      cell.appendChild(crackImg);
    }
    if (unlocked && Array.isArray(state.gridWateredDay) && state.gridWateredDay[i] === state.player.day) {
      const waterImg = document.createElement('img');
      waterImg.className = 'grid-overlay';
      waterImg.src = 'resources/tools/water.png';
      waterImg.alt = 'Watered';
      cell.appendChild(waterImg);
    }

    cell.addEventListener('click', () => {
      if (Date.now() < farmPointerState.suppressClickUntil) return;
      applyGridActionForIndex(i, { mode: 'tap' });
    });
    cell.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
    });
    if (gridEl) gridEl.appendChild(cell);
  }
  if (gridEl && String(state.weather?.id || '') === 'rain') {
    const rainOverlay = document.createElement('div');
    rainOverlay.className = 'weather-rain-overlay';
    rainOverlay.setAttribute('aria-hidden', 'true');

    // Deterministic per-day/per-farm splash layout so visuals look lively
    // without flickering to new random positions on every render.
    let splashSeed = (
      ((Number(state.player?.day) || 1) * 1103515245)
      + ((Number(state.activeFarmId) || 1) * 12345)
    ) >>> 0;
    const nextSplashRand = () => {
      splashSeed = (splashSeed * 1664525 + 1013904223) >>> 0;
      return splashSeed / 4294967296;
    };
    const GRID_SIDE = 7;
    const totalCells = GRID_SIDE * GRID_SIDE;
    const cellIndices = Array.from({ length: totalCells }, (_, idx) => idx);
    for (let i = cellIndices.length - 1; i > 0; i -= 1) {
      const swapIndex = Math.floor(nextSplashRand() * (i + 1));
      const temp = cellIndices[i];
      cellIndices[i] = cellIndices[swapIndex];
      cellIndices[swapIndex] = temp;
    }

    const splashCount = 16;
    const appendSplash = ({ x, y, size, durationMs, delayMs, variant = '' }) => {
      const splash = document.createElement('span');
      splash.className = `weather-rain-splash size-${size}${variant ? ` ${variant}` : ''}`;
      splash.style.setProperty('--splash-x', `${Math.max(2, Math.min(98, x))}%`);
      splash.style.setProperty('--splash-y', `${Math.max(4, Math.min(96, y))}%`);
      splash.style.setProperty('--splash-duration', `${durationMs}ms`);
      splash.style.setProperty('--splash-delay', `${delayMs}ms`);
      rainOverlay.appendChild(splash);
    };

    for (let splashIndex = 0; splashIndex < splashCount; splashIndex += 1) {
      const cellIndex = cellIndices[splashIndex % cellIndices.length];
      const row = Math.floor(cellIndex / GRID_SIDE);
      const col = cellIndex % GRID_SIDE;
      const cellCenterX = ((col + 0.5) / GRID_SIDE) * 100;
      const cellCenterY = ((row + 0.5) / GRID_SIDE) * 100;
      const jitterX = (nextSplashRand() - 0.5) * 8.5;
      const jitterY = (nextSplashRand() - 0.5) * 8.5;
      const sizeRoll = nextSplashRand();
      const splashSize = sizeRoll < 0.5 ? 1 : (sizeRoll < 0.84 ? 2 : 3);
      const x = cellCenterX + jitterX;
      const y = cellCenterY + jitterY;
      const durationMs = 1800 + Math.round(nextSplashRand() * 1800);
      const delayMs = -Math.round(nextSplashRand() * durationMs);
      appendSplash({ x, y, size: splashSize, durationMs, delayMs });

      // Break larger impacts into a few smaller nearby splashes so they feel less blob-like.
      if (splashSize === 3) {
        const shardCount = 2 + Math.floor(nextSplashRand() * 2);
        for (let shardIndex = 0; shardIndex < shardCount; shardIndex += 1) {
          const angle = nextSplashRand() * Math.PI * 2;
          const radius = 1.5 + (nextSplashRand() * 3.8);
          const shardX = x + (Math.cos(angle) * radius);
          const shardY = y + (Math.sin(angle) * radius * 0.7);
          const shardDuration = Math.max(1200, durationMs - (220 + Math.round(nextSplashRand() * 500)));
          const shardDelay = delayMs + Math.round(nextSplashRand() * 180) - 90;
          const shardSize = nextSplashRand() < 0.7 ? 1 : 2;
          appendSplash({
            x: shardX,
            y: shardY,
            size: shardSize,
            durationMs: shardDuration,
            delayMs: shardDelay,
            variant: 'is-shard'
          });
        }
      }
    }
    gridEl.appendChild(rainOverlay);
  }
  if (runtimeFlags) {
    runtimeFlags.gridPriceBadgesVisibleLastRender = lastGridPriceBadgeVisible;
    runtimeFlags.gridPriceBadgesActuallyRenderedLastRender = gridPriceBadgeCountRendered > 0;
  }

  renderSelectedItemInsight();
  renderGuidancePanel();
}
