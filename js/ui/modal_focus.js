const returnTargets = new WeakMap();
export function setModalVisible(modal, open) {
  if (modal.classList.contains('is-open') === open) return;
  if (open) returnTargets.set(modal, document.activeElement);
  modal.classList.toggle('is-open', open);
  modal.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) {
    const target = modal.querySelector('button:not(:disabled), input, [tabindex]') || modal.querySelector('[role="dialog"]');
    if (target) { if (!target.hasAttribute('tabindex') && target.tagName !== 'BUTTON') target.tabIndex = -1; target.focus(); }
  } else {
    const target = returnTargets.get(modal);
    if (target?.isConnected && target.offsetParent && !target.disabled) target.focus();
    else document.getElementById('next-day')?.focus();
    returnTargets.delete(modal);
    document.dispatchEvent(new Event('etm-modal-closed'));
  }
}
export function installModalFocusGuard() {
  document.addEventListener('keydown', event => {
    const modal = document.querySelector('.is-open [role="dialog"]');
    if (!modal || event.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('button:not(:disabled), input, textarea, select, [tabindex="0"]')].filter(el => el.offsetParent);
    if (!controls.length) { event.preventDefault(); modal.tabIndex = -1; modal.focus(); return; }
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }, true);
}
