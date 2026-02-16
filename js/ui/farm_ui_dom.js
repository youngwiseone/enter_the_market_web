export function getFarmToggleButtonDom() {
  return document.getElementById('farm-toggle-button');
}

export function confirmDialogDom(message) {
  return window.confirm(message);
}

export function getDesktopShortcutsEnabledDom() {
  return !!(
    window.matchMedia
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(max-width: 900px)').matches
  );
}

export function setDesktopShortcutsClassDom(enabled) {
  if (!document.body) return;
  document.body.classList.toggle('has-desktop-shortcuts', !!enabled);
}

export function getToolButtonsDom() {
  return Array.from(document.querySelectorAll('.tool-button[data-tool]'));
}

export function getRestButtonDom() {
  return document.getElementById('next-day');
}

export function createToolKeyLabelElementDom() {
  const el = document.createElement('span');
  el.className = 'tool-key-label';
  return el;
}

export function setBodyCursorDom(cursorValue) {
  if (!document.body) return;
  document.body.style.cursor = cursorValue || '';
}
