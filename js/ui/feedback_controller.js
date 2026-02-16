function showCopiedMessage() {
  const copiedEl = document.getElementById('feedback-copied');
  if (!copiedEl) return;
  copiedEl.textContent = 'Copied!';
  window.setTimeout(() => {
    copiedEl.textContent = '';
  }, 1500);
}

export function setFeedbackModalOpenDom(isOpen) {
  const modal = document.getElementById('feedback-modal');
  if (!modal) return;
  modal.classList.toggle('is-open', isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

export async function copyFeedbackTextAction(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      showCopiedMessage();
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, falling back.', err);
    }
  }
  const textarea = document.getElementById('feedback-textarea');
  if (!textarea) return false;
  textarea.focus();
  textarea.select();
  try {
    const didCopy = document.execCommand('copy');
    if (didCopy) {
      showCopiedMessage();
    }
    return didCopy;
  } catch (err) {
    console.warn('execCommand copy failed.', err);
    return false;
  }
}
