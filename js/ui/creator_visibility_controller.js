export function createCreatorVisibilityController(deps) {
  const {
    decodeAuthorIdentityToken,
    versionControlToken,
    setCreatorSignatureNodeState,
    setLicenseNoteNodeState
  } = deps;

  let creatorSignatureVisible = false;
  let licenseNoteVisible = false;

  function decodeAuthorIdentity() {
    return decodeAuthorIdentityToken(versionControlToken);
  }

  function toggleCreatorSignature() {
    const tag = document.getElementById('creator-signature');
    if (!tag) return;
    creatorSignatureVisible = !creatorSignatureVisible;
    const authorIdentity = decodeAuthorIdentity();
    setCreatorSignatureNodeState(tag, creatorSignatureVisible, authorIdentity.displayName);
  }

  function setCreatorSignatureVisible(isVisible) {
    creatorSignatureVisible = !!isVisible;
    const tag = document.getElementById('creator-signature');
    if (!tag) return;
    const authorIdentity = decodeAuthorIdentity();
    setCreatorSignatureNodeState(tag, creatorSignatureVisible, authorIdentity.displayName);
  }

  function toggleLicenseNote() {
    const note = document.getElementById('license-note');
    if (!note) return;
    licenseNoteVisible = !licenseNoteVisible;
    setLicenseNoteNodeState(note, licenseNoteVisible);
  }

  function setLicenseNoteVisible(isVisible) {
    licenseNoteVisible = !!isVisible;
    const note = document.getElementById('license-note');
    if (!note) return;
    setLicenseNoteNodeState(note, licenseNoteVisible);
  }

  function toggleLicenseAndCreator() {
    const nextVisible = !licenseNoteVisible;
    setLicenseNoteVisible(nextVisible);
    setCreatorSignatureVisible(nextVisible);
  }

  return {
    decodeAuthorIdentity,
    toggleCreatorSignature,
    setCreatorSignatureVisible,
    toggleLicenseNote,
    setLicenseNoteVisible,
    toggleLicenseAndCreator
  };
}
