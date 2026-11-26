'use strict';

const path = require('node:path');
const electron = require('electron');

const guard = Symbol.for('antigravity-core-fixes.runtime');
if (!globalThis[guard]) {
  globalThis[guard] = true;
  const pluginRoot = path.resolve(__dirname, '..');
  const preloadPath = path.join(__dirname, 'preload.cjs');
  const {register} = require('./ipc.cjs');

  register({electron, pluginRoot});
  electron.app.on('browser-window-created', (_event, win) => {
    try { require(path.join(pluginRoot, 'core', 'startup_recovery.cjs')).attach(win); }
    catch (error) { console.warn('[AntigravityCoreFixes] startup recovery unavailable:', error.message); }
  });
  const registerPreload = () => {
    electron.session.defaultSession.registerPreloadScript({type: 'frame', filePath: preloadPath});
    console.info(`[AntigravityCoreFixes] runtime registered from ${pluginRoot}`);
  };
  if (electron.app.isReady()) registerPreload();
  else electron.app.prependOnceListener('ready', registerPreload);
}
