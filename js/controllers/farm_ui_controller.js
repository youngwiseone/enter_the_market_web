import { resolveResourcePath } from '../content/resource_paths.js';
import { getItemBehavior } from '../content/item_types.js';

export function updateFarmToggleButtonAction(deps) {
  const {
    state,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    GRID_CELL_COUNT,
    FARM_TWO_BUTTON_REVEAL_TILES_LEFT,
    FARM_TWO_PURCHASE_COST,
    getUnlockedTileCountForFarm,
    isFarmTwoPurchased,
    isFarmOneFullyUnlocked,
    getFarmToggleButton
  } = deps;

  const button = getFarmToggleButton();
  if (!button) return;
  const label = button.querySelector('.tool-label');
  const unlockedOnFarmOne = getUnlockedTileCountForFarm(FARM_PRIMARY_ID);
  const revealThreshold = Math.max(0, GRID_CELL_COUNT - FARM_TWO_BUTTON_REVEAL_TILES_LEFT);
  const shouldShow = isFarmTwoPurchased() || unlockedOnFarmOne >= revealThreshold;
  button.style.display = shouldShow ? '' : 'none';
  if (!shouldShow) {
    return;
  }
  if (!isFarmOneFullyUnlocked()) {
    if (label) label.textContent = 'Farm 2';
    button.title = `Unlock Farm 1 first (${unlockedOnFarmOne}/${GRID_CELL_COUNT})`;
    button.classList.remove('active');
    return;
  }
  if (!isFarmTwoPurchased()) {
    if (label) label.textContent = 'Buy F2';
    button.title = `Buy Farm 2 for $${FARM_TWO_PURCHASE_COST.toFixed(2)}`;
    button.classList.remove('active');
    return;
  }
  const destinationFarm = state.activeFarmId === FARM_PRIMARY_ID ? FARM_SECONDARY_ID : FARM_PRIMARY_ID;
  if (label) label.textContent = `To F${destinationFarm}`;
  button.title = `Switch to Farm ${destinationFarm}`;
  button.classList.toggle('active', state.activeFarmId === FARM_SECONDARY_ID);
}

export function setActiveFarmAction(deps) {
  const {
    state,
    farmId,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    isFarmTwoPurchased,
    applyFarmStateToActiveGrid,
    setSelectedGridCellIndex,
    selectedGridCellIndices,
    setSelectedShopItemId,
    setSelectionPulseId,
    stopFarmPointerInteraction,
    saveState,
    renderAll
  } = deps;

  const safeFarmId = Number(farmId) === FARM_SECONDARY_ID ? FARM_SECONDARY_ID : FARM_PRIMARY_ID;
  if (safeFarmId === FARM_SECONDARY_ID && !isFarmTwoPurchased()) return false;
  if (state.activeFarmId === safeFarmId) return false;
  applyFarmStateToActiveGrid(safeFarmId);
  setSelectedGridCellIndex(null);
  selectedGridCellIndices.clear();
  setSelectedShopItemId(null);
  setSelectionPulseId(null);
  stopFarmPointerInteraction();
  saveState();
  renderAll();
  return true;
}

export function handleFarmToggleButtonClickAction(deps) {
  const {
    state,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    GRID_CELL_COUNT,
    FARM_TWO_PURCHASE_COST,
    isFarmOneFullyUnlocked,
    getUnlockedTileCountForFarm,
    addMessage,
    isFarmTwoPurchased,
    normalizeFarmState,
    setActiveFarm,
    pulseHud,
    confirmDialog
  } = deps;

  if (!isFarmOneFullyUnlocked()) {
    const unlockedOnFarmOne = getUnlockedTileCountForFarm(FARM_PRIMARY_ID);
    addMessage({
      id: 'progress.unlock_farm1_first',
      vars: { unlockedOnFarmOne, gridCellCount: GRID_CELL_COUNT },
      meta: {
        speaker: 'player',
        emotion: 'neutral',
        category: 'progress',
        priority: 'normal'
      }
    });
    return;
  }
  if (!isFarmTwoPurchased()) {
    const confirmed = confirmDialog(`Buy Farm 2 for $${FARM_TWO_PURCHASE_COST.toFixed(2)}?`);
    if (!confirmed) return;
    if ((Number(state.player?.cash) || 0) < FARM_TWO_PURCHASE_COST) {
      addMessage({
        id: 'warning.not_enough_cash_farm2',
        vars: { cost: FARM_TWO_PURCHASE_COST.toFixed(2) },
        meta: {
          speaker: 'player',
          emotion: 'wrong',
          category: 'progress',
          priority: 'high'
        }
      });
      return;
    }
    state.player.cash -= FARM_TWO_PURCHASE_COST;
    state.secondFarmPurchased = true;
    state.farms[FARM_SECONDARY_ID] = normalizeFarmState(state.farms[FARM_SECONDARY_ID]);
    addMessage({
      id: 'progress.farm2_purchased',
      meta: {
        speaker: 'farmer',
        emotion: 'excited',
        category: 'progress',
        priority: 'high'
      }
    });
    setActiveFarm(FARM_SECONDARY_ID);
    pulseHud(false);
    return;
  }
  const nextFarmId = state.activeFarmId === FARM_PRIMARY_ID ? FARM_SECONDARY_ID : FARM_PRIMARY_ID;
  setActiveFarm(nextFarmId);
}

