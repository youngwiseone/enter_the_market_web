export function createFarmPointerRuntimeController(deps) {
  const {
    state,
    trackActionDuration,
    isDailyRollOpen,
    isGoalCelebrationOpen,
    isDaySummaryOpen,
    getElementFromPoint,
    getGridIndexFromPointerEventAction,
    applyGridActionForIndexAction,
    stopFarmPointerInteractionAction,
    getGridCellSellSnapshotAction,
    addGridCellToBulkSelectionAction,
    clearBulkGridSelectionAction,
    getBulkSelectedGridInsightDataAction,
    installFarmPointerHandlersAction,
    selectGridCellAction,
    clearGridSelectionAction,
    selectShopItemAction,
    clearShopSelectionAction,
    TOOL_PICKAXE,
    TOOL_WATERING,
    TOOL_GLOVE,
    getSelectedShopItemId,
    setSelectedShopItemId,
    getSelectedGridCellIndex,
    setSelectedGridCellIndex,
    getSelectionPulseId,
    setSelectionPulseId,
    selectedGridCellIndices,
    mineGridTile,
    waterGridTile,
    purchaseAndPlaceSelected,
    addMessage,
    setChatProfile,
    getPlantGrowthState,
    getGridRarity,
    getRarityMultiplier,
    getActiveFarmSellMultiplier,
    renderMarket,
    renderHUD,
    updateCursorForTool,
    isShopItemUnlocked,
    setActiveTool,
    getFreePurchaseCount,
    GUIDED_FLAGS,
    saveState,
    playGridItemMoveFx
  } = deps;

  const farmPointerState = {
    active: false,
    pointerId: null,
    processedIndices: new Set(),
    suppressClickUntil: 0
  };
  let farmPointerHandlersInstalled = false;

  function isFarmActionBlocked() {
    return isDailyRollOpen() || isGoalCelebrationOpen() || isDaySummaryOpen();
  }

  function getGridIndexFromPointerEvent(event) {
    return getGridIndexFromPointerEventAction(event, getElementFromPoint);
  }

  function applyGridActionForIndex(index, options = {}) {
    const perfStart = performance.now();
    try {
      return applyGridActionForIndexAction({
        state,
        index,
        mode: options.mode === 'drag' ? 'drag' : 'tap',
        TOOL_PICKAXE,
        TOOL_WATERING,
        TOOL_GLOVE,
        selectedShopItemId: getSelectedShopItemId(),
        isFarmActionBlocked,
        mineGridTile,
        waterGridTile,
        addGridCellToBulkSelection,
        selectGridCell,
        purchaseAndPlaceSelected,
        addMessage,
        setChatProfile,
        getSelectedGridCellIndex,
        setSelectedGridCellIndex,
        selectedGridCellIndices,
        getPlantGrowthState,
        updateCursorForTool,
        saveState,
        renderMarket,
        playGridItemMoveFx
      });
    } finally {
      trackActionDuration('applyGridActionForIndex', performance.now() - perfStart);
    }
  }

  function stopFarmPointerInteraction() {
    stopFarmPointerInteractionAction(farmPointerState);
  }

  function getGridCellSellSnapshot(cellIndex) {
    return getGridCellSellSnapshotAction({
      state,
      cellIndex,
      getPlantGrowthState,
      getGridRarity,
      getRarityMultiplier,
      getActiveFarmSellMultiplier
    });
  }

  function addGridCellToBulkSelection(cellIndex) {
    return addGridCellToBulkSelectionAction({
      cellIndex,
      selectedGridCellIndices,
      getGridCellSellSnapshot,
      setSelectedGridCellIndex,
      renderMarket
    });
  }

  function clearBulkGridSelection(shouldRefresh = false) {
    clearBulkGridSelectionAction({
      selectedGridCellIndices,
      shouldRefresh,
      renderMarket
    });
  }

  function getBulkSelectedGridInsightData() {
    return getBulkSelectedGridInsightDataAction({
      state,
      selectedGridCellIndices,
      getGridCellSellSnapshot
    });
  }

  function installFarmPointerHandlers() {
    if (farmPointerHandlersInstalled) return;
    const installed = installFarmPointerHandlersAction({
      isFarmActionBlocked,
      getGridIndexFromPointerEvent,
      farmPointerState,
      applyGridActionForIndex,
      stopFarmPointerInteraction,
      shouldPromoteStartToBulk: (cellIndex) => (
        state.activeTool === TOOL_GLOVE
        && !getSelectedShopItemId()
        && !!getGridCellSellSnapshot(cellIndex)
      )
    });
    if (installed) {
      farmPointerHandlersInstalled = true;
    }
  }

  function selectGridCell(cellIndex) {
    selectGridCellAction({
      state,
      cellIndex,
      selectedGridCellIndices,
      getSelectedGridCellIndex,
      setSelectedGridCellIndex,
      setSelectedShopItemId,
      setSelectionPulseId,
      updateCursorForTool,
      renderMarket,
      addMessage
    });
  }

  function clearGridSelection(shouldRefresh = false) {
    clearGridSelectionAction({
      selectedGridCellIndices,
      getSelectedGridCellIndex,
      setSelectedGridCellIndex,
      shouldRefresh,
      renderMarket
    });
  }

  function selectShopItem(itemId) {
    selectShopItemAction({
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
      renderHUD,
      guidedSelectedFlag: GUIDED_FLAGS.selected
    });
  }

  function clearShopSelection() {
    clearShopSelectionAction({
      getSelectedShopItemId,
      setSelectedShopItemId,
      setSelectionPulseId,
      updateCursorForTool,
      renderMarket,
      renderHUD
    });
  }

  function clearCurrentInfoSelection() {
    let changed = false;
    if (getSelectedShopItemId() !== null) {
      setSelectedShopItemId(null);
      setSelectionPulseId(null);
      changed = true;
    }
    if (getSelectedGridCellIndex() !== null) {
      setSelectedGridCellIndex(null);
      changed = true;
    }
    if (selectedGridCellIndices.size) {
      selectedGridCellIndices.clear();
      changed = true;
    }
    if (!changed) return;
    updateCursorForTool();
    renderMarket();
  }

  return {
    getSelectionPulseId,
    getSelectedShopItemId,
    getSelectedGridCellIndex,
    getSelectedGridCellIndices: () => selectedGridCellIndices,
    getFarmPointerState: () => farmPointerState,
    isDaySummaryOpen,
    isFarmActionBlocked,
    getGridIndexFromPointerEvent,
    applyGridActionForIndex,
    stopFarmPointerInteraction,
    getGridCellSellSnapshot,
    addGridCellToBulkSelection,
    clearBulkGridSelection,
    getBulkSelectedGridInsightData,
    installFarmPointerHandlers,
    selectGridCell,
    clearGridSelection,
    selectShopItem,
    clearShopSelection,
    clearCurrentInfoSelection
  };
}
