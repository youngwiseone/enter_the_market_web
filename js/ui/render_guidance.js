export function renderGuidancePanelDom(payload) {
  const objectiveEl = document.getElementById('guidance-objective-text');
  const hintEl = document.getElementById('guidance-hint-text');
  const chipEl = document.getElementById('guidance-objective-chip');
  if (!objectiveEl || !hintEl || !chipEl || !payload) return;
  objectiveEl.textContent = payload.objective || '';
  hintEl.textContent = payload.hint || '';
  chipEl.textContent = payload.progressText || '';
  chipEl.classList.remove('warn', 'bad');
  if (payload.chipClass === 'warn') chipEl.classList.add('warn');
  if (payload.chipClass === 'bad') chipEl.classList.add('bad');
}
