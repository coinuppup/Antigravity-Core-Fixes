'use strict';

const {contextBridge, ipcRenderer, webFrame} = require('electron');

if (window.top === window && location.protocol === 'https:' && location.hostname === '127.0.0.1') {
  const listeners = new Set();
  ipcRenderer.on('agcf:workspace-changed', (_event, data) => {
    for (const listener of listeners) {
      try { listener(data); } catch (_) {}
    }
  });

  contextBridge.exposeInMainWorld('antigravityFS', {
    readFileBytes: path => ipcRenderer.invoke('agcf:read-file-bytes', path),
    readFileText: path => ipcRenderer.invoke('agcf:read-file-text', path),
    getOfficeViewerAsset: name => ipcRenderer.invoke('agcf:get-office-asset', name),
    getConversationTurns: id => ipcRenderer.invoke('agcf:get-conversation-turns', id),
    getConversationWorkspace: (id, sectionId) => ipcRenderer.invoke('agcf:get-conversation-workspace', id, sectionId),
    focusWindow: () => ipcRenderer.invoke('agcf:focus-window'),
    copyFilesToClipboard: paths => ipcRenderer.invoke('agcf:copy-files-to-clipboard', paths),
    readDirEntries: path => ipcRenderer.invoke('agcf:read-dir-entries', path),
    watchWorkspace: path => ipcRenderer.invoke('agcf:watch-workspace', path),
    unwatchWorkspace: () => ipcRenderer.invoke('agcf:unwatch-workspace'),
    revealInExplorer: path => ipcRenderer.invoke('agcf:reveal-in-explorer', path),
    resolveFilePath: path => ipcRenderer.invoke('agcf:resolve-file-path', path),
    startDrag: paths => ipcRenderer.send('agcf:start-drag', paths),
    onWorkspaceChanged: callback => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    }
  });

  async function load() {
    for (const name of ['desktop_compat.js', 'office_router.js', 'chat_enhancer.js']) {
      try {
        const source = await ipcRenderer.invoke('agcf:get-core-module', name);
        if (!source) throw new Error(`missing module: ${name}`);
        await webFrame.executeJavaScript(source);
      } catch (error) {
        console.error('[AntigravityCoreFixes] module load failed:', name, error);
      }
    }
    await webFrame.executeJavaScript(`window.__antigravityCoreFixes = Object.freeze({loaded: true, runtime: 'user-plugin', version: '2.0.0'});`);
    console.info('[AntigravityCoreFixes] update-safe plugin loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void load(), {once: true});
  } else {
    void load();
  }
}