export function updateToolButtonsAction(deps) {
  const {
    state,
    TOOL_GLOVE,
    TOOL_WATERING,
    TOOL_PICKAXE,
    isToolUnlocked,
    getToolDisplayName,
    updateFarmToggleButton,
    getDesktopShortcutsEnabled,
    setDesktopShortcutsClass,
    getToolButtons,
    getRestButton,
    createToolKeyLabelElement
  } = deps;

  const desktopShortcuts = !!getDesktopShortcutsEnabled();
  const shortcutByTool = {
    [TOOL_GLOVE]: 'Z',
    [TOOL_WATERING]: 'X',
    [TOOL_PICKAXE]: 'C'
  };
  setDesktopShortcutsClass(desktopShortcuts);
  getToolButtons().forEach((button) => {
    const tool = button.getAttribute('data-tool');
    const unlocked = isToolUnlocked(tool);
    const baseTitle = getToolDisplayName(tool);
    const shortcut = shortcutByTool[tool] || '';
    let keyLabel = button.querySelector('.tool-key-label');
    if (!keyLabel) {
      keyLabel = createToolKeyLabelElement();
      button.appendChild(keyLabel);
    }
    keyLabel.textContent = shortcut ? `(${shortcut})` : '';
    button.disabled = !unlocked;
    button.title = unlocked ? baseTitle : `${baseTitle} (Locked by goal)`;
    if (tool === state.activeTool) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  const restButton = getRestButton();
  if (restButton) {
    restButton.textContent = desktopShortcuts ? 'Rest (Space)' : 'Rest';
    restButton.title = 'Rest';
  }
  updateFarmToggleButton();
}

export function updateCursorForToolAction(deps) {
  const {
    state,
    TOOL_WATERING,
    TOOL_PICKAXE,
    isToolUnlocked,
    TOOL_GLOVE,
    selectedShopItemId,
    getSelectedGridCellIndex,
    getCursorSeedVisualPath,
    setBodyCursor
  } = deps;

  if (state.activeTool && !isToolUnlocked(state.activeTool)) {
    state.activeTool = TOOL_GLOVE;
  }
  if (state.activeTool === TOOL_WATERING) {
    const selectedGridCellIndex = typeof getSelectedGridCellIndex === 'function' ? getSelectedGridCellIndex() : null;
    const selectedGridItemId = Number.isInteger(selectedGridCellIndex) && Array.isArray(state.gridItems)
      ? state.gridItems[selectedGridCellIndex]
      : null;
    const selectedGridItem = selectedGridItemId && Array.isArray(state.items)
      ? state.items.find((it) => it && it.id === selectedGridItemId)
      : null;
    const behavior = selectedGridItem ? getItemBehavior(selectedGridItem) : null;
    const cursorFallback = behavior && behavior.wateringMode === 'refillable' ? 'copy' : 'pointer';
    setBodyCursor(`url('${resolveResourcePath('tools/watering_can.png')}') 12 12, ${cursorFallback}`);
    return;
  }
  if (state.activeTool === TOOL_PICKAXE) {
    setBodyCursor(`url('${resolveResourcePath('tools/pickaxe.png')}') 12 12, pointer`);
    return;
  }
  if (selectedShopItemId) {
    const item = state.items.find((it) => it.id === selectedShopItemId);
    if (item) {
      const imgPath = getCursorSeedVisualPath(item);
      if (!imgPath) {
        setBodyCursor('');
        return;
      }
      setBodyCursor(`url('${imgPath}') 20 20, pointer`);
      return;
    }
  }
  setBodyCursor('');
}

export function setActiveToolAction(deps) {
  const {
    state,
    tool,
    TOOL_LIST,
    TOOL_PICKAXE,
    isToolUnlocked,
    addMessage,
    updateToolButtons,
    updateCursorForTool,
    saveToStorage,
    onToolSelected
  } = deps;

  if (!TOOL_LIST.includes(tool)) return false;
  if (!isToolUnlocked(tool)) {
    addMessage({ id: 'progress.tool_locked_complete_goals' });
    return false;
  }
  state.activeTool = tool;
  updateToolButtons();
  updateCursorForTool();
  saveToStorage('activeTool', state.activeTool);
  if (typeof onToolSelected === 'function') {
    onToolSelected(tool);
  }
  if (tool === TOOL_PICKAXE && String(state.weather?.id || '') === 'rain') {
    addMessage({
      id: 'weather.rain_muddy_ground_pickaxe',
      meta: {
        speaker: 'farmer',
        category: 'weather',
        priority: 'low',
        replaceKey: 'weather:pickaxe-rain'
      }
    });
  }
  return true;
}
