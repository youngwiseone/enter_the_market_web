export function createFarmUiRuntimeController(deps) {
  const {
    state,
    updateFarmToggleButtonAction,
    setActiveFarmAction,
    handleFarmToggleButtonClickAction,
    updateToolButtonsAction,
    updateCursorForToolAction,
    setActiveToolAction,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    GRID_CELL_COUNT,
    FARM_TWO_BUTTON_REVEAL_TILES_LEFT,
    FARM_TWO_PURCHASE_COST,
    isFarmTwoPurchased,
    getUnlockedTileCountForFarm,
    isFarmOneFullyUnlocked,
    applyFarmStateToActiveGrid,
    setSelectedGridCellIndex,
    getSelectedGridCellIndex,
    selectedGridCellIndices,
    setSelectedShopItemId,
    setSelectionPulseId,
    stopFarmPointerInteraction,
    saveState,
    renderAll,
    addMessage,
    normalizeFarmState,
    setActiveFarm,
    pulseHud,
    TOOL_GLOVE,
    TOOL_WATERING,
    TOOL_PICKAXE,
    isToolUnlocked,
    getToolDisplayName,
    updateFarmToggleButton,
    TOOL_LIST,
    updateToolButtons,
    updateCursorForTool,
    saveToStorage,
    selectedShopItemId,
    getCursorSeedVisualPath,
    getFarmToggleButton,
    confirmDialog,
    getDesktopShortcutsEnabled,
    setDesktopShortcutsClass,
    getToolButtons,
    getRestButton,
    setBodyCursor,
    createToolKeyLabelElement,
    renderMarket,
    isReduceMotion
  } = deps;

  const GRID_PRICE_BADGE_TIMEOUT_MS = 4000;
  const GRID_PRICE_BADGE_FADE_MS = 240;
  let gridPriceBadgeFadeTimerId = null;
  let gridPriceBadgeHideTimerId = null;

  function getRuntimeFlags() {
    if (!state.runtimeFlags || typeof state.runtimeFlags !== 'object') {
      state.runtimeFlags = {};
    }
    return state.runtimeFlags;
  }

  function clearGridPriceBadgeTimers() {
    if (gridPriceBadgeFadeTimerId !== null) {
      window.clearTimeout(gridPriceBadgeFadeTimerId);
      gridPriceBadgeFadeTimerId = null;
    }
    if (gridPriceBadgeHideTimerId !== null) {
      window.clearTimeout(gridPriceBadgeHideTimerId);
      gridPriceBadgeHideTimerId = null;
    }
  }

  function isTimedGridPriceBadgeTool(tool) {
    return tool === TOOL_WATERING || tool === TOOL_PICKAXE;
  }

  function hasGridSelection() {
    const singleSelectedIndex = typeof getSelectedGridCellIndex === 'function'
      ? getSelectedGridCellIndex()
      : null;
    return singleSelectedIndex !== null || (selectedGridCellIndices && selectedGridCellIndices.size > 0);
  }

  function getGridPriceBadgeDisplayStateFn() {
    const alwaysShowGridItemInfo = !!state?.player?.alwaysShowGridItemInfo;
    if (alwaysShowGridItemInfo) {
      return { visible: true, fading: false };
    }
    const tool = state.activeTool;
    if (tool === TOOL_GLOVE && hasGridSelection()) {
      return { visible: true, fading: false };
    }
    if (tool === TOOL_GLOVE) {
      return { visible: false, fading: false };
    }
    if (!isTimedGridPriceBadgeTool(tool)) {
      return { visible: false, fading: false };
    }
    const runtimeFlags = getRuntimeFlags();
    const visibleUntilMs = Math.max(0, Number(runtimeFlags.gridPriceBadgeVisibleUntilMs) || 0);
    if (visibleUntilMs <= 0) {
      return { visible: false, fading: false };
    }
    const now = Date.now();
    if (now >= visibleUntilMs) {
      return { visible: false, fading: false };
    }
    const reduceMotion = typeof isReduceMotion === 'function' ? !!isReduceMotion() : false;
    const fading = !reduceMotion && (visibleUntilMs - now) <= GRID_PRICE_BADGE_FADE_MS;
    return { visible: true, fading };
  }

  function scheduleGridPriceBadgeTimers(visibleUntilMs) {
    clearGridPriceBadgeTimers();
    const hideDelayMs = Math.max(0, Math.round(visibleUntilMs - Date.now()));
    const fadeDelayMs = Math.max(0, hideDelayMs - GRID_PRICE_BADGE_FADE_MS);
    gridPriceBadgeFadeTimerId = window.setTimeout(() => {
      gridPriceBadgeFadeTimerId = null;
      // Trigger a re-render at fade start; badges use CSS keyframes because grid cells are recreated each render.
      if (typeof renderMarket === 'function') renderMarket();
    }, fadeDelayMs);
    gridPriceBadgeHideTimerId = window.setTimeout(() => {
      gridPriceBadgeHideTimerId = null;
      if (typeof renderMarket === 'function') renderMarket();
    }, hideDelayMs);
  }

  function clearTimedGridPriceBadgeVisibilityFn(options = {}) {
    const { shouldRender = true } = options;
    const runtimeFlags = getRuntimeFlags();
    runtimeFlags.gridPriceBadgeVisibleUntilMs = 0;
    clearGridPriceBadgeTimers();
    if (shouldRender && typeof renderMarket === 'function') renderMarket();
  }

  function refreshTimedGridPriceBadgeVisibilityForCurrentToolFn(options = {}) {
    const { shouldRender = true } = options;
    if (!isTimedGridPriceBadgeTool(state.activeTool)) {
      clearTimedGridPriceBadgeVisibilityFn({ shouldRender });
      return;
    }
    const runtimeFlags = getRuntimeFlags();
    runtimeFlags.gridPriceBadgeVisibleUntilMs = Date.now() + GRID_PRICE_BADGE_TIMEOUT_MS;
    scheduleGridPriceBadgeTimers(runtimeFlags.gridPriceBadgeVisibleUntilMs);
    if (shouldRender && typeof renderMarket === 'function') renderMarket();
  }

  function updateFarmToggleButtonFn() {
    updateFarmToggleButtonAction({
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
    });
  }

  function setActiveFarmFn(farmId) {
    return setActiveFarmAction({
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
    });
  }

  function handleFarmToggleButtonClickFn() {
    handleFarmToggleButtonClickAction({
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
    });
  }

  function updateToolButtonsFn() {
    updateToolButtonsAction({
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
    });
  }

  function updateCursorForToolFn() {
    updateCursorForToolAction({
      state,
      TOOL_WATERING,
      TOOL_PICKAXE,
      isToolUnlocked,
      TOOL_GLOVE,
      selectedShopItemId: selectedShopItemId(),
      getSelectedGridCellIndex,
      getCursorSeedVisualPath,
      setBodyCursor
    });
  }

  function setActiveToolFn(tool) {
    setActiveToolAction({
      state,
      tool,
      TOOL_LIST,
      TOOL_PICKAXE,
      isToolUnlocked,
      addMessage,
      updateToolButtons,
      updateCursorForTool,
      saveToStorage,
      onToolSelected: () => {
        const runtimeFlags = getRuntimeFlags();
        if (!runtimeFlags.gridPriceBadgesActuallyRenderedLastRender) {
          runtimeFlags.suppressGridPriceBadgeHideFadeOnce = true;
        }
        if (typeof renderMarket === 'function') renderMarket();
      }
    });
  }

  return {
    updateFarmToggleButton: updateFarmToggleButtonFn,
    setActiveFarm: setActiveFarmFn,
    handleFarmToggleButtonClick: handleFarmToggleButtonClickFn,
    updateToolButtons: updateToolButtonsFn,
    updateCursorForTool: updateCursorForToolFn,
    setActiveTool: setActiveToolFn,
    getGridPriceBadgeDisplayState: getGridPriceBadgeDisplayStateFn,
    refreshTimedGridPriceBadgeVisibilityForCurrentTool: refreshTimedGridPriceBadgeVisibilityForCurrentToolFn
  };
}
