/* Explicit native ownership for the current Antigravity build. Loaded before UI modules. */
(() => {
  window.__antigravityEnhancerProfile = Object.freeze({
    desktopVersion: (navigator.userAgent.match(/Antigravity\/([\d.]+)/) || [])[1] || 'unknown',
    turnNavigator: false,
    auxiliaryQuickToggle: false,
    imageViewer: true,
    proceedEnhancer: true,
    quoteShortcutAlias: false,
    nativeWorkspaceTree: true
  });
  // The official frontend still gates PDF host creation behind this setting.
  // Only enable that host; do not replace module loading or eager-start workers.
  try {
    const key = 'jetski.developer.customFlagOverrides';
    const flags = JSON.parse(localStorage.getItem(key) || '{}');
    if (!flags['enable-pdf-viewer']) {
      flags['enable-pdf-viewer'] = true;
      localStorage.setItem(key, JSON.stringify(flags));
    }
  } catch (_) {}
})();
