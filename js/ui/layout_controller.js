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

export function getStableGridSize({ mobile, viewportWidth, viewportHeight, panelWidth }) {
  // Contextual text and receipts never participate in this calculation. When
  // height is scarce the farm scrolls instead of shrinking its cells again.
  const width = Math.max(140, Number(panelWidth) || 140);
  const target = mobile
    ? Math.min(width, Math.max(280, Math.min(420, viewportHeight * 0.48)))
    : Math.min(width, Math.max(280, viewportHeight - 300), viewportWidth * 0.58, 580);
  return Math.floor(target);
}

export function updateGridSizeAction(resizeFxCanvas, updateSidePanelScrollArea) {
  const root = document.documentElement;
  const body = document.body;
  const farmPanel = document.getElementById('farm-panel');
  if (!document.getElementById('grid-container') || !farmPanel) return;
  const isTouchViewport = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;
  const mobile = window.matchMedia('(max-width: 900px)').matches || (isTouchViewport && window.matchMedia('(max-width: 1100px)').matches);
  body.classList.toggle('mobile-layout', mobile);
  const guidance = document.getElementById('guidance-panel');
  const receipt = document.getElementById('sale-receipt');
  const marketHeader = document.getElementById('market-header');
  if (mobile) {
    if (guidance && guidance.parentElement !== farmPanel) farmPanel.appendChild(guidance);
    if (receipt && receipt.parentElement !== farmPanel) farmPanel.appendChild(receipt);
  } else if (marketHeader) {
    if (guidance && guidance.parentElement !== marketHeader) marketHeader.insertBefore(guidance, document.getElementById('market-insight-panel'));
    if (receipt && receipt.parentElement !== marketHeader) marketHeader.appendChild(receipt);
  }
  const number = (value) => Number.parseFloat(value) || 0;
  const style = window.getComputedStyle(farmPanel);
  const panelWidth = farmPanel.clientWidth - number(style.paddingLeft) - number(style.paddingRight) - 6;
  const size = getStableGridSize({ mobile, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, panelWidth });
  root.style.setProperty('--grid-size', size + 'px');
  root.style.setProperty('--messages-height', '0px');
  root.style.setProperty('--bottom-bar-height', mobile ? '62px' : '0px');
  updateSidePanelScrollArea();
  resizeFxCanvas();
}
