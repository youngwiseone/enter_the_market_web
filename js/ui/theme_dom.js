export function applyThemeDom(themeId) {
  if (!document.body) return;
  document.body.classList.remove(...Array.from(document.body.classList).filter((cls) => cls.startsWith('theme-')));
  document.body.classList.add(themeId);
}
