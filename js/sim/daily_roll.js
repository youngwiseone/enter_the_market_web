export function getFatigueFromEnergyState(state) {
  const energyMax = Math.max(1, Number(state.player?.energyMax) || 1);
  const energy = Math.max(0, Math.min(energyMax, Number(state.player?.energy) || 0));
  const energyRatio = energy / energyMax;
  const impactMultiplier = Math.max(0, 1 - energyRatio);
  const fatiguePercent = Math.round(energyRatio * 100);
  return { fatiguePercent, impactMultiplier, energy, energyMax };
}

function getUnlockedRollItems(state, isShopItemUnlocked) {
  if (!Array.isArray(state.items)) return [];
  return state.items.filter((item) => item && isShopItemUnlocked(item.id));
}

function getRollStoryForItem(itemName, defaultNewsEvents) {
  const templates = Array.isArray(defaultNewsEvents) ? defaultNewsEvents : [];
  if (!templates.length) {
    return {
      headline: `Market focus: ${itemName}`,
      article: `${itemName} traders report unusual activity into the next rest cycle.`
    };
  }
  const template = templates[Math.floor(Math.random() * templates.length)];
  const headline = String(template?.headline || `Market focus: ${itemName}`).replace(/sku/gi, itemName);
  const article = String(template?.article || `${itemName} traders report unusual activity.`).replace(/sku/gi, itemName);
  return { headline, article };
}

function pickRollItemByWeight(unlockedItems, getDailyRollItemWeight) {
  if (!Array.isArray(unlockedItems) || unlockedItems.length === 0) return null;
  const weighted = unlockedItems.map((item) => ({
    item,
    weight: Math.max(0.01, Number(getDailyRollItemWeight(item.id)) || 1)
  }));
  const total = weighted.reduce((sum, row) => sum + row.weight, 0);
  if (total <= 0) return unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
  let roll = Math.random() * total;
  for (const row of weighted) {
    roll -= row.weight;
    if (roll <= 0) {
      return row.item;
    }
  }
  return weighted[weighted.length - 1].item;
}

export function generateDailyMarketRollState(deps) {
  const {
    state,
    impactMultiplier = 1,
    isShopItemUnlocked,
    getDailyRollItemWeight,
    getMarketDirectionalBias,
    clampMarketBias,
    getHarvestImagePath,
    defaultNewsEvents
  } = deps;

  const unlockedItems = getUnlockedRollItems(state, isShopItemUnlocked);
  if (unlockedItems.length === 0) {
    return { picks: [], byItem: new Map() };
  }
  const picks = [];
  for (let i = 0; i < 3; i += 1) {
    const target = pickRollItemByWeight(unlockedItems, getDailyRollItemWeight)
      || unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
    const bias = getMarketDirectionalBias(target.id);
    const upChance = clampMarketBias(0.5 + (bias.upward * 0.35) - (bias.downward * 0.4), 0.1, 0.9);
    const sign = Math.random() < upChance ? 1 : -1;
    const baseMagnitude = 6 + Math.floor(Math.random() * 8);
    const story = getRollStoryForItem(target.name, defaultNewsEvents);
    picks.push({
      itemId: target.id,
      itemName: target.name,
      harvestImage: getHarvestImagePath(target),
      impactPct: sign * baseMagnitude,
      storyHeadline: story.headline,
      storyBody: story.article,
      stackCount: 1,
      finalImpactPct: 0
    });
  }
  const grouped = new Map();
  picks.forEach((pick) => {
    const key = pick.itemId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        itemId: pick.itemId,
        itemName: pick.itemName,
        hits: 0,
        baseSumPct: 0,
        totalImpactPct: 0,
        adjustedImpactPct: 0
      });
    }
    const row = grouped.get(key);
    row.hits += 1;
    row.baseSumPct += pick.impactPct;
  });
  grouped.forEach((row) => {
    const bonusMultiplier = 1 + (Math.max(0, row.hits - 1) * 0.25);
    row.totalImpactPct = row.baseSumPct * bonusMultiplier;
    row.adjustedImpactPct = row.totalImpactPct * impactMultiplier;
  });
  picks.forEach((pick) => {
    const row = grouped.get(pick.itemId);
    if (!row) return;
    pick.stackCount = row.hits;
    pick.finalImpactPct = row.adjustedImpactPct;
  });
  return { picks, byItem: grouped };
}

export function applyDailyMarketRollToShopState(deps) {
  const {
    state,
    rollResult,
    isShopItemUnlocked,
    ensureShopEntryMarketFields,
    isShopEntryPriceRecoveryActive
  } = deps;

  if (!rollResult || !(rollResult.byItem instanceof Map)) return;
  state.shop.forEach((entry) => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    ensureShopEntryMarketFields(entry);
    if (isShopEntryPriceRecoveryActive(entry)) return;
    const effect = rollResult.byItem.get(entry.itemId);
    if (!effect) return;
    const factor = 1 + (effect.adjustedImpactPct / 100);
    entry.price *= Math.max(0.1, factor);
  });
}

export function getDailyRollSummaryTextState(rollResult, fatiguePercent = 0) {
  if (!rollResult || !(rollResult.byItem instanceof Map) || rollResult.byItem.size === 0) {
    return 'No market shifts rolled.';
  }
  const parts = [];
  Array.from(rollResult.byItem.values()).forEach((effect) => {
    const sign = effect.adjustedImpactPct >= 0 ? '+' : '';
    const stackText = effect.hits > 1 ? ` x${effect.hits}` : '';
    parts.push(`${effect.itemName} ${sign}${effect.adjustedImpactPct.toFixed(0)}%${stackText}`);
  });
  const fatigueText = `Fatigue ${Math.max(0, Math.min(100, Math.round(fatiguePercent)))}%`;
  return `${fatigueText} | ${parts.join(' | ')}`;
}

export function getBestRollOpportunityTextState(rollResult) {
  if (!rollResult || !(rollResult.byItem instanceof Map) || rollResult.byItem.size === 0) {
    return 'No major market shift this day.';
  }
  const ranked = Array.from(rollResult.byItem.values())
    .sort((a, b) => (Number(b.adjustedImpactPct) || 0) - (Number(a.adjustedImpactPct) || 0));
  const best = ranked[0];
  if (!best) return 'No major market shift this day.';
  const impact = Number(best.adjustedImpactPct) || 0;
  const sign = impact >= 0 ? '+' : '';
  return `Next opportunity: watch ${best.itemName} (${sign}${impact.toFixed(0)}% roll impact).`;
}
