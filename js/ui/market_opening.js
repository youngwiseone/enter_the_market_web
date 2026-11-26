import { isFreshStorage } from '../state/opening_state.js';

export function getMarketOpeningMode(load, search = '') {
  let fresh = false;
  try { fresh = isFreshStorage(load); } catch { /* No storage access: don't block play. */ }
  if (fresh) return 'new';
  return new URLSearchParams(search).get('opening') === '1' ? 'returning' : null;
}

export function showMarketOpening(load) {
  const mode = getMarketOpeningMode(load, window.location.search);
  const dialog = document.getElementById('market-opening');
  const enter = document.getElementById('market-opening-enter');
  const label = document.getElementById('market-opening-enter-label');
  if (!mode || !dialog?.showModal || !enter || !label) return;
  label.textContent = mode === 'new' ? 'Open the stall' : 'Back to the farm';
  // Keep the game's document-level keyboard shortcuts out of the title screen,
  // while preserving the browser's native dialog keyboard navigation.
  function stopGameKeys(event) { event.stopPropagation(); }
  function close() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('keydown', stopGameKeys);
  enter.addEventListener('click', close, { once: true });
  dialog.addEventListener('close', () => {
    dialog.removeEventListener('keydown', stopGameKeys);
    enter.removeEventListener('click', close);
  }, { once: true });
  dialog.showModal();
}
