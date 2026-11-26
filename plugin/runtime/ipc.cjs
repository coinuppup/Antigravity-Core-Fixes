'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFile} = require('node:child_process');

const ASSETS = new Set(['xlsx.full.min.js', 'jszip.min.js', 'docx-preview.min.js', 'PptxViewJS.min.js']);
const MODULES = new Set(['desktop_compat.js', 'office_router.js', 'chat_enhancer.js']);
const MAX_FILE_BYTES = 100 * 1024 * 1024;

function cleanLocalPath(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  let value = raw.split('#')[0].split('?')[0].trim();
  try { value = decodeURIComponent(value); } catch (_) {}
  if (/^file:/i.test(value)) {
    try { value = require('node:url').fileURLToPath(value); } catch (_) {
      value = value.replace(/^file:\/\/+/, process.platform === 'win32' ? '' : '/');
    }
  }
  return path.normalize(value);
}

function smartResolve(raw) {
  const requested = cleanLocalPath(raw);
  if (!requested) return null;
  if (fs.existsSync(requested)) return {path: requested, isHealed: false, isFile: fs.statSync(requested).isFile()};
  const ext = path.extname(requested).toLowerCase();
  const stem = path.basename(requested, ext).split(/[（(]/)[0].trim();
  let ancestor = path.dirname(requested);
  while (ancestor && ancestor !== path.dirname(ancestor) && !fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  if (!ancestor || !fs.existsSync(ancestor)) return {path: requested, isHealed: false, isFile: false};
  function search(dir, depth) {
    if (depth > 4) return null;
    let entries;
    try { entries = fs.readdirSync(dir, {withFileTypes: true}); } catch (_) { return null; }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (ext && path.extname(entry.name).toLowerCase() !== ext) continue;
      if (entry.name.includes(stem) || (stem.length > 6 && entry.name.includes(stem.slice(0, 8)))) {
        return path.join(dir, entry.name);
      }
    }
    for (const entry of entries) if (entry.isDirectory()) {
      const found = search(path.join(dir, entry.name), depth + 1);
      if (found) return found;
    }
    return null;
  }
  const found = search(ancestor, 0);
  return found ? {path: found, isHealed: true, isFile: true} : {path: ancestor, isHealed: false, isFile: false, nearestDir: ancestor};
}

function trusted(event) {
  try {
    const u = new URL(event.senderFrame?.url || event.sender?.getURL() || '');
    return u.protocol === 'https:' && u.hostname === '127.0.0.1';
  } catch (_) { return false; }
}

function register({electron, pluginRoot}) {
  const {app, BrowserWindow, clipboard, ipcMain, nativeImage, shell} = electron;
  const handles = [];
  const handle = (channel, fn) => {
    ipcMain.handle(channel, async (event, ...args) => {
      if (!trusted(event)) throw new Error('Untrusted Antigravity Core Fixes IPC sender');
      return fn(event, ...args);
    });
    handles.push(channel);
  };

  handle('agcf:get-core-module', async (_event, name) => {
    if (!MODULES.has(name)) return null;
    return fs.promises.readFile(path.join(pluginRoot, 'core', name), 'utf8');
  });
  handle('agcf:get-office-asset', async (_event, name) => {
    if (!ASSETS.has(name)) return null;
    return fs.promises.readFile(path.join(pluginRoot, 'assets', name), 'utf8');
  });
  handle('agcf:read-file-bytes', async (_event, raw) => {
    const resolved = smartResolve(raw);
    if (!resolved?.isFile) return null;
    const stat = await fs.promises.stat(resolved.path);
    if (stat.size > MAX_FILE_BYTES) return {__agFileError: 'OFFICE_PREVIEW_TOO_LARGE', size: stat.size, maxBytes: MAX_FILE_BYTES};
    const data = await fs.promises.readFile(resolved.path);
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  });
  handle('agcf:read-file-text', async (_event, raw) => {
    const resolved = smartResolve(raw);
    if (!resolved?.isFile) return null;
    const stat = await fs.promises.stat(resolved.path);
    if (stat.size > MAX_FILE_BYTES) return null;
    return fs.promises.readFile(resolved.path, 'utf8');
  });
  handle('agcf:resolve-file-path', async (_event, raw) => smartResolve(raw));
  handle('agcf:read-dir-entries', async (_event, raw) => {
    const dir = cleanLocalPath(raw);
    if (!dir) return [];
    const entries = await fs.promises.readdir(dir, {withFileTypes: true});
    return entries.map(entry => ({name: entry.name, path: path.join(dir, entry.name), isDirectory: entry.isDirectory()}))
      .sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
  });
  handle('agcf:reveal-in-explorer', async (_event, raw) => {
    const resolved = smartResolve(raw);
    if (!resolved?.path || !fs.existsSync(resolved.path)) return false;
    if (resolved.isFile) shell.showItemInFolder(resolved.path);
    else await shell.openPath(resolved.path);
    return true;
  });
  handle('agcf:focus-window', async () => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (!win) return false;
    if (win.isMinimized()) win.restore();
    win.show(); win.focus(); app.focus({steal: true});
    return true;
  });
  handle('agcf:copy-files-to-clipboard', async (_event, values) => {
    const paths = (Array.isArray(values) ? values : []).map(cleanLocalPath).filter(p => p && fs.existsSync(p));
    if (!paths.length) return false;
    clipboard.writeText(paths.join('\n'));
    if (process.platform === 'darwin' && paths.length === 1) clipboard.writeBuffer('public.file-url', Buffer.from(`file://${encodeURI(paths[0])}`));
    return true;
  });
  handle('agcf:get-conversation-turns', async (_event, conversationId) => {
    if (typeof conversationId !== 'string') return [];
    const transcript = path.join(os.homedir(), '.gemini', 'antigravity', 'brain', path.basename(conversationId), '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(transcript)) return [];
    const turns = [];
    for (const line of (await fs.promises.readFile(transcript, 'utf8')).split('\n')) {
      try {
        const step = JSON.parse(line);
        if (step.type !== 'USER_INPUT') continue;
        let prompt = String(step.content || '').trim();
        if (prompt.includes('<USER_REQUEST>')) prompt = prompt.split('<USER_REQUEST>')[1].split('</USER_REQUEST>')[0].trim();
        const first = prompt.split('\n')[0].trim();
        turns.push({turnIndex: turns.length + 1, stepIndex: step.step_index, createdAt: step.created_at, prompt: prompt.slice(0, 300), title: first.slice(0, 50) || '（用户输入）'});
      } catch (_) {}
    }
    return turns;
  });
  handle('agcf:get-conversation-workspace', async (_event, conversationId, sectionId) => {
    const projectDir = path.join(os.homedir(), '.gemini', 'config', 'projects');
    const projectUri = id => {
      if (!id || id === 'outside-of-project') return null;
      try { return JSON.parse(fs.readFileSync(path.join(projectDir, `${path.basename(id)}.json`), 'utf8')).projectResources?.resources?.[0]?.folderUri || null; }
      catch (_) { return null; }
    };
    const direct = projectUri(sectionId);
    if (direct) return {ok: true, isProject: true, projectId: sectionId, workspaceUri: direct};
    const db = path.join(os.homedir(), '.gemini', 'antigravity', 'conversation_summaries.db');
    if (!fs.existsSync(db) || typeof conversationId !== 'string') return {ok: true, isProject: false, workspaceUri: null};
    const code = 'import sqlite3,json,sys\nrow=sqlite3.connect(sys.argv[1]).execute("SELECT project_id, workspace_uris FROM conversation_summaries WHERE conversation_id=?",(sys.argv[2],)).fetchone()\nprint(json.dumps(row or []))';
    const py = process.platform === 'win32' ? 'python' : '/usr/bin/python3';
    const row = await new Promise(resolve => execFile(py, ['-c', code, db, conversationId], {windowsHide: true}, (err, stdout) => {
      if (err) return resolve([]);
      try { resolve(JSON.parse(stdout)); } catch (_) { resolve([]); }
    }));
    const native = projectUri(row[0]);
    if (native) return {ok: true, isProject: true, projectId: row[0], workspaceUri: native};
    try {
      const uris = JSON.parse(row[1] || '[]');
      if (uris[0]) return {ok: true, isProject: Boolean(row[0] && row[0] !== 'outside-of-project'), projectId: row[0], workspaceUri: uris[0]};
    } catch (_) {}
    return {ok: true, isProject: false, workspaceUri: null};
  });

  let watcher = null;
  let watchedPath = null;
  let debounce = null;
  handle('agcf:watch-workspace', async (event, raw) => {
    const dir = cleanLocalPath(raw);
    if (!dir || !fs.existsSync(dir)) return false;
    if (watcher && watchedPath === dir) return true;
    watcher?.close();
    watchedPath = dir;
    watcher = fs.watch(dir, {recursive: true}, (eventType, filename) => {
      if (filename && /\.(tmp|crswap)$/.test(filename)) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (!event.sender.isDestroyed()) event.sender.send('agcf:workspace-changed', {workspacePath: dir, eventType, filename});
      }, 300);
    });
    return true;
  });
  handle('agcf:unwatch-workspace', async () => {
    watcher?.close(); watcher = null; watchedPath = null; return true;
  });
  ipcMain.on('agcf:start-drag', (event, values) => {
    if (!trusted(event)) return;
    const files = (Array.isArray(values) ? values : [values]).map(cleanLocalPath).filter(p => p && fs.existsSync(p));
    if (!files.length) return;
    event.sender.startDrag({files, file: files[0], icon: nativeImage.createEmpty()});
  });

  return () => {
    for (const channel of handles) ipcMain.removeHandler(channel);
    watcher?.close();
  };
}

module.exports = {cleanLocalPath, register, smartResolve};
