'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {fileURLToPath} = require('node:url');

function folderPath(resource) {
  const uri = resource?.folderUri || resource?.gitFolder?.folderUri;
  if (typeof uri !== 'string' || !uri.startsWith('file:')) return null;
  try {
    const value = fileURLToPath(uri);
    return fs.statSync(value).isDirectory() ? value : null;
  } catch (_) { return null; }
}

function listNavigationRoots(home = os.homedir()) {
  const dir = path.join(home, '.gemini', 'config', 'projects');
  const projects = [];
  let files = [];
  try { files = fs.readdirSync(dir).filter(name => name.endsWith('.json')); } catch (_) {}
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      const seen = new Set();
      const folders = [];
      for (const resource of data.projectResources?.resources || []) {
        const value = folderPath(resource);
        if (!value || seen.has(value)) continue;
        seen.add(value);
        folders.push({path: value, name: path.basename(value) || value});
      }
      if (folders.length) projects.push({id: path.basename(file, '.json'), name: data.name || folders[0].name, folders});
    } catch (_) {}
  }
  projects.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  return {home, projects};
}

const SKIP_DIRS = new Set(['.git', 'node_modules', '.venv', 'venv', '__pycache__', '.next', 'dist', 'build']);

async function searchNavigationFiles(query, roots, {limit = 100, maxDirectories = 3000} = {}) {
  const needle = String(query || '').trim().toLocaleLowerCase();
  if (!needle) return {items: [], truncated: false};
  const items = [];
  const seen = new Set();
  const queue = roots.filter(root => root && typeof root.path === 'string').map(root => ({...root}));
  let visited = 0;
  while (queue.length && items.length < limit && visited < maxDirectories) {
    const root = queue.shift();
    if (seen.has(root.path)) continue;
    seen.add(root.path);
    visited++;
    let entries;
    try { entries = await fs.promises.readdir(root.path, {withFileTypes: true}); } catch (_) { continue; }
    for (const entry of entries) {
      if (items.length >= limit) break;
      const entryPath = path.join(root.path, entry.name);
      const isDirectory = entry.isDirectory();
      if (entry.name.toLocaleLowerCase().includes(needle)) {
        items.push({name: entry.name, path: entryPath, isDirectory, projectName: root.projectName || ''});
      }
      if (isDirectory && !SKIP_DIRS.has(entry.name)) queue.push({path: entryPath, projectName: root.projectName});
    }
  }
  return {items, truncated: queue.length > 0};
}

module.exports = {listNavigationRoots, searchNavigationFiles};
