function createInsightHeader(titleText, clearCurrentInfoSelection) {
  const head = document.createElement('div');
  head.className = 'market-insight-head';
  const title = document.createElement('div');
  title.className = 'market-insight-title';
  title.textContent = titleText;
  head.appendChild(title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'button market-insight-close';
  close.textContent = 'x';
  close.title = 'Close info';
  close.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearCurrentInfoSelection();
  });
  head.appendChild(close);
  return head;
}

export function renderSelectedItemInsightAction(deps) {
  const {
    getBulkSelectedGridInsightData,
    getSelectedGridItemInsightData,
    getSelectedShopItemInsightData,
    clearCurrentInfoSelection,
    sellBulkSelectedGridItems,
    sellSelectedGridItem,
    updateGridSize
  } = deps;

  const bulkInsight = getBulkSelectedGridInsightData();
  const gridInsight = getSelectedGridItemInsightData();
  const shopInsight = getSelectedShopItemInsightData();

  const farmDock = document.getElementById('farm-action-dock');
  const farmButton = document.getElementById('farm-action-button');
  const isMobileLayout = !!(document.body && document.body.classList.contains('mobile-layout'));
  const farmPanel = document.getElementById('farm-panel');
  const isFarmVisible = !!(farmPanel && window.getComputedStyle(farmPanel).display !== 'none');
  const wasFarmDockVisible = !!(farmDock && farmDock.classList.contains('is-visible'));
  const body = document.body;

  function setRestReplacementMode(enabled) {
    if (!body) return;
    body.classList.toggle('farm-action-replaces-rest', !!enabled);
  }

  function clearFarmActionButton() {
    if (!farmDock || !farmButton) return;
    farmDock.classList.remove('is-visible');
    farmButton.textContent = '';
    farmButton.disabled = true;
    farmButton.onclick = null;
    setRestReplacementMode(false);
  }

  function setFarmActionButton(label, onClick, disabled = false) {
    if (!farmDock || !farmButton) return;
    farmDock.classList.add('is-visible');
    farmButton.textContent = label;
    farmButton.disabled = !!disabled;
    farmButton.onclick = onClick || null;
    setRestReplacementMode(isMobileLayout && isFarmVisible);
  }

  if (isMobileLayout && isFarmVisible) {
    if (bulkInsight && bulkInsight.count > 0) {
      setFarmActionButton(
        `Sell for $${bulkInsight.totalSale.toFixed(2)} (profit ${bulkInsight.totalProfit >= 0 ? '+' : ''}$${bulkInsight.totalProfit.toFixed(2)})`,
        () => sellBulkSelectedGridItems(),
        false
      );
    } else if (gridInsight) {
      if (gridInsight.canSell) {
        setFarmActionButton(
          `Sell for $${gridInsight.sellNow.toFixed(2)} (profit ${gridInsight.profitNow >= 0 ? '+' : ''}$${gridInsight.profitNow.toFixed(2)})`,
          () => sellSelectedGridItem(),
          false
        );
      } else {
        setFarmActionButton(
          `Growing (${gridInsight.growth.daysLeft} day${gridInsight.growth.daysLeft === 1 ? '' : 's'} left)`,
          null,
          true
        );
      }
    } else {
      clearFarmActionButton();
    }
  } else {
    clearFarmActionButton();
  }
  const isFarmDockVisible = !!(farmDock && farmDock.classList.contains('is-visible'));
  if (isMobileLayout && wasFarmDockVisible !== isFarmDockVisible && typeof updateGridSize === 'function') {
    window.requestAnimationFrame(() => updateGridSize());
  }

  const panels = [];
  const primary = document.getElementById('market-insight-panel');
  if (primary) panels.push(primary);
  document.querySelectorAll('[data-insight-panel]').forEach((panel) => {
    if (!panels.includes(panel)) panels.push(panel);
  });
  if (!panels.length) return;

  function renderIntoPanel(panel) {
    panel.innerHTML = '';

    if (bulkInsight && bulkInsight.count > 0) {
      panel.appendChild(createInsightHeader(`${bulkInsight.count} selected crops`, clearCurrentInfoSelection));
      const metricGrid = document.createElement('div');
      metricGrid.className = 'market-insight-grid';
      const rows = [
        ['Total Bought', `$${bulkInsight.totalBuy.toFixed(2)}`, ''],
        ['Total Sell Now', `$${bulkInsight.totalSale.toFixed(2)}`, ''],
        ['Bulk Profit', `${bulkInsight.totalProfit >= 0 ? '+' : ''}$${bulkInsight.totalProfit.toFixed(2)}`, bulkInsight.totalProfit >= 0 ? 'good' : 'bad'],
        ['Energy Cost', `${bulkInsight.count}`, '']
      ];
      rows.forEach(([label, value, tone]) => {
        const metric = document.createElement('div');
        metric.className = 'market-insight-metric';
        const labelEl = document.createElement('span');
        labelEl.className = 'metric-label';
        labelEl.textContent = label;
        const valueEl = document.createElement('span');
        valueEl.className = `metric-value${tone ? ` ${tone}` : ''}`;
        valueEl.textContent = value;
        metric.appendChild(labelEl);
        metric.appendChild(valueEl);
        metricGrid.appendChild(metric);
      });
      panel.appendChild(metricGrid);
      const chipRow = document.createElement('div');
      chipRow.className = 'market-insight-row';
      const compositionChip = document.createElement('span');
      compositionChip.className = 'insight-chip';
      compositionChip.textContent = bulkInsight.itemBreakdown.join(', ');
      chipRow.appendChild(compositionChip);
      const sellButton = document.createElement('button');
      sellButton.type = 'button';
      sellButton.className = 'button';
      sellButton.textContent = `Sell Selected (${bulkInsight.count})`;
      sellButton.addEventListener('click', () => {
        sellBulkSelectedGridItems();
      });
      chipRow.appendChild(sellButton);
      panel.appendChild(chipRow);
      return;
    }

    if (gridInsight) {
      panel.appendChild(createInsightHeader(`${gridInsight.itemName} selected tile`, clearCurrentInfoSelection));
      const metricGrid = document.createElement('div');
      metricGrid.className = 'market-insight-grid';
      const rows = [
        ['Bought For', `$${gridInsight.buyPrice.toFixed(2)}`, ''],
        ['Market Base', `$${gridInsight.currentBasePrice.toFixed(2)}`, ''],
        ['Sell Now', gridInsight.canSell ? `$${gridInsight.sellNow.toFixed(2)}` : 'Not ready', gridInsight.canSell ? '' : 'bad'],
        ['Profit', gridInsight.canSell ? `${gridInsight.profitNow >= 0 ? '+' : ''}$${gridInsight.profitNow.toFixed(2)}` : '-', gridInsight.canSell ? (gridInsight.profitNow >= 0 ? 'good' : 'bad') : '']
      ];
      rows.forEach(([label, value, tone]) => {
        const metric = document.createElement('div');
        metric.className = 'market-insight-metric';
        const labelEl = document.createElement('span');
        labelEl.className = 'metric-label';
        labelEl.textContent = label;
        const valueEl = document.createElement('span');
        valueEl.className = `metric-value${tone ? ` ${tone}` : ''}`;
        valueEl.textContent = value;
        metric.appendChild(labelEl);
        metric.appendChild(valueEl);
        metricGrid.appendChild(metric);
      });
      panel.appendChild(metricGrid);

      const chipRow = document.createElement('div');
      chipRow.className = 'market-insight-row';
      const rarityChip = document.createElement('span');
      const rarityLabel = String(gridInsight.rarity || 'unknown');
      const rarityClass = rarityLabel === 'unknown' ? '' : ` rarity-${rarityLabel}`;
      rarityChip.className = `insight-chip insight-rarity-chip${rarityClass}`;
      rarityChip.textContent = `Rarity: ${rarityLabel === 'unknown' ? 'Unknown' : (rarityLabel.charAt(0).toUpperCase() + rarityLabel.slice(1))}`;
      chipRow.appendChild(rarityChip);

      const stageChip = document.createElement('span');
      stageChip.className = `insight-chip${gridInsight.canSell ? ' good' : ''}`;
      stageChip.textContent = gridInsight.canSell
        ? 'Ready to sell'
        : `Growing (${gridInsight.growth.daysLeft} day${gridInsight.growth.daysLeft === 1 ? '' : 's'} left)`;
      chipRow.appendChild(stageChip);

      const sellButton = document.createElement('button');
      sellButton.type = 'button';
      sellButton.className = 'button';
      sellButton.textContent = gridInsight.canSell ? `Sell Selected ($${gridInsight.sellNow.toFixed(2)})` : 'Sell Selected (Locked)';
      sellButton.disabled = !gridInsight.canSell;
      sellButton.addEventListener('click', () => {
        sellSelectedGridItem();
      });
      chipRow.appendChild(sellButton);
      panel.appendChild(chipRow);
      return;
    }

    if (!shopInsight) {
      const empty = document.createElement('div');
      empty.id = 'market-insight-empty';
      empty.className = 'market-insight-empty';
      empty.textContent = 'Select an item in Market or Farm to preview info.';
      panel.appendChild(empty);
      return;
    }

    panel.appendChild(createInsightHeader(`${shopInsight.itemName} outlook`, clearCurrentInfoSelection));
    const metricGrid = document.createElement('div');
    metricGrid.className = 'market-insight-grid';
    const rows = [
      ['Buy Price', `$${shopInsight.buyPrice.toFixed(2)}`, ''],
      ['Effective Cost', `$${shopInsight.effectiveCost.toFixed(2)}`, shopInsight.effectiveCost === 0 ? 'good' : ''],
      ['Expected Sale', `$${shopInsight.expectedSale.toFixed(2)}`, ''],
      ['Projected Delta', `${shopInsight.projectedDelta >= 0 ? '+' : ''}$${shopInsight.projectedDelta.toFixed(2)}`, shopInsight.projectedDelta >= 0 ? 'good' : 'bad']
    ];
    rows.forEach(([label, value, tone]) => {
      const metric = document.createElement('div');
      metric.className = 'market-insight-metric';
      const labelEl = document.createElement('span');
      labelEl.className = 'metric-label';
      labelEl.textContent = label;
      const valueEl = document.createElement('span');
      valueEl.className = `metric-value${tone ? ` ${tone}` : ''}`;
      valueEl.textContent = value;
      metric.appendChild(labelEl);
      metric.appendChild(valueEl);
      metricGrid.appendChild(metric);
    });
    panel.appendChild(metricGrid);

    const chipRow = document.createElement('div');
    chipRow.className = 'market-insight-row';
    const safetyChip = document.createElement('span');
    safetyChip.className = `insight-chip${shopInsight.guaranteedDelta >= 0 ? ' good' : ' bad'}`;
    safetyChip.textContent = `Guaranteed: ${shopInsight.guaranteedDelta >= 0 ? '+' : ''}$${shopInsight.guaranteedDelta.toFixed(2)}`;
    chipRow.appendChild(safetyChip);
    const marginChip = document.createElement('span');
    const marginTone = shopInsight.marginPct >= 0 ? ' good' : ' bad';
    marginChip.className = `insight-chip${marginTone}`;
    marginChip.textContent = `Projected Margin: ${shopInsight.marginPct >= 0 ? '+' : ''}${shopInsight.marginPct.toFixed(0)}%`;
    chipRow.appendChild(marginChip);
    if (shopInsight.freeCount > 0) {
      const freeChip = document.createElement('span');
      freeChip.className = 'insight-chip good';
      freeChip.textContent = `${shopInsight.freeCount} free purchase${shopInsight.freeCount === 1 ? '' : 's'} remaining`;
      chipRow.appendChild(freeChip);
    }
    panel.appendChild(chipRow);
  }

  panels.forEach((panel) => renderIntoPanel(panel));
}
