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
    sellSelectedGridItem
  } = deps;

  const panel = document.getElementById('market-insight-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const bulkInsight = getBulkSelectedGridInsightData();
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

  const gridInsight = getSelectedGridItemInsightData();
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

  const insight = getSelectedShopItemInsightData();
  if (!insight) {
    const empty = document.createElement('div');
    empty.id = 'market-insight-empty';
    empty.className = 'market-insight-empty';
    empty.textContent = 'Select an item in Market or Farm to preview info.';
    panel.appendChild(empty);
    return;
  }

  panel.appendChild(createInsightHeader(`${insight.itemName} outlook`, clearCurrentInfoSelection));
  const metricGrid = document.createElement('div');
  metricGrid.className = 'market-insight-grid';
  const rows = [
    ['Buy Price', `$${insight.buyPrice.toFixed(2)}`, ''],
    ['Effective Cost', `$${insight.effectiveCost.toFixed(2)}`, insight.effectiveCost === 0 ? 'good' : ''],
    ['Expected Sale', `$${insight.expectedSale.toFixed(2)}`, ''],
    ['Projected Delta', `${insight.projectedDelta >= 0 ? '+' : ''}$${insight.projectedDelta.toFixed(2)}`, insight.projectedDelta >= 0 ? 'good' : 'bad']
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
  safetyChip.className = `insight-chip${insight.guaranteedDelta >= 0 ? ' good' : ' bad'}`;
  safetyChip.textContent = `Guaranteed: ${insight.guaranteedDelta >= 0 ? '+' : ''}$${insight.guaranteedDelta.toFixed(2)}`;
  chipRow.appendChild(safetyChip);
  const marginChip = document.createElement('span');
  const marginTone = insight.marginPct >= 0 ? ' good' : ' bad';
  marginChip.className = `insight-chip${marginTone}`;
  marginChip.textContent = `Projected Margin: ${insight.marginPct >= 0 ? '+' : ''}${insight.marginPct.toFixed(0)}%`;
  chipRow.appendChild(marginChip);
  if (insight.freeCount > 0) {
    const freeChip = document.createElement('span');
    freeChip.className = 'insight-chip good';
    freeChip.textContent = `${insight.freeCount} free purchase${insight.freeCount === 1 ? '' : 's'} remaining`;
    chipRow.appendChild(freeChip);
  }
  panel.appendChild(chipRow);
}
