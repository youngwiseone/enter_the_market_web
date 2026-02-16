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
    getSeedImagePath,
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
    farmPointerState,
    applyGridActionForIndex,
    renderSelectedItemInsight,
    renderGuidancePanel
  } = deps;

  const tableContainer = document.getElementById('market-table');
  const gridEl = document.getElementById('grid');
  const farmTitleEl = document.getElementById('farm-title');

  if (farmTitleEl) {
    farmTitleEl.textContent = state.activeFarmId === FARM_SECONDARY_ID ? 'Farm 2' : 'Farm 1';
  }
  if (gridEl) {
    gridEl.classList.toggle('farm-two', state.activeFarmId === FARM_SECONDARY_ID);
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

  const table = document.createElement('table');
  table.className = 'zebra-table';
  const headerRow = document.createElement('tr');
  ['Img', 'Item', 'Price'].forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  state.shop.forEach((entry) => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    const item = state.items.find((it) => it.id === entry.itemId);
    if (!item) return;

    const row = document.createElement('tr');
    row.style.cursor = 'pointer';

    const imgCell = document.createElement('td');
    const img = document.createElement('img');
    const seedImagePath = getSeedImagePath(item);
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

    const descCell = document.createElement('td');
    descCell.textContent = item.description || item.name;
    row.appendChild(descCell);

    const avgPrice = (entry.daysCount && entry.priceSum) ? (entry.priceSum / entry.daysCount) : entry.price;
    const priceCell = document.createElement('td');
    const freeCount = getFreePurchaseCount(item.id);
    const priceText = document.createElement('span');
    priceText.className = 'market-price-value';
    priceText.textContent = freeCount > 0
      ? `$${entry.price.toFixed(2)} (${freeCount} free)`
      : `$${entry.price.toFixed(2)}`;
    priceCell.appendChild(priceText);

    const avgDelta = avgPrice > 0 ? ((entry.price - avgPrice) / avgPrice) : 0;
    const avgDeltaPct = Math.abs(avgDelta * 100).toFixed(0);
    const avgDeltaSigned = `${avgDelta >= 0 ? '+' : '-'}${avgDeltaPct}%`;
    const trendChip = document.createElement('span');
    trendChip.className = `insight-chip market-price-trend ${avgDelta <= -0.05 ? 'good' : (avgDelta >= 0.05 ? 'bad' : '')}`.trim();
    if (avgDelta <= -0.05) {
      trendChip.textContent = `Great Deal (${avgDeltaSigned})`;
      trendChip.title = `${Math.abs(avgDelta * 100).toFixed(0)}% below average market price`;
    } else if (avgDelta >= 0.05) {
      trendChip.textContent = `Overpriced (${avgDeltaSigned})`;
      trendChip.title = `${Math.abs(avgDelta * 100).toFixed(0)}% above average market price`;
    } else {
      trendChip.textContent = `Fair Price (${avgDeltaSigned})`;
      trendChip.title = 'Near average market price';
    }
    priceCell.appendChild(trendChip);
    row.appendChild(priceCell);

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

  if (tableContainer) {
    tableContainer.appendChild(table);
  }
  if (getSelectionPulseId() !== null) {
    setSelectionPulseId(null);
  }

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
              addMessage(`${it.name} is ready to harvest.`, {
                speaker: 'player',
                emotion: 'excited',
                category: 'progress',
                priority: 'normal'
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
          const shopEntry = state.shop.find((entry) => entry.itemId === itmId);
          const multiplier = getRarityMultiplier(rarity);
          const sellPrice = shopEntry ? shopEntry.price * multiplier * getActiveFarmSellMultiplier() : 0;
          cell.title = `Harvest for $${sellPrice.toFixed(2)}`;
        } else if (growDays > 0) {
          cell.title = `Grows in ${growth.daysLeft} day${growth.daysLeft === 1 ? '' : 's'}`;
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

  renderSelectedItemInsight();
  renderGuidancePanel();
}
