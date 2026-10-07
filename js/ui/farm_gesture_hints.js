const HINTS_KEY = 'etm.preference.understoodFarmGestures';
let refreshHint = () => {};

export function getGestureHintContext({ tool, shopItemId, shopItemType, selectedMature, hasGrowingCrops, hasLockedTiles }) {
  if (tool === 'pickaxe' && hasLockedTiles) return { id: 'mine', text: 'Mine: click a rock, or hold and drag across rocks to clear more plots.' };
  if (tool === 'watering' && hasGrowingCrops) return { id: 'water', text: 'Water: click a crop, or hold and drag across growing crops. Once per crop each day.' };
  if (tool === 'glove' && shopItemId && shopItemType === 'produce') return { id: 'plant', text: 'Plant: click cleared soil, or hold and drag across empty plots to plant the selected seed.' };
  if (tool === 'glove' && !shopItemId && selectedMature) return { id: 'move', text: 'Move a ready crop: select it, then click another empty cleared plot. Drag across ready crops to select a group for sale.' };
  return null;
}

function readUnderstood() {
  try {
    const value = JSON.parse(localStorage.getItem(HINTS_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
export function rememberFarmGesture(id) {
  const understood = readUnderstood();
  understood[id] = true;
  try { localStorage.setItem(HINTS_KEY, JSON.stringify(understood)); } catch { /* Optional preference. */ }
  refreshHint();
}
export function refreshFarmGestureHint() { refreshHint(); }
export function installFarmGestureHint(getContext) {
  const farm = document.getElementById('farm-panel');
  if (!farm) return;
  let hint = document.getElementById('farm-gesture-hint');
  if (!hint) {
    hint = document.createElement('details');
    hint.id = 'farm-gesture-hint';
    farm.appendChild(hint);
  }
  refreshHint = () => {
    const context = getGestureHintContext(getContext());
    hint.replaceChildren();
    if (!context || readUnderstood()[context.id]) { hint.open = false; return; }
    const summary = document.createElement('summary');
    summary.textContent = 'Controls';
    const content = document.createElement('div');
    content.className = 'farm-note-content';
    const text = document.createElement('span');
    text.textContent = context.text;
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = '×';
    dismiss.setAttribute('aria-label', 'Dismiss control hint');
    dismiss.onclick = () => rememberFarmGesture(context.id);
    content.append(text, dismiss);
    hint.append(summary, content);
  };
  refreshHint();
  document.addEventListener('click', () => window.requestAnimationFrame(refreshHint));
  document.addEventListener('keyup', () => window.requestAnimationFrame(refreshHint));
}
