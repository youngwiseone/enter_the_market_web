const ASSET_VERSION_KEY = 'ETM_IMAGE_VERSION';
const DEFAULT_IMAGE_VERSION = '1';

function readConfiguredImageVersion() {
  if (typeof window !== 'undefined' && typeof window[ASSET_VERSION_KEY] === 'string') {
    const version = window[ASSET_VERSION_KEY].trim();
    if (version) return version;
  }
  return DEFAULT_IMAGE_VERSION;
}

export function appendAssetVersion(assetPath, explicitVersion = '') {
  if (typeof assetPath !== 'string') return '';
  const trimmedPath = assetPath.trim();
  if (!trimmedPath) return '';
  if (trimmedPath.startsWith('data:') || trimmedPath.startsWith('blob:')) {
    return trimmedPath;
  }

  const version = String(explicitVersion || readConfiguredImageVersion()).trim();
  if (!version) return trimmedPath;

  const separator = trimmedPath.includes('?') ? '&' : '?';
  return `${trimmedPath}${separator}v=${encodeURIComponent(version)}`;
}

export function getImageAssetVersion() {
  return readConfiguredImageVersion();
}
