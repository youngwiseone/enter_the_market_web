export function getGridActionFxTargetsDom(index) {
  const gridContainer = document.getElementById('grid-container');
  const grid = document.getElementById('grid');
  const safeIndex = Number(index);
  const cell = Number.isInteger(safeIndex) && grid ? (grid.children[safeIndex] || null) : null;
  const pickaxeToolButton = document.querySelector('.tool-button[data-tool="pickaxe"]');
  const waterOverlay = cell ? cell.querySelector('img.grid-overlay[src*="water.png"]') : null;
  return {
    gridContainer,
    cell,
    pickaxeToolButton,
    waterOverlay
  };
}
