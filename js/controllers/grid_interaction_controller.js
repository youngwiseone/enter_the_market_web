import { isProduceItem } from '../content/item_types.js';

export function getGridIndexFromPointerEventAction(event, getElementFromPoint) {
  if (!(event && typeof event === 'object')) return null;
  let targetCell = null;
  if (event.target instanceof Element) {
    targetCell = event.target.closest('.grid-cell');
  }
  if (!targetCell && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
    const hovered = getElementFromPoint(event.clientX, event.clientY);
    if (hovered instanceof Element) {
      targetCell = hovered.closest('.grid-cell');
    }
  }
  if (!targetCell) return null;
  const index = Number(targetCell.getAttribute('data-index'));
  return Number.isInteger(index) ? index : null;
}

export function applyGridActionForIndexAction(deps) {
  const {
    state,
    index,
    mode,
    TOOL_PICKAXE,
    TOOL_WATERING,
    TOOL_GLOVE,
    selectedShopItemId,
    isFarmActionBlocked,
    mineGridTile,
    waterGridTile,
    addGridCellToBulkSelection,
    selectGridCell,
    purchaseAndPlaceSelected,
    addMessage,
    setChatProfile
  } = deps;

  if (isFarmActionBlocked()) return false;
  const isDragMode = mode === 'drag';
  const allowInfoSelection = !isDragMode;
  if (!Array.isArray(state.gridUnlocked) || !Array.isArray(state.gridItems)) return false;
  if (index < 0 || index >= state.gridUnlocked.length || index >= state.gridItems.length) return false;

  const unlockedNow = !!state.gridUnlocked[index];
  if (state.activeTool === TOOL_PICKAXE) {
    if (!unlockedNow) {
      const didMessage = mineGridTile(index);
      if (!didMessage) setChatProfile('player', 'neutral');
      return true;
    }
    setChatProfile('player', 'neutral');
    return false;
  }

  if (state.activeTool === TOOL_WATERING) {
    if (!unlockedNow) {
      if (mode !== 'drag') {
        addMessage({ id: 'progress.tile_locked_mine_first' });
      }
      return false;
    }
    const didMessage = waterGridTile(index);
    if (!didMessage) setChatProfile('player', 'neutral');
    return true;
  }

  if (!unlockedNow) {
    if (mode !== 'drag') {
      addMessage({ id: 'progress.use_pickaxe_to_mine' });
    }
    return false;
  }

  if (state.gridItems[index]) {
    if (isDragMode && !selectedShopItemId && state.activeTool === TOOL_GLOVE) {
      if (addGridCellToBulkSelection(index)) {
        return true;
      }
      return false;
    }
    if (allowInfoSelection) {
      selectGridCell(index);
      return true;
    }
    return false;
  }

  if (selectedShopItemId) {
    purchaseAndPlaceSelected(index);
    return true;
  }

  if (mode !== 'drag') {
    addMessage({ id: 'progress.select_item_first' });
  }
  return false;
}

export function getGridCellSellSnapshotAction(deps) {
  const {
    state,
    cellIndex,
    getPlantGrowthState,
    getGridRarity,
    getRarityMultiplier,
    getActiveFarmSellMultiplier
  } = deps;

  if (!Array.isArray(state.gridItems) || cellIndex < 0 || cellIndex >= state.gridItems.length) return null;
  const itemId = state.gridItems[cellIndex];
  if (!itemId) return null;
  const item = Array.isArray(state.items) ? state.items.find((it) => it.id === itemId) : null;
  const shopEntry = Array.isArray(state.shop) ? state.shop.find((entry) => entry.itemId === itemId) : null;
  if (!item) return null;
  const isProduce = isProduceItem(item);
  if (!isProduce) {
    const buyPrice = Array.isArray(state.gridPurchasePrice)
      ? Math.max(0, Number(state.gridPurchasePrice[cellIndex]) || 0)
      : 0;
    const fallbackBase = Math.max(0, Number(item.price) || 0);
    const basis = buyPrice > 0 ? buyPrice : fallbackBase;
    const sellNow = basis * 0.8;
    return {
      cellIndex,
      itemId,
      item,
      rarity: null,
      sellNow,
      buyPrice,
      profitNow: sellNow - buyPrice,
      isProduce: false
    };
  }
  if (!shopEntry) return null;
  const growth = getPlantGrowthState(item, cellIndex);
  if (!growth.isGrown) return null;
  const rarity = getGridRarity(cellIndex) || 'common';
  const multiplier = getRarityMultiplier(rarity);
  const sellNow = Math.max(0, Number(shopEntry.price) || 0) * multiplier * getActiveFarmSellMultiplier();
  const buyPrice = Array.isArray(state.gridPurchasePrice)
    ? Math.max(0, Number(state.gridPurchasePrice[cellIndex]) || 0)
    : 0;
  return {
    cellIndex,
    itemId,
    item,
    rarity,
    sellNow,
    buyPrice,
    profitNow: sellNow - buyPrice,
    isProduce: true
  };
}

