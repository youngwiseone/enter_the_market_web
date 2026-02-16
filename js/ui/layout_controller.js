export function updateSidePanelScrollAreaAction() {
  const panelIds = ['market-table-container', 'store', 'goals-panel', 'messages-history-panel'];
  panelIds.forEach((id) => {
    const panel = document.getElementById(id);
    if (!panel) return;
    panel.style.height = '';
    panel.style.maxHeight = '';
    panel.style.overflowY = '';
  });
}

export function installSidePanelScrollHandlersAction() {
  // Native overflow scrolling is more reliable than manual wheel/touch handling
  // once panel sizing is constrained correctly by CSS.
}

export function updateGridSizeAction(resizeFxCanvas, updateSidePanelScrollArea) {
  const root = document.documentElement;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const gridContainer = document.getElementById('grid-container');
  const farmPanel = document.getElementById('farm-panel');
  const marketLayout = document.getElementById('market-layout');

  if (!gridContainer || !farmPanel) return;

  const layoutHeight = Math.max(320, (marketLayout ? marketLayout.clientHeight : window.innerHeight) - 8);
  const isMobileLayout = window.matchMedia('(max-width: 900px)').matches;
  const farmChrome = Math.max(0, farmPanel.offsetHeight - gridContainer.offsetHeight);
  const desktopMinimumTarget = Math.floor(window.innerWidth / 3.2);
  const parentWidth = gridContainer.parentElement ? gridContainer.parentElement.clientWidth : window.innerWidth;
  const maxByWidth = Math.max(140, parentWidth - (isMobileLayout ? 8 : 12));
  const minGridSize = isMobileLayout ? 180 : Math.max(260, desktopMinimumTarget);
  const verticalPadding = isMobileLayout ? 28 : 34;
  const availableGridByHeight = Math.max(140, layoutHeight - farmChrome - verticalPadding);
  const mobileSideReserve = isMobileLayout
    ? Math.round(Math.min(320, Math.max(190, layoutHeight * 0.34)))
    : 0;
  const mobileMaxByHeight = Math.max(140, availableGridByHeight - mobileSideReserve);
  const maxGridSize = isMobileLayout
    ? Math.floor(Math.min(maxByWidth, mobileMaxByHeight))
    : Math.floor(Math.min(window.innerWidth * 0.58, window.innerHeight * 0.78));
  const lowerBound = Math.min(minGridSize, maxGridSize);
  const upperBound = Math.max(minGridSize, maxGridSize);
  const baseTarget = isMobileLayout
    ? Math.floor(maxByWidth * 0.99)
    : Math.floor(Math.min(availableGridByHeight, maxByWidth) * 0.97);
  const size = clamp(baseTarget, lowerBound, upperBound);
  root.style.setProperty('--grid-size', `${size}px`);
  root.style.setProperty('--messages-height', '0px');
  root.style.setProperty('--bottom-bar-height', '0px');
  updateSidePanelScrollArea();
  resizeFxCanvas();
}
