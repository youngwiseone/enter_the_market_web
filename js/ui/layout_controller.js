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
  const compactLandscape = false; // Narrow/short screens scroll; never add a recipe column.
  body.classList.toggle('compact-farm-layout', compactLandscape);
  root.style.setProperty('--bottom-bar-height', mobile ? '62px' : '0px');
  const notes = document.getElementById('farm-notes');
  ['guidance-panel', 'sale-receipt', 'farm-gesture-hint'].forEach(id => {
    const el = document.getElementById(id);
    if (el && notes && el.parentElement !== notes) notes.appendChild(el);
  });
  const action = document.getElementById('current-action');
  const marketHeader = document.getElementById('market-header');
  if (action) {
    const parent = mobile ? farmPanel : marketHeader;
    if (parent && action.parentElement !== parent) parent.appendChild(action);
  }
  const mobileInsight = document.getElementById('market-insight-panel-mobile-market');
  const market = document.getElementById('market');
  const table = document.getElementById('market-table-container');
  if (mobileInsight && market && table && mobileInsight.nextElementSibling !== table) market.insertBefore(mobileInsight, table);
  if (!farmPanel.clientWidth) {
    updateSidePanelScrollArea();
    resizeFxCanvas();
    return;
  }
  const number = (value) => Number.parseFloat(value) || 0;
  const style = window.getComputedStyle(farmPanel);
  const panelWidth = farmPanel.clientWidth - number(style.paddingLeft) - number(style.paddingRight) - 4 - (compactLandscape ? 120 : 0);
  const size = getStableGridSize({ panelWidth, availableHeight: mobile ? panelWidth : 460 });
  root.style.setProperty('--grid-size', size + 'px');
  root.style.setProperty('--messages-height', '0px');
  updateSidePanelScrollArea();
  resizeFxCanvas();
}