export function addGridCellToBulkSelectionAction(deps) {
  const {
    cellIndex,
    selectedGridCellIndices,
    getGridCellSellSnapshot,
    setSelectedGridCellIndex,
    renderMarket
  } = deps;

  const snapshot = getGridCellSellSnapshot(cellIndex);
  if (!snapshot) return false;
  if (selectedGridCellIndices.has(cellIndex)) return false;
  selectedGridCellIndices.add(cellIndex);
  setSelectedGridCellIndex(null);
  renderMarket();
  return true;
}

export function clearBulkGridSelectionAction(deps) {
  const { selectedGridCellIndices, shouldRefresh = false, renderMarket } = deps;
  if (!selectedGridCellIndices.size) return;
  selectedGridCellIndices.clear();
  if (shouldRefresh) {
    renderMarket();
  }
}

export function getBulkSelectedGridInsightDataAction(deps) {
  const {
    state,
    selectedGridCellIndices,
    getGridCellSellSnapshot
  } = deps;

  if (!selectedGridCellIndices.size) return null;
  const cells = [];
  selectedGridCellIndices.forEach((index) => {
    const snapshot = getGridCellSellSnapshot(index);
    if (snapshot) cells.push(snapshot);
  });
  if (!cells.length) return null;
  cells.sort((left, right) => left.cellIndex - right.cellIndex);
  const totalSale = cells.reduce((sum, cell) => sum + cell.sellNow, 0);
  const totalBuy = cells.reduce((sum, cell) => sum + cell.buyPrice, 0);
  const totalProfit = totalSale - totalBuy;
  const byItem = new Map();
  cells.forEach((cell) => {
    const key = String(cell.itemId);
    byItem.set(key, (byItem.get(key) || 0) + 1);
  });
  const itemBreakdown = Array.from(byItem.entries()).map(([itemIdText, qty]) => {
    const item = state.items.find((it) => String(it.id) === String(itemIdText));
    return `${item ? item.name : 'Item'} x${qty}`;
  });
  return {
    cells,
    count: cells.length,
    totalSale,
    totalBuy,
    totalProfit,
    itemBreakdown
  };
}

export function selectGridCellAction(deps) {
  const {
    state,
    cellIndex,
    selectedGridCellIndices,
    getSelectedGridCellIndex,
    setSelectedGridCellIndex,
    setSelectedShopItemId,
    setSelectionPulseId,
    updateCursorForTool,
    renderMarket
  } = deps;

  if (!Array.isArray(state.gridItems) || cellIndex < 0 || cellIndex >= state.gridItems.length) return;
  if (!state.gridItems[cellIndex]) return;
  if (getSelectedGridCellIndex() === cellIndex) return;
  selectedGridCellIndices.clear();
  setSelectedGridCellIndex(cellIndex);
  setSelectedShopItemId(null);
  setSelectionPulseId(null);
  updateCursorForTool();
  renderMarket();
}

export function clearGridSelectionAction(deps) {
  const {
    selectedGridCellIndices,
    getSelectedGridCellIndex,
    setSelectedGridCellIndex,
    shouldRefresh = false,
    renderMarket
  } = deps;
  if (getSelectedGridCellIndex() === null && selectedGridCellIndices.size === 0) return;
  setSelectedGridCellIndex(null);
  selectedGridCellIndices.clear();
  if (shouldRefresh) {
    renderMarket();
  }
}

export function selectShopItemAction(deps) {
  const {
    state,
    itemId,
    isShopItemUnlocked,
    addMessage,
    getSelectedShopItemId,
    setSelectedShopItemId,
    clearGridSelection,
    setSelectionPulseId,
    setActiveTool,
    TOOL_GLOVE,
    getFreePurchaseCount,
    updateCursorForTool,
    renderMarket,
    guidedSelectedFlag
  } = deps;

  if (!isShopItemUnlocked(itemId)) {
    addMessage({ id: 'progress.item_not_available' });
    return;
  }
  if (getSelectedShopItemId() === itemId) {
    setSelectedShopItemId(null);
    updateCursorForTool();
    renderMarket();
    return;
  }
  clearGridSelection();
  setSelectedShopItemId(itemId);
  if (state.goalFlags && typeof state.goalFlags === 'object') {
    state.goalFlags[guidedSelectedFlag] = true;
  }
  setSelectionPulseId(itemId);
  setActiveTool(TOOL_GLOVE);
  const freeCount = getFreePurchaseCount(itemId);
  if (freeCount > 0) {
    const item = state.items.find((it) => it.id === itemId);
    addMessage({
      id: 'tips.free_purchases_left',
      vars: {
        freeCount,
        suffix: freeCount === 1 ? '' : 's',
        itemName: item ? item.name : 'this item'
      },
      meta: {
        speaker: 'merchant',
        category: 'tips',
        priority: 'low',
        replaceKey: 'tip:free-purchase'
      }
    });
  }
  updateCursorForTool();
  renderMarket();
}

export function clearShopSelectionAction(deps) {
  const {
    getSelectedShopItemId,
    setSelectedShopItemId,
    setSelectionPulseId,
    updateCursorForTool,
    renderMarket
  } = deps;
  if (!getSelectedShopItemId()) return;
  setSelectedShopItemId(null);
  setSelectionPulseId(null);
  updateCursorForTool();
  renderMarket();
}
