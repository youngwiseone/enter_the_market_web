export function decodeAuthorIdentityToken(versionControl) {
  try {
    if (typeof atob === 'function') {
      const decoded = atob(versionControl);
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === 'object') {
        return {
          displayName: typeof parsed.displayName === 'string' && parsed.displayName.trim()
            ? parsed.displayName.trim()
            : 'Creator',
          authorIds: Array.isArray(parsed.authorIds)
            ? parsed.authorIds.map((id) => String(id).trim()).filter(Boolean)
            : []
        };
      }
    }
  } catch (err) {
    console.warn('Failed to decode author identity token.', err);
  }
  return { displayName: 'Creator', authorIds: [] };
}

export function setCreatorSignatureNodeState(node, isVisible, displayName) {
  if (!node) return;
  node.textContent = `Crafted by ${displayName}`;
  node.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  node.classList.toggle('is-visible', isVisible);
}

export function setLicenseNoteNodeState(node, isVisible) {
  if (!node) return;
  node.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  node.classList.toggle('is-visible', isVisible);
}
