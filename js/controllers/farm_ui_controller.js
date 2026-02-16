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
    isFarmOneFullyUnlocked
  } = deps;

  const button = document.getElementById('farm-toggle-button');
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
    pulseHud
  } = deps;

  if (!isFarmOneFullyUnlocked()) {
    const unlockedOnFarmOne = getUnlockedTileCountForFarm(FARM_PRIMARY_ID);
    addMessage(`Unlock all Farm 1 tiles first (${unlockedOnFarmOne}/${GRID_CELL_COUNT}).`, {
      speaker: 'player',
      emotion: 'neutral',
      category: 'progress',
      priority: 'normal'
    });
    return;
  }
  if (!isFarmTwoPurchased()) {
    const confirmed = confirm(`Buy Farm 2 for $${FARM_TWO_PURCHASE_COST.toFixed(2)}?`);
    if (!confirmed) return;
    if ((Number(state.player?.cash) || 0) < FARM_TWO_PURCHASE_COST) {
      addMessage(`Not enough cash for Farm 2. Need $${FARM_TWO_PURCHASE_COST.toFixed(2)}.`, {
        speaker: 'player',
        emotion: 'wrong',
        category: 'progress',
        priority: 'high'
      });
      return;
    }
    state.player.cash -= FARM_TWO_PURCHASE_COST;
    state.secondFarmPurchased = true;
    state.farms[FARM_SECONDARY_ID] = normalizeFarmState(state.farms[FARM_SECONDARY_ID]);
    addMessage('Farm 2 purchased. Crops there sell for 2x, but mining costs 5 energy per hit.', {
      speaker: 'farmer',
      emotion: 'excited',
      category: 'progress',
      priority: 'high'
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
    updateFarmToggleButton
  } = deps;

  const desktopShortcuts = !!(
    window.matchMedia
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(max-width: 900px)').matches
  );
  const shortcutByTool = {
    [TOOL_GLOVE]: 'Z',
    [TOOL_WATERING]: 'X',
    [TOOL_PICKAXE]: 'C'
  };
  if (document.body) {
    document.body.classList.toggle('has-desktop-shortcuts', desktopShortcuts);
  }
  document.querySelectorAll('.tool-button[data-tool]').forEach((button) => {
    const tool = button.getAttribute('data-tool');
    const unlocked = isToolUnlocked(tool);
    const baseTitle = getToolDisplayName(tool);
    const shortcut = shortcutByTool[tool] || '';
    let keyLabel = button.querySelector('.tool-key-label');
    if (!keyLabel) {
      keyLabel = document.createElement('span');
      keyLabel.className = 'tool-key-label';
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
  const restButton = document.getElementById('next-day');
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
    getSeedImagePath
  } = deps;

  if (state.activeTool && !isToolUnlocked(state.activeTool)) {
    state.activeTool = TOOL_GLOVE;
  }
  if (state.activeTool === TOOL_WATERING) {
    document.body.style.cursor = "url('resources/tools/watering_can.png') 12 12, pointer";
    return;
  }
  if (state.activeTool === TOOL_PICKAXE) {
    document.body.style.cursor = "url('resources/tools/pickaxe.png') 12 12, pointer";
    return;
  }
  if (selectedShopItemId) {
    const item = state.items.find((it) => it.id === selectedShopItemId);
    if (item) {
      const imgPath = getSeedImagePath(item);
      if (!imgPath) return;
      document.body.style.cursor = `url('${imgPath}') 12 12, pointer`;
      return;
    }
  }
  document.body.style.cursor = '';
}

export function setActiveToolAction(deps) {
  const {
    state,
    tool,
    TOOL_LIST,
    isToolUnlocked,
    addMessage,
    updateToolButtons,
    updateCursorForTool,
    saveToStorage
  } = deps;

  if (!TOOL_LIST.includes(tool)) return;
  if (!isToolUnlocked(tool)) {
    addMessage('This tool is locked. Complete goals to unlock it.');
    return;
  }
  state.activeTool = tool;
  updateToolButtons();
  updateCursorForTool();
  saveToStorage('activeTool', state.activeTool);
}
