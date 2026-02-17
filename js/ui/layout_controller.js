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
  const body = document.body;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const parsePx = (value) => {
    const num = Number.parseFloat(value);
    return Number.isFinite(num) ? num : 0;
  };
  const getOuterHeight = (node) => {
    if (!node) return 0;
    const style = window.getComputedStyle(node);
    return node.offsetHeight + parsePx(style.marginTop) + parsePx(style.marginBottom);
  };
  const getVisibleTop = (node) => {
    if (!node) return null;
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return null;
    const rect = node.getBoundingClientRect();
    if (!Number.isFinite(rect.top) || rect.height <= 0) return null;
    return rect.top;
  };
  const gridContainer = document.getElementById('grid-container');
  const farmPanel = document.getElementById('farm-panel');
  const marketLayout = document.getElementById('market-layout');

  if (!gridContainer || !farmPanel) return;

  const isNarrowViewport = window.matchMedia('(max-width: 900px)').matches;
  const isTouchViewport = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;
  const isLandscapeViewport = window.innerWidth > window.innerHeight;
  const shouldUseMobileBySize = isNarrowViewport || (isTouchViewport && window.matchMedia('(max-width: 1100px)').matches);
  const isMobileLayout = shouldUseMobileBySize && !isLandscapeViewport;
  if (body) {
    body.classList.toggle('mobile-layout', isMobileLayout);
  }

  const layoutHeight = Math.max(280, (marketLayout ? marketLayout.clientHeight : window.innerHeight) - 8);
  const farmPanelStyle = window.getComputedStyle(farmPanel);
  const bodyStyle = body ? window.getComputedStyle(body) : null;
  const bodyPaddingX = bodyStyle ? (parsePx(bodyStyle.paddingLeft) + parsePx(bodyStyle.paddingRight)) : 0;
  const farmHorizontalPadding = parsePx(farmPanelStyle.paddingLeft) + parsePx(farmPanelStyle.paddingRight);
  const farmVerticalPadding = parsePx(farmPanelStyle.paddingTop) + parsePx(farmPanelStyle.paddingBottom);
  const farmTitle = document.getElementById('farm-title');
  const farmToolbar = farmPanel.querySelector('.farm-toolbar');
  const farmChrome = Math.max(0, farmVerticalPadding + getOuterHeight(farmTitle) + getOuterHeight(farmToolbar));
  const desktopMinimumTarget = Math.floor(window.innerWidth / 3.2);
  const parentWidth = gridContainer.parentElement ? gridContainer.parentElement.clientWidth : window.innerWidth;
  const panelInnerWidth = Math.max(140, farmPanel.clientWidth - farmHorizontalPadding);
  const profilePanel = document.getElementById('hud-profile-panel');
  const profileWidth = Math.max(72, profilePanel ? profilePanel.offsetWidth : 120);
  const marketGap = marketLayout ? parsePx(window.getComputedStyle(marketLayout).columnGap || window.getComputedStyle(marketLayout).gap) : 8;
  const viewportInnerWidth = Math.max(320, window.innerWidth - bodyPaddingX);
  const desktopMarketMinWidth = Math.max(220, Math.floor(viewportInnerWidth * 0.28));
  const desktopWidthBudget = Math.max(
    140,
    viewportInnerWidth - profileWidth - desktopMarketMinWidth - (marketGap * 2) - farmHorizontalPadding - 4
  );
  const maxByWidth = Math.max(
    140,
    (isMobileLayout ? panelInnerWidth : Math.min(parentWidth, desktopWidthBudget)) - (isMobileLayout ? 2 : 12)
  );
  const minGridSize = isMobileLayout ? 160 : Math.max(260, desktopMinimumTarget);
  const verticalPadding = isMobileLayout ? 14 : 34;
  let availableGridByHeight = Math.max(140, layoutHeight - farmChrome - verticalPadding);
  const isFarmVisible = window.getComputedStyle(farmPanel).display !== 'none';
  if (isMobileLayout && isFarmVisible) {
    const farmTop = farmPanel.getBoundingClientRect().top;
    const restDockTop = getVisibleTop(document.getElementById('rest-dock'));
    const farmActionDockTop = getVisibleTop(document.getElementById('farm-action-dock'));
    const bottomTabsTop = getVisibleTop(document.getElementById('mobile-bottom-tabs'));
    let bottomLimit = window.innerHeight - 6;
    [restDockTop, farmActionDockTop, bottomTabsTop].forEach((top) => {
      if (Number.isFinite(top)) {
        bottomLimit = Math.min(bottomLimit, top);
      }
    });
    const viewportConstrainedHeight = Math.max(120, Math.floor(bottomLimit - farmTop - farmChrome - 14));
    availableGridByHeight = Math.max(120, Math.min(availableGridByHeight, viewportConstrainedHeight));
  }
  const maxGridSize = isMobileLayout
    ? Math.floor(Math.min(maxByWidth, availableGridByHeight))
    : Math.floor(Math.min(window.innerWidth * 0.58, window.innerHeight * 0.78));
  const lowerBound = Math.min(minGridSize, maxGridSize);
  const upperBound = Math.max(minGridSize, maxGridSize);
  const constrainedBySpace = Math.floor(Math.min(maxByWidth, availableGridByHeight));
  const baseTarget = isMobileLayout
    ? constrainedBySpace
    : Math.floor(constrainedBySpace * 0.97);
  const size = clamp(baseTarget, lowerBound, upperBound);
  root.style.setProperty('--grid-size', `${size}px`);
  root.style.setProperty('--messages-height', '0px');
  root.style.setProperty('--bottom-bar-height', isMobileLayout ? '62px' : '0px');
  updateSidePanelScrollArea();
  resizeFxCanvas();
}
