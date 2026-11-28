const rememberedPlots = new WeakMap();

export function getFarmArrowTarget(index, key, columns, count) {
  const column = index % columns;
  switch (key) {
    case 'ArrowLeft': return column > 0 ? index - 1 : index;
    case 'ArrowRight': return column < columns - 1 && index + 1 < count ? index + 1 : index;
    case 'ArrowUp': return index >= columns ? index - columns : index;
    case 'ArrowDown': return index + columns < count ? index + columns : index;
    default: return null;
  }
}

export function prepareFarmKeyboard(grid, { farm, preferred, fallback, count, columns, activate }) {
  if (!grid) return { bind() {}, restore() {} };
  if (!rememberedPlots.has(grid)) rememberedPlots.set(grid, new Map());
  const byFarm = rememberedPlots.get(grid);
  const active = grid.ownerDocument.activeElement;
  const hadFocus = grid.contains(active) && active?.classList.contains('grid-cell');
  const sameFarm = grid.dataset.keyboardFarm === String(farm);
  const previous = byFarm.get(farm);
  const valid = (value) => Number.isInteger(value) && value >= 0 && value < count;
  let tabStop = valid(preferred) ? preferred : valid(previous) ? previous : valid(fallback) ? fallback : 0;
  grid.dataset.keyboardFarm = String(farm);

  function bind(cell, index, label) {
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', label);
    cell.tabIndex = index === tabStop ? 0 : -1;
    cell.addEventListener('focus', () => {
      const former = grid.children[tabStop];
      if (former && former !== cell) former.tabIndex = -1;
      tabStop = index;
      cell.tabIndex = 0;
      byFarm.set(farm, index);
    });
    cell.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const move = getFarmArrowTarget(index, event.key, columns, count);
      if (move === null && event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      if (move !== null) {
        if (move !== index) grid.children[move]?.focus();
      } else if (!event.repeat) {
        activate(index);
      }
    });
  }

  function restore() {
    if (hadFocus && sameFarm && grid.offsetParent && !grid.ownerDocument.querySelector('.is-open [role="dialog"]')) {
      grid.children[tabStop]?.focus({ preventScroll: true });
    }
  }

  return { bind, restore };
}
