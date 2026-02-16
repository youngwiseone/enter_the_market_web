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
    getSeedImagePath
  } = deps;

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
      isFarmOneFullyUnlocked
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
      pulseHud
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
      updateFarmToggleButton
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
      getSeedImagePath
    });
  }

  function setActiveToolFn(tool) {
    setActiveToolAction({
      state,
      tool,
      TOOL_LIST,
      isToolUnlocked,
      addMessage,
      updateToolButtons,
      updateCursorForTool,
      saveToStorage
    });
  }

  return {
    updateFarmToggleButton: updateFarmToggleButtonFn,
    setActiveFarm: setActiveFarmFn,
    handleFarmToggleButtonClick: handleFarmToggleButtonClickFn,
    updateToolButtons: updateToolButtonsFn,
    updateCursorForTool: updateCursorForToolFn,
    setActiveTool: setActiveToolFn
  };
}
