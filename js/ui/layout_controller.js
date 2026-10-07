export function updateSidePanelScrollAreaAction() {
  ['market-table-container', 'store', 'goals-panel', 'messages-history-panel'].forEach((id) => {
    const panel = document.getElementById(id);
    if (!panel) return;
    panel.style.height = '';
    panel.style.maxHeight = '';
    panel.style.overflowY = '';
  });
}

export function installSidePanelScrollHandlersAction() {
  // Native page/panel scrolling; only the interactive farm captures gestures.
}

export function getStableGridSize({ panelWidth, availableHeight }) {
  // Only the permanent farm chrome participates. Disclosures and selection
  // details never shrink the grid or move its controls.
  const width = Math.max(140, Number(panelWidth) || 140);
  const height = Math.max(140, Number(availableHeight) || width);
  return Math.floor(Math.min(width, height, 580));
}

export function updateGridSizeAction(resizeFxCanvas, updateSidePanelScrollArea) {
  const root = document.documentElement;
  const body = document.body;
  const farmPanel = document.getElementById('farm-panel');
  if (!document.getElementById('grid-container') || !farmPanel) return;
  const isTouchViewport = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;
  const mobile = window.matchMedia('(max-width: 900px)').matches
    || window.matchMedia('(max-height: 500px)').matches
    || (isTouchViewport && window.matchMedia('(max-width: 1100px)').matches);
  body.classList.toggle('mobile-layout', mobile);
  const compactLandscape = mobile && window.innerWidth >= 480 && window.innerHeight <= 500;
  body.classList.toggle('compact-farm-layout', compactLandscape);
  root.style.setProperty('--bottom-bar-height', mobile && !compactLandscape ? '62px' : '0px');
  const guidance = document.getElementById('guidance-panel');
  const receipt = document.getElementById('sale-receipt');
  const marketHeader = document.getElementById('market-header');
  const farmNotes = document.getElementById('farm-notes');
  const gestureHint = document.getElementById('farm-gesture-hint');
  if (mobile) {
    if (guidance && farmNotes && guidance.parentElement !== farmNotes) farmNotes.appendChild(guidance);
    if (receipt && farmNotes && receipt.parentElement !== farmNotes) farmNotes.appendChild(receipt);
    if (gestureHint && farmNotes && gestureHint.parentElement !== farmNotes) farmNotes.appendChild(gestureHint);
  } else if (marketHeader) {
    if (guidance && guidance.parentElement !== marketHeader) marketHeader.insertBefore(guidance, document.getElementById('market-insight-panel'));
    if (receipt && receipt.parentElement !== marketHeader) marketHeader.appendChild(receipt);
    if (gestureHint && gestureHint.parentElement !== marketHeader) marketHeader.appendChild(gestureHint);
  }
  if (!farmPanel.clientWidth) {
    updateSidePanelScrollArea();
    resizeFxCanvas();
    return;
  }
  const number = (value) => Number.parseFloat(value) || 0;
  const style = window.getComputedStyle(farmPanel);
  const panelWidth = farmPanel.clientWidth - number(style.paddingLeft) - number(style.paddingRight) - 4 - (compactLandscape ? 120 : 0);
  const grid = document.getElementById('grid-container');
  const gridTop = grid.getBoundingClientRect().top;
  const toolbar = farmPanel.querySelector('.farm-toolbar');
  // Reserve the same toolbar and note row even when a crop is selected, a
  // receipt is expanded, or there is no contextual hint to show.
  const afterGrid = mobile && !compactLandscape
    ? (toolbar?.getBoundingClientRect().height || 44) + 44
    : number(style.paddingBottom) + 4;
  const dockTop = document.getElementById('rest-dock')?.getBoundingClientRect().top || window.innerHeight - 60;
  const frameBottom = mobile ? dockTop - 8 : document.getElementById('market-layout').getBoundingClientRect().bottom;
  const size = getStableGridSize({ panelWidth, availableHeight: frameBottom - gridTop - afterGrid });
  root.style.setProperty('--grid-size', size + 'px');
  root.style.setProperty('--messages-height', '0px');
  updateSidePanelScrollArea();
  resizeFxCanvas();
}
