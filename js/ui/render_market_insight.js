function appendMarketContext(panel, insight) {
  const context = insight.marketContext;
  if (!context) return;
  const note = document.createElement('p');
  note.className = 'market-context';
  const relative = context.relative;
  const today = document.createElement('span');
  today.textContent = `${relative >= 5 ? '↑ Above' : relative <= -5 ? '↓ Below' : '≈ Near'} average · average $${context.average.toFixed(2)}`;
  const next = document.createElement('span');
  next.textContent = `Next cycle ${context.cycleChange > 0 ? '↗ rising' : context.cycleChange < 0 ? '↘ falling' : '→ flat'} · price uncertain`;
  note.append(today, next);
  panel.appendChild(note);
}

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
  close.textContent = 'Clear';
  close.title = 'Close info';
  close.setAttribute('aria-label', 'Close crop info');
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
    clearShopSelection,
    sellBulkSelectedGridItems,
    sellSelectedGridItem,
    updateGridSize,
    isSellBatchInFlight = false
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
    delete farmButton.dataset.sellActionButton;
    farmButton.onclick = null;
    setRestReplacementMode(false);
  }

  function setFarmActionButton(label, onClick, disabled = false, isSellAction = false) {
    if (!farmDock || !farmButton) return;
    farmDock.classList.add('is-visible');
    farmButton.textContent = label;
    farmButton.disabled = !!disabled || (isSellAction && isSellBatchInFlight);
    if (isSellAction && isSellBatchInFlight) farmButton.textContent = 'Selling…';
    if (isSellAction) {
      farmButton.dataset.sellActionButton = 'true';
    } else {
      delete farmButton.dataset.sellActionButton;
    }
    farmButton.onclick = onClick || null;
    setRestReplacementMode(false);
  }

  if (isMobileLayout && isFarmVisible) {
    if (bulkInsight && bulkInsight.count > 0) {
      setFarmActionButton(
        `Sell $${bulkInsight.totalSale.toFixed(2)} · ${bulkInsight.cells?.some((cell) => cell.quote?.historicalCostUnknown) ? 'known-cost profit' : 'profit'} ${bulkInsight.totalProfit >= 0 ? '+' : '−'}$${Math.abs(bulkInsight.totalProfit).toFixed(2)}`,
        () => sellBulkSelectedGridItems(farmButton),
        false,
        true
      );
    } else if (gridInsight) {
      if (gridInsight.canSell) {
        setFarmActionButton(
          `Sell $${gridInsight.sellNow.toFixed(2)} · ${gridInsight.quote?.historicalCostUnknown ? 'known-cost profit' : 'profit'} ${gridInsight.profitNow >= 0 ? '+' : '−'}$${Math.abs(gridInsight.profitNow).toFixed(2)}`,
          () => sellSelectedGridItem(farmButton),
          false,
          true
        );
      } else {
        setFarmActionButton(
          `${gridInsight.itemName} · ${gridInsight.growth.daysLeft}d left · ${gridInsight.wateredToday ? 'Watered ✓' : gridInsight.waterRetainedToday ? 'Moisture retained' : 'Needs water'}`,
          null,
          true,
          false
        );
      }
    } else if (shopInsight) {
      setFarmActionButton(`Cancel ${shopInsight.isProduce ? 'planting' : 'placement'} · ${shopInsight.itemName}`, () => {
        if (typeof clearShopSelection === 'function') clearShopSelection();
        else clearCurrentInfoSelection();
      });
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
      const hasNonProduce = Array.isArray(bulkInsight.cells)
        ? bulkInsight.cells.some((cell) => cell && cell.isProduce === false)
        : false;
      panel.appendChild(createInsightHeader(`${bulkInsight.count} selected ${hasNonProduce ? 'items' : 'crops'}`, clearCurrentInfoSelection));
      const metricGrid = document.createElement('div');
      metricGrid.className = 'market-insight-grid';
      const rows = [
        ['Total Sell Now', `$${bulkInsight.totalSale.toFixed(2)}`, ''],
        [bulkInsight.cells?.some((cell) => cell.quote?.historicalCostUnknown) ? 'Known-cost profit' : 'Bulk Profit', `${bulkInsight.totalProfit >= 0 ? '+' : ''}$${bulkInsight.totalProfit.toFixed(2)}`, bulkInsight.totalProfit >= 0 ? 'good' : 'bad'],
        ['Seed + treatments', `$${bulkInsight.totalBuy.toFixed(2)}`, ''],
        ['Energy Cost', '0', 'good']
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
      if (gridInsight?.isProduce && gridInsight.canSell && gridInsight.quote) {
        const details = document.createElement('details');
        details.className = 'sale-breakdown';
        const summary = document.createElement('summary');
        summary.textContent = 'Why this sale value?';
        const text = document.createElement('p');
        const q = gridInsight.quote;
        const signed = value => `${value >= 0 ? '+' : '−'}$${Math.abs(value).toFixed(2)}`;
        text.textContent = `Ordinary crop $${q.ordinaryValue.toFixed(2)} · market ${signed(q.marketEffect)} · rarity ${signed(q.rarityBonus)}${q.farmBonus ? ' · farm ' + signed(q.farmBonus) : ''}. Cost $${q.cost.toFixed(2)}; net ${signed(q.profit)}. Holding keeps your crop, but uses this growing tile.`;
        details.append(summary, text);
        panel.appendChild(details);
      }
      const chipRow = document.createElement('div');
      chipRow.className = 'market-insight-row';
      const compositionChip = document.createElement('span');
      compositionChip.className = 'insight-chip';
      compositionChip.textContent = bulkInsight.itemBreakdown.join(', ');
      chipRow.appendChild(compositionChip);
      if (bulkInsight.cells?.some((cell) => cell.quote?.historicalCostUnknown)) {
        const limitation = document.createElement('p');
        limitation.className = 'market-context';
        limitation.textContent = 'Older treatment costs are unknown for some selected crops. Profit uses recorded costs only.';
        panel.appendChild(limitation);
      }
      const sellButton = document.createElement('button');
      sellButton.type = 'button';
      sellButton.className = 'button';
      sellButton.textContent = isSellBatchInFlight ? 'Selling…' : `Sell Selected (${bulkInsight.count})`;
      sellButton.disabled = isSellBatchInFlight;
      sellButton.dataset.sellActionButton = 'true';
      sellButton.addEventListener('click', () => {
        sellBulkSelectedGridItems(sellButton);
      });
      chipRow.appendChild(sellButton);
      panel.appendChild(chipRow);
      return;
    }

    if (gridInsight) {
      panel.appendChild(createInsightHeader(gridInsight.itemName, clearCurrentInfoSelection));
      appendMarketContext(panel, gridInsight);
      const metricGrid = document.createElement('div');
      metricGrid.className = 'market-insight-grid';
      const rows = gridInsight.isDish ? [
        ['Meal value', `$${gridInsight.sellNow.toFixed(2)}`, ''],
        ['Ingredient costs', `$${gridInsight.buyPrice.toFixed(2)}`, ''],
        [gridInsight.quote?.historicalCostUnknown ? 'Known-cost profit' : 'Net profit', `${gridInsight.profitNow >= 0 ? '+' : '−'}$${Math.abs(gridInsight.profitNow).toFixed(2)}`, gridInsight.profitNow >= 0 ? 'good' : 'bad'],
        ['Recipe quality', gridInsight.rarity, '']
      ] : gridInsight.isProduce ? [
        ['Sell Now', gridInsight.canSell ? `$${gridInsight.sellNow.toFixed(2)}` : 'Not ready', gridInsight.canSell ? '' : 'bad'],
        [gridInsight.quote?.historicalCostUnknown ? 'Known-cost profit' : 'Net profit', gridInsight.canSell ? `${gridInsight.profitNow >= 0 ? '+' : '−'}$${Math.abs(gridInsight.profitNow).toFixed(2)}` : '-', gridInsight.canSell ? (gridInsight.profitNow >= 0 ? 'good' : 'bad') : '']
      ] : [
        ['Bought For', `$${gridInsight.buyPrice.toFixed(2)}`, ''],
        ['Base Price', `$${gridInsight.currentBasePrice.toFixed(2)}`, ''],
        ['Resale (80%)', `$${gridInsight.sellNow.toFixed(2)}`, ''],
        ['Profit', `${gridInsight.profitNow >= 0 ? '+' : ''}$${gridInsight.profitNow.toFixed(2)}`, gridInsight.profitNow >= 0 ? 'good' : 'bad']
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
      if (gridInsight.isProduce) {
        const costNote = document.createElement('p');
        costNote.className = 'market-context';
        costNote.textContent = `Seed + treatments $${(gridInsight.quote?.cost ?? gridInsight.buyPrice).toFixed(2)}${gridInsight.canSell && gridInsight.rarity ? ' · ' + gridInsight.rarity : ''}`;
        panel.appendChild(costNote);
      }
      if (gridInsight.quote?.historicalCostUnknown) {
        const limitation = document.createElement('p');
        limitation.className = 'market-context';
        limitation.textContent = 'Older treatment costs are unknown. Profit subtracts only recorded seed and treatment spending.';
        panel.appendChild(limitation);
      }
      if (gridInsight?.isProduce && gridInsight.canSell && gridInsight.quote) {
        const details = document.createElement('details');
        details.className = 'sale-breakdown';
        const summary = document.createElement('summary');
        summary.textContent = 'Why this sale value?';
        const text = document.createElement('p');
        const q = gridInsight.quote;
        const signed = value => `${value >= 0 ? '+' : '−'}$${Math.abs(value).toFixed(2)}`;
        text.textContent = `Ordinary crop $${q.ordinaryValue.toFixed(2)} · market ${signed(q.marketEffect)} · rarity ${signed(q.rarityBonus)}${q.farmBonus ? ' · farm ' + signed(q.farmBonus) : ''}. Cost $${q.cost.toFixed(2)}; net ${signed(q.profit)}. Holding keeps your crop, but uses this growing tile.`;
        details.append(summary, text);
        panel.appendChild(details);
      }

      const chipRow = document.createElement('div');
      chipRow.className = 'market-insight-row';
      const rarityChip = document.createElement('span');
      if (gridInsight.isProduce) {
        const rarityLabel = String(gridInsight.rarity || 'unknown');
        const rarityClass = rarityLabel === 'unknown' ? '' : ` rarity-${rarityLabel}`;
        rarityChip.className = `insight-chip insight-rarity-chip${rarityClass}`;
        rarityChip.textContent = `Rarity: ${rarityLabel === 'unknown' ? 'Unknown' : (rarityLabel.charAt(0).toUpperCase() + rarityLabel.slice(1))}`;
      } else {
        const typeLabel = String(gridInsight.itemType || gridInsight.tableKey || 'item');
        rarityChip.className = 'insight-chip';
        rarityChip.textContent = `Type: ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}`;
      }
      chipRow.appendChild(rarityChip);

      const stageChip = document.createElement('span');
      stageChip.className = `insight-chip${gridInsight.canSell ? ' good' : ''}`;
      stageChip.textContent = gridInsight.isProduce
        ? (gridInsight.canSell
        ? 'Ready to sell'
        : `Growing (${gridInsight.growth.daysLeft} day${gridInsight.growth.daysLeft === 1 ? '' : 's'} left)`)
        : `Resale: ${gridInsight.resaleRatePct || 80}%`;
      chipRow.appendChild(stageChip);
      if (gridInsight.isProduce && gridInsight.fertiliser?.hasAny) {
        const stacks = gridInsight.fertiliser.stacks || {};
        const stackParts = [];
        if (Number(stacks.waterRetention) > 0) stackParts.push(`Water Retention x${Number(stacks.waterRetention)}`);
        if (Number(stacks.speedGrow) > 0) stackParts.push(`Speed Grow x${Number(stacks.speedGrow)}`);
        if (Number(stacks.quality) > 0) stackParts.push(`Quality x${Number(stacks.quality)}`);
        if (stackParts.length) {
          const fertChip = document.createElement('span');
          fertChip.className = 'insight-chip';
          fertChip.textContent = `Fertiliser: ${stackParts.join(', ')}`;
          chipRow.appendChild(fertChip);
        }
        if (Number(gridInsight.fertiliser.waterRetentionDays) > 0) {
          const waterChip = document.createElement('span');
          waterChip.className = 'insight-chip';
          waterChip.textContent = `Stays watered: +${Number(gridInsight.fertiliser.waterRetentionDays)} day${Number(gridInsight.fertiliser.waterRetentionDays) === 1 ? '' : 's'}`;
          chipRow.appendChild(waterChip);
        }
        if (Number(gridInsight.fertiliser.speedGrowDays) > 0) {
          const speedChip = document.createElement('span');
          speedChip.className = 'insight-chip';
          speedChip.textContent = `Growth reduction: -${Number(gridInsight.fertiliser.speedGrowDays)} day${Number(gridInsight.fertiliser.speedGrowDays) === 1 ? '' : 's'}`;
          chipRow.appendChild(speedChip);
        }
        if (Number(gridInsight.fertiliser.qualityStacks) > 0) {
          const qualityChip = document.createElement('span');
          qualityChip.className = 'insight-chip';
          const mythicPct = Number(gridInsight.fertiliser.qualityMythicPercent);
          qualityChip.textContent = Number.isFinite(mythicPct)
            ? `Quality: Mythic ${mythicPct.toFixed(2)}%`
            : `Quality: +${Number(gridInsight.fertiliser.qualityStacks) * 5}% upward shift`;
          chipRow.appendChild(qualityChip);
        }
      }
      if (!gridInsight.isProduce && gridInsight.tankCapacity !== null) {
        const tankChip = document.createElement('span');
        tankChip.className = 'insight-chip';
        tankChip.textContent = `Tank days: ${Number(gridInsight.tankCurrent || 0)}/${Number(gridInsight.tankCapacity || 0)}`;
        chipRow.appendChild(tankChip);
        if (String(gridInsight.itemType || '') === 'sprinkler') {
          const dawnChip = document.createElement('span');
          dawnChip.className = 'insight-chip';
          dawnChip.textContent = 'Waters at dawn (adjacent, skips grown crops, uses 1 day when active)';
          chipRow.appendChild(dawnChip);
        }
        if (
          String(gridInsight.itemType || '') === 'sprinkler'
          && typeof window !== 'undefined'
          && window.__etmDebugSprinklerConfig === true
        ) {
          const debugChip = document.createElement('span');
          debugChip.className = 'insight-chip';
          debugChip.textContent = `Dbg L${Number(gridInsight.sprinklerLevel || 1)} R${Number(gridInsight.sprinklerRadius || 1)} E${Number(gridInsight.sprinklerEfficiencyLevel || 1)}`;
          chipRow.appendChild(debugChip);
        }
      }

      const sellButton = document.createElement('button');
      sellButton.type = 'button';
      sellButton.className = 'button';
      sellButton.textContent = isSellBatchInFlight ? 'Selling…' : gridInsight.canSell ? `Sell Selected ($${gridInsight.sellNow.toFixed(2)})` : 'Sell Selected (Locked)';
      sellButton.disabled = !gridInsight.canSell || isSellBatchInFlight;
      if (gridInsight.canSell) {
        sellButton.dataset.sellActionButton = 'true';
      }
      sellButton.addEventListener('click', () => {
        sellSelectedGridItem(sellButton);
      });
      const actionRow = document.createElement('div');
      actionRow.className = 'market-insight-row';
      actionRow.appendChild(sellButton);
      panel.appendChild(actionRow);
      const profile = document.createElement('details');
      profile.className = 'crop-outlook-details';
      const profileTitle = document.createElement('summary');
      profileTitle.textContent = gridInsight.isProduce ? 'Crop details' : 'Item details';
      profile.appendChild(profileTitle);
      profile.appendChild(chipRow);
      if (gridInsight.isDish) {
        const recipeNote = document.createElement('p');
        recipeNote.className = 'market-context';
        recipeNote.textContent = 'Meal value is fixed at 115% of base ingredient values, with their crop quality and farm bonuses included once. Market peaks may favour selling ingredients. Meal quality is descriptive; it adds no second bonus.'
          + (gridInsight.quote?.historicalCostUnknown ? ' Older ingredient treatment costs are unknown; profit uses recorded costs only.' : '');
        profile.appendChild(recipeNote);
      }
      panel.appendChild(profile);
      if (gridInsight.isProduce && gridInsight.identityLabels) {
        const identityRow = document.createElement('div');
        identityRow.className = 'market-insight-row';
        [
          gridInsight.identityLabels.cycle,
          gridInsight.identityLabels.family,
          'Noise: ' + gridInsight.identityLabels.noise,
          'Shock: ' + gridInsight.identityLabels.shock,
          'Rarity: ' + gridInsight.identityLabels.rarity
        ].forEach((label) => {
          const chip = document.createElement('span');
          chip.className = 'insight-chip';
          chip.textContent = label;
          identityRow.appendChild(chip);
        });
        profile.appendChild(identityRow);
      }
      if (gridInsight.isProduce && gridInsight.identitySummary) {
        const summaryRow = document.createElement('div');
        summaryRow.className = 'market-insight-row';
        const summaryChip = document.createElement('span');
        summaryChip.className = 'insight-chip';
        summaryChip.textContent = gridInsight.identitySummary;
        summaryRow.appendChild(summaryChip);
        profile.appendChild(summaryRow);
      }
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

    if (!shopInsight.isProduce) {
      panel.appendChild(createInsightHeader(`${shopInsight.itemName} usage`, clearCurrentInfoSelection));
      const isFertiliser = String(shopInsight.itemType || '') === 'fertiliser';
      const metricGrid = document.createElement('div');
      metricGrid.className = 'market-insight-grid';
      const rows = isFertiliser ? [
        ['Per application', `$${shopInsight.buyPrice.toFixed(2)}`, ''],
        ['Application', '1 energy', ''],
        ['Lasts for', 'This crop', ''],
        ['Target', 'Growing crop', '']
      ] : [
        ['Buy Price', `$${shopInsight.buyPrice.toFixed(2)}`, ''],
        ['Resale (80%)', `$${shopInsight.resaleValue.toFixed(2)}`, ''],
        ['Net on Sell', `${shopInsight.projectedDelta >= 0 ? '+' : ''}$${shopInsight.projectedDelta.toFixed(2)}`, shopInsight.projectedDelta >= 0 ? 'good' : 'bad'],
        ['Placement', 'Select then place on grid', '']
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
      if (gridInsight?.isProduce && gridInsight.canSell && gridInsight.quote) {
        const details = document.createElement('details');
        details.className = 'sale-breakdown';
        const summary = document.createElement('summary');
        summary.textContent = 'Why this sale value?';
        const text = document.createElement('p');
        const q = gridInsight.quote;
        const signed = value => `${value >= 0 ? '+' : '−'}$${Math.abs(value).toFixed(2)}`;
        text.textContent = `Ordinary crop $${q.ordinaryValue.toFixed(2)} · market ${signed(q.marketEffect)} · rarity ${signed(q.rarityBonus)}${q.farmBonus ? ' · farm ' + signed(q.farmBonus) : ''}. Cost $${q.cost.toFixed(2)}; net ${signed(q.profit)}. Holding keeps your crop, but uses this growing tile.`;
        details.append(summary, text);
        panel.appendChild(details);
      }
      const chipRow = document.createElement('div');
      chipRow.className = 'market-insight-row';
      const typeChip = document.createElement('span');
      typeChip.className = 'insight-chip';
      const typeLabel = String(shopInsight.itemType || shopInsight.tableKey || 'item');
      typeChip.textContent = `Type: ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}`;
      chipRow.appendChild(typeChip);
      const resaleChip = document.createElement('span');
      resaleChip.className = 'insight-chip';
      resaleChip.textContent = isFertiliser ? 'Consumed on application · adds to crop cost' : `Resale rate: ${shopInsight.resaleRatePct || 80}%`;
      chipRow.appendChild(resaleChip);
      if (String(shopInsight.itemType || '') === 'sprinkler') {
        const dawnChip = document.createElement('span');
        dawnChip.className = 'insight-chip';
        dawnChip.textContent = 'Waters at dawn (adjacent, skips grown crops, uses 1 day when active)';
        chipRow.appendChild(dawnChip);
      }
      if (
        String(shopInsight.itemType || '') === 'sprinkler'
        && typeof window !== 'undefined'
        && window.__etmDebugSprinklerConfig === true
      ) {
        const debugChip = document.createElement('span');
        debugChip.className = 'insight-chip';
        debugChip.textContent = `Dbg L${Number(shopInsight.sprinklerLevel || 1)} R${Number(shopInsight.sprinklerRadius || 1)} E${Number(shopInsight.sprinklerEfficiencyLevel || 1)}`;
        chipRow.appendChild(debugChip);
      }
      panel.appendChild(chipRow);
      if (shopInsight.description) {
        const descRow = document.createElement('div');
        descRow.className = 'market-insight-row';
        const descChip = document.createElement('span');
        descChip.className = 'insight-chip';
        descChip.textContent = shopInsight.description;
        descRow.appendChild(descChip);
        panel.appendChild(descRow);
      }
      return;
    }

    panel.appendChild(createInsightHeader(`${shopInsight.itemName} seed`, clearCurrentInfoSelection));
    appendMarketContext(panel, shopInsight);
    const quick = document.createElement('div');
    quick.className = 'market-insight-grid seed-summary';
    for (const [label, value] of [
      ['Seed cost', shopInsight.effectiveCost === 0 ? 'Free' : `$${shopInsight.effectiveCost.toFixed(2)}`],
      [shopInsight.introductoryGrowth ? 'First carrot' : 'Growth', `${shopInsight.growthDays} watered days`]
    ]) {
      const metric = document.createElement('div');
      metric.className = 'market-insight-metric';
      const labelEl = document.createElement('span');
      labelEl.className = 'metric-label';
      labelEl.textContent = label;
      const valueEl = document.createElement('span');
      valueEl.className = 'metric-value';
      valueEl.textContent = value;
      metric.append(labelEl, valueEl);
      quick.appendChild(metric);
    }
    panel.appendChild(quick);
    if (isMobileLayout) {
      const farm = document.createElement('button');
      farm.type = 'button';
      farm.className = 'button seed-farm-action';
      farm.textContent = 'Go to Farm →';
      farm.addEventListener('click', () => document.getElementById('tab-farm-mobile')?.click());
      panel.appendChild(farm);
    }
    const outlook = document.createElement('details');
    outlook.className = 'crop-outlook-details';
    const outlookTitle = document.createElement('summary');
    outlookTitle.textContent = 'Price estimates & crop details';
    outlook.appendChild(outlookTitle);
    panel.appendChild(outlook);
    const growthNote = document.createElement('p');
    growthNote.className = 'market-context';
    growthNote.textContent = `${shopInsight.introductoryGrowth ? 'Only your first carrot grows in 2 watered days. Normal carrots take 6. ' : ''}Farm ${shopInsight.farmId || 1}${Number(shopInsight.farmMultiplier) > 1 ? ' · 2× sale value' : ''}. Estimates use today’s price and average rarity, before any future treatments. Prices at harvest can rise or fall; these returns are not guaranteed.`;
    outlook.appendChild(growthNote);
    const metricGrid = document.createElement('div');
    metricGrid.className = 'market-insight-grid';
    const rows = [
      ['Buy Price', `$${shopInsight.buyPrice.toFixed(2)}`, ''],
      ['Effective Cost', `$${shopInsight.effectiveCost.toFixed(2)}`, shopInsight.effectiveCost === 0 ? 'good' : ''],
      ['Sale if price stays (rarity average)', `$${shopInsight.expectedSale.toFixed(2)}`, ''],
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
    outlook.appendChild(metricGrid);

    const chipRow = document.createElement('div');
    chipRow.className = 'market-insight-row';
    const safetyChip = document.createElement('span');
    safetyChip.className = `insight-chip${shopInsight.guaranteedDelta >= 0 ? ' good' : ' bad'}`;
    safetyChip.textContent = `Common at today’s price: ${shopInsight.guaranteedDelta >= 0 ? '+' : ''}$${shopInsight.guaranteedDelta.toFixed(2)}`;
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
    outlook.appendChild(chipRow);
    if (shopInsight.identityLabels) {
      const identityRow = document.createElement('div');
      identityRow.className = 'market-insight-row';
      [
        shopInsight.identityLabels.cycle,
        shopInsight.identityLabels.family,
        'Noise: ' + shopInsight.identityLabels.noise,
        'Shock: ' + shopInsight.identityLabels.shock,
        'Rarity: ' + shopInsight.identityLabels.rarity
      ].forEach((label) => {
        const chip = document.createElement('span');
        chip.className = 'insight-chip';
        chip.textContent = label;
        identityRow.appendChild(chip);
      });
      outlook.appendChild(identityRow);
    }
    if (shopInsight.identitySummary) {
      const summaryRow = document.createElement('div');
      summaryRow.className = 'market-insight-row';
      const summaryChip = document.createElement('span');
      summaryChip.className = 'insight-chip';
      summaryChip.textContent = shopInsight.identitySummary;
      summaryRow.appendChild(summaryChip);
      outlook.appendChild(summaryRow);
    }
  }

  const selectionKey = bulkInsight && bulkInsight.count > 0
    ? `batch:${bulkInsight.cells.map(cell => cell.cellIndex).join(',')}`
    : gridInsight ? `crop:${gridInsight.cellIndex}` : shopInsight ? `seed:${shopInsight.itemName}` : 'empty';
  panels.forEach((panel) => {
    // Layout refreshes should not close a disclosure the player is reading.
    const openDetails = panel.dataset.insightSelection === selectionKey
      ? new Set(Array.from(panel.querySelectorAll('details[open] > summary'), summary => summary.textContent))
      : new Set();
    renderIntoPanel(panel);
    const tool = document.querySelector?.('.farm-toolbar [data-tool].active');
    if (tool && !shopInsight) {
      const active = document.createElement('p'); active.className = 'active-tool-summary';
      const kind = tool.getAttribute('data-tool');
      active.textContent = `Tool: ${tool.textContent.trim()}${kind === 'watering' ? ' · Tap a growing crop to water; 1 energy.' : kind === 'pickaxe' ? ' · Tap locked soil to mine.' : ''}`;
      panel.prepend(active);
    }
    if (shopInsight) {
      const paid = document.createElement('div');
      paid.className = 'active-commitment';
      const applying = shopInsight.itemType === 'fertiliser';
      const cost = shopInsight.effectiveCost ?? shopInsight.buyPrice;
      paid.textContent = `${applying ? 'Apply' : shopInsight.isProduce ? 'Plant' : 'Place'} ${shopInsight.itemName} · ${cost === 0 ? 'Free' : '$' + cost.toFixed(2)} per use${applying ? ' · 1 energy' : ''}${shopInsight.freeCount ? ' · ' + shopInsight.freeCount + ' free remaining' : ''}. `;
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.textContent = applying ? 'Cancel application' : shopInsight.isProduce ? 'Cancel planting' : 'Cancel placement';
      cancel.onclick = clearShopSelection || clearCurrentInfoSelection;
      paid.append(cancel); panel.prepend(paid);
    }
    if (bulkInsight?.cells?.length) {
      const names = document.createElement('p'); names.className = 'selection-names';
      names.textContent = bulkInsight.cells.map(cell => cell.itemName || cell.item?.name || 'Item').join(' · ');
      panel.prepend(names);
    }

    panel.dataset.insightSelection = selectionKey;
    panel.querySelectorAll('details').forEach(detail => {
      detail.open = openDetails.has(detail.querySelector('summary')?.textContent);
    });
  });
}
