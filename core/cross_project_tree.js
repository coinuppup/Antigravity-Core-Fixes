/* Browse registered project folders without changing the active conversation. */
(() => {
  window.__agCrossProjectTreeCleanup?.();
  const api = window.antigravityFS;
  if (!api?.listNavigationRoots || !api?.readDirEntries) return;

  const style = document.createElement('style');
  style.id = 'ag-cross-project-tree-style';
  style.textContent = `
    .ag-nav-panel{position:relative;display:flex;flex-direction:column;min-height:0;padding:0 10px;gap:8px;font:13px system-ui;color:var(--foreground)}
    .ag-nav-controls{display:flex;gap:4px;align-items:center}
    .ag-nav-controls button,.ag-nav-menu button,.ag-nav-row{border:0;background:transparent;color:inherit;cursor:pointer;border-radius:6px;text-align:left}
    .ag-nav-controls button{padding:5px 7px;background:var(--secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ag-nav-controls .ag-nav-location{flex:1;min-width:0}
    .ag-nav-controls button:hover,.ag-nav-menu button:hover,.ag-nav-row:hover{background:var(--secondary)}
    .ag-nav-menu{position:absolute;top:29px;left:8px;right:8px;z-index:30;max-height:280px;overflow:auto;border:1px solid var(--border);border-radius:8px;background:var(--background);box-shadow:0 8px 24px #0003;padding:4px}
    .ag-nav-menu button{display:block;width:100%;padding:6px 8px}
    .ag-nav-menu small{display:block;color:var(--muted-foreground);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ag-nav-search{display:flex;gap:4px}
    .ag-nav-search input{min-width:0;flex:1;padding:5px 7px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:var(--foreground)}
    .ag-nav-search select{max-width:90px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:var(--foreground)}
    .ag-nav-tree{min-height:0;overflow:auto;flex:1;border-top:1px solid var(--border);padding-top:5px}
    .ag-nav-row{display:flex;align-items:center;gap:7px;width:100%;padding:5px 8px;min-width:0;min-height:32px}
    .ag-nav-row:focus-visible,.ag-floating-files-toggle:focus-visible,.ag-floating-files-close:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
    .ag-nav-row img{width:16px;height:16px;flex:none;pointer-events:none}
    .ag-nav-row .ag-nav-chevron{width:10px;flex:none;color:var(--muted-foreground);font-size:11px}
    .ag-nav-row .ag-nav-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ag-nav-children{margin-left:15px;padding-left:11px;border-left:1px solid var(--border)}
    .ag-nav-status{padding:8px;color:var(--muted-foreground)}
    .ag-floating-files{position:fixed;z-index:45;width:44px;height:44px;pointer-events:none}
    .ag-floating-files-toggle{position:relative;z-index:1;pointer-events:auto;width:44px;height:44px;display:grid;place-items:center;border:1px solid var(--border);border-radius:13px;background:var(--background);color:var(--foreground);box-shadow:0 5px 18px #0002;cursor:grab;touch-action:none}
    .ag-floating-files-toggle:active{cursor:grabbing}
    .ag-floating-files-toggle img{width:22px;height:22px;pointer-events:none}
    .ag-floating-files-drawer{position:fixed;display:flex;flex-direction:column;width:min(360px,calc(100vw - 24px));height:min(620px,calc(100vh - 24px));min-height:0;padding:10px 0;border:1px solid var(--border);border-radius:12px;background:var(--background);box-shadow:0 12px 36px #0003;pointer-events:auto}
    .ag-floating-files-drawer[hidden]{display:none}
    .ag-floating-files-heading{display:flex;align-items:center;justify-content:space-between;padding:2px 12px 10px;font-size:13px;font-weight:600}
    .ag-floating-files-hint{padding:0 12px 9px;color:var(--muted-foreground);font-size:11px}
    .ag-floating-files-close{border:0;background:transparent;color:var(--muted-foreground);border-radius:5px;cursor:pointer;font-size:20px;line-height:1}
    .ag-floating-files-drawer .ag-nav-panel{flex:1;min-height:0}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'ag-nav-panel';
    panel.innerHTML = '<div class="ag-nav-controls"><button class="ag-nav-location" type="button" aria-label="选择项目或目录">当前位置 ▾</button><button class="ag-nav-up" type="button" title="上级目录">↑</button></div><div class="ag-nav-menu" hidden></div><div class="ag-nav-search"><input type="search" placeholder="搜索文件" aria-label="搜索文件"><select aria-label="搜索范围"><option value="current">当前项目/目录</option><option value="all-projects">所有项目</option></select></div><div class="ag-nav-tree" role="tree"></div>';
  const locationButton = panel.querySelector('.ag-nav-location');
  const upButton = panel.querySelector('.ag-nav-up');
  const menu = panel.querySelector('.ag-nav-menu');
  const searchInput = panel.querySelector('input');
  const scopeSelect = panel.querySelector('select');
  const tree = panel.querySelector('.ag-nav-tree');
  const host = document.createElement('div');
  host.className = 'ag-floating-files';
  host.innerHTML = '<button type="button" class="ag-floating-files-toggle" aria-label="打开文件树" aria-expanded="false" title="文件树 · 拖动图标可移动"><img src="/symbols-icons/icons/folders/folder.svg" alt=""></button><div class="ag-floating-files-drawer" hidden><div class="ag-floating-files-heading"><span>文件树</span><button type="button" class="ag-floating-files-close" aria-label="收起文件树">×</button></div><div class="ag-floating-files-hint"></div></div>';
  const toggle = host.querySelector('.ag-floating-files-toggle');
  const drawer = host.querySelector('.ag-floating-files-drawer');
  const hint = host.querySelector('.ag-floating-files-hint');
  let navigation = {home: '', projects: []};
  let selected = null;
  let routeKey = '';
  let searchTimer = null;
  let generation = 0;
  let attachTimer = null;
  let disposed = false;

  const projectId = () => new URL(location.href).searchParams.get('project') || '';
  const defaultFolder = () => {
    const project = navigation.projects.find(item => item.id === projectId());
    const folder = project?.folders[0];
    return folder ? {path: folder.path, name: project.name + ' / ' + folder.name} :
      navigation.home ? {path: navigation.home, name: '主目录'} : null;
  };
  const parentPath = value => value === '/' ? '/' : value.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';

  const positionKey = 'ag-floating-files-position';
  let savedPosition = null;
  try { savedPosition = JSON.parse(localStorage.getItem(positionKey)); } catch (_) {}
  let position = {x: Number(savedPosition?.x) || innerWidth - 64, y: Number(savedPosition?.y) || 94};
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function place() {
    position.x = clamp(position.x, 12, Math.max(12, innerWidth - 56));
    position.y = clamp(position.y, 12, Math.max(12, innerHeight - 56));
    host.style.left = `${position.x}px`;
    host.style.top = `${position.y}px`;
    const width = Math.min(360, innerWidth - 24);
    const height = Math.min(620, innerHeight - 24);
    drawer.style.left = `${clamp(position.x + 44 - width, 12, innerWidth - width - 12)}px`;
    drawer.style.top = `${clamp(position.y + 50, 12, innerHeight - height - 12)}px`;
  }
  let dragging = null;
  let suppressClick = false;
  toggle.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragging = {id: event.pointerId, x: event.clientX, y: event.clientY, left: position.x, top: position.y, moved: false};
  });
  const onPointerMove = event => {
    if (!dragging || event.pointerId !== dragging.id) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    if (Math.hypot(dx, dy) > 4) dragging.moved = true;
    if (!dragging.moved) return;
    position = {x: dragging.left + dx, y: dragging.top + dy};
    place();
  };
  const onPointerUp = event => {
    if (!dragging || event.pointerId !== dragging.id) return;
    suppressClick = dragging.moved;
    if (suppressClick) setTimeout(() => { suppressClick = false; }, 0);
    if (dragging.moved) { try { localStorage.setItem(positionKey, JSON.stringify(position)); } catch (_) {} }
    dragging = null;
  };
  addEventListener('pointermove', onPointerMove, true);
  addEventListener('pointerup', onPointerUp, true);
  addEventListener('pointercancel', onPointerUp, true);
  toggle.onclick = () => {
    if (suppressClick) { suppressClick = false; return; }
    drawer.hidden = !drawer.hidden;
    toggle.setAttribute('aria-expanded', String(!drawer.hidden));
    toggle.setAttribute('aria-label', drawer.hidden ? '打开文件树' : '收起文件树');
    place();
  };
  host.querySelector('.ag-floating-files-close').onclick = () => {
    drawer.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开文件树');
    toggle.focus();
  };
  addEventListener('resize', place);

  const iconFor = (name, directory, expanded = false) => {
    if (directory) return `/symbols-icons/icons/folders/${expanded ? 'folder-open' : 'folder'}.svg`;
    const ext = name.split('.').pop().toLowerCase();
    const icons = {md:'markdown',markdown:'markdown',pdf:'pdf',py:'python',doc:'docx',docx:'docx',xls:'xlsx',xlsx:'xlsx',csv:'csv',json:'json',png:'image',jpg:'image',jpeg:'image',svg:'image',webp:'image',js:'js',jsx:'js',ts:'ts',tsx:'ts',go:'code',rs:'code',c:'code',cpp:'code',java:'code',sh:'code',txt:'document'};
    return `/symbols-icons/icons/files/${icons[ext] || 'document'}.svg`;
  };

  function row(parent, name, subtitle, onClick, directory = false, expandable = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ag-nav-row';
    button.title = subtitle || name;
    const chevron = document.createElement('span');
    chevron.className = 'ag-nav-chevron';
    chevron.textContent = expandable ? '▸' : '';
    button.appendChild(chevron);
    const icon = document.createElement('img');
    icon.src = iconFor(name, directory);
    icon.alt = '';
    icon.draggable = false;
    button.appendChild(icon);
    const label = document.createElement('span');
    label.className = 'ag-nav-name';
    label.textContent = name;
    button.appendChild(label);
    if (expandable) button.setAttribute('aria-expanded', 'false');
    button.onclick = onClick;
    parent.appendChild(button);
    return button;
  }

  function openFile(filePath) {
    const core = window.__antigravityToolkitCore;
    const open = core?.getOpenFileFn?.();
    if (!open || !core?.pathToCanonicalFileUri) {
      hint.textContent = '当前页面无法预览文件，请先进入一个对话。';
      return;
    }
    open(core.pathToCanonicalFileUri(filePath));
  }

  function enablePathDrag(button, filePath) {
    const uri = window.__antigravityToolkitCore?.pathToCanonicalFileUri?.(filePath);
    if (!uri) return;
    // Reuse the existing workspace drag dispatcher and its chat mention payload.
    button.setAttribute('role', 'treeitem');
    button.setAttribute('data-uri', uri);
    button.setAttribute('data-path', filePath);
    button.draggable = true;
    button.title = `${filePath}\n拖入聊天输入框以引用文件或目录`;
  }

  async function children(container, dir, depth, token) {
    let entries;
    try { entries = await api.readDirEntries(dir); }
    catch (error) { if (token === generation) container.textContent = `无法读取目录：${error.message}`; return; }
    if (token !== generation || !container.isConnected) return;
    if (!entries.length) { const empty = document.createElement('div'); empty.className = 'ag-nav-status'; empty.textContent = '（空目录）'; container.appendChild(empty); }
    for (const entry of entries) {
      const item = row(container, entry.name, entry.path, () => {
        if (!entry.isDirectory) { openFile(entry.path); return; }
        const nested = item.nextElementSibling?.classList.contains('ag-nav-children') ? item.nextElementSibling : null;
        if (nested) { nested.hidden = !nested.hidden; item.setAttribute('aria-expanded', String(!nested.hidden)); item.querySelector('.ag-nav-chevron').textContent = nested.hidden ? '▸' : '▾'; item.querySelector('img').src = iconFor(entry.name, true, !nested.hidden); return; }
        const child = document.createElement('div');
        child.className = 'ag-nav-children';
        item.after(child);
        item.setAttribute('aria-expanded', 'true');
        item.querySelector('.ag-nav-chevron').textContent = '▾';
        item.querySelector('img').src = iconFor(entry.name, true, true);
        void children(child, entry.path, depth + 1, token);
      }, entry.isDirectory, entry.isDirectory);
      enablePathDrag(item, entry.path);
      if (entry.isDirectory) item.ondblclick = event => { event.preventDefault(); event.stopPropagation(); select(entry.path, entry.name); };
    }
  }

  function syncVisibility() {
    locationButton.textContent = (selected?.name || '选择目录') + ' ▾';
    locationButton.title = selected?.path || '选择浏览目录';
    upButton.disabled = !selected || selected.path === '/';
  }

  function select(dir, name) {
    if (!dir) {
      const fallback = defaultFolder();
      if (fallback) { dir = fallback.path; name = fallback.name; }
    }
    selected = dir ? {path: dir, name: name || dir.split('/').pop() || '/'} : null;
    searchInput.value = '';
    menu.hidden = true;
    const token = ++generation;
    tree.replaceChildren();
    syncVisibility();
    if (selected) {
      enablePathDrag(row(tree, selected.name, selected.path, () => {}, true), selected.path);
      void children(tree, selected.path, 0, token);
    }
  }

  function rebuildMenu() {
    menu.replaceChildren();
    const option = (name, subtitle, onClick) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = name;
      if (subtitle) { const small = document.createElement('small'); small.textContent = subtitle; button.appendChild(small); }
      button.onclick = onClick;
      menu.appendChild(button);
    };
    option('当前项目目录', '浏览当前页面所选项目', () => select(null));
    option('主目录', navigation.home, () => select(navigation.home, '主目录'));
    option('文件系统根目录', '/', () => select('/', '/'));
    for (const project of navigation.projects) {
      for (const folder of project.folders) {
        option(`${project.name} / ${folder.name}`, folder.path, () => select(folder.path, `${project.name} / ${folder.name}`));
      }
    }
  }

  async function search() {
    const query = searchInput.value.trim();
    const token = ++generation;
    tree.replaceChildren();
    syncVisibility();
    if (!query) { if (selected) select(selected.path, selected.name); return; }
    const all = scopeSelect.value === 'all-projects';
    const scope = all ? 'all-projects' : selected ? 'directory' : 'project';
    const result = await api.searchNavigationFiles(query, scope, selected?.path, projectId()).catch(() => null);
    if (token !== generation) return;
    if (!result) { tree.textContent = '搜索失败'; return; }
    if (!result.items.length) { tree.textContent = '未找到匹配文件'; return; }
    for (const item of result.items) {
      const resultRow = row(tree, `${all && item.projectName ? item.projectName + ' / ' : ''}${item.name}`, item.path, () =>
        item.isDirectory ? select(item.path, item.name) : openFile(item.path), item.isDirectory);
      enablePathDrag(resultRow, item.path);
    }
    if (result.truncated) row(tree, '结果已截断，请输入更具体的名称', '', () => {});
  }

  locationButton.onclick = () => { rebuildMenu(); menu.hidden = !menu.hidden; };
  upButton.onclick = () => { if (selected) { const path = parentPath(selected.path); select(path, path.split('/').pop() || '/'); } };
  searchInput.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => void search(), 300); };
  scopeSelect.onchange = () => { if (searchInput.value.trim()) void search(); };

  function attach() {
    if (disposed) return;
    const key = projectId();
    if (routeKey !== key && navigation.home) select(null);
    routeKey = key;
    if (!host.isConnected) document.body.appendChild(host);
    if (panel.parentElement !== drawer) drawer.appendChild(panel);
    if (!selected && navigation.home) select(null);
    const nextHint = document.querySelector('[data-lexical-editor="true"]') ? '拖动文件或目录到当前对话输入框' : '浏览文件；进入对话后可拖入输入框';
    if (hint.textContent !== nextHint) hint.textContent = nextHint;
    place();
  }

  const observer = new MutationObserver(() => {
    if (attachTimer !== null) return;
    attachTimer = setTimeout(() => { attachTimer = null; attach(); }, 100);
  });
  observer.observe(document.body, {childList: true, subtree: true});
  const poller = setInterval(attach, 2000);
  api.listNavigationRoots().then(value => {
    navigation = value;
    if (!selected) select(null);
    rebuildMenu();
  }).catch(() => {});
  attach();
  window.__agCrossProjectTreeCleanup = () => {
    disposed = true;
    observer.disconnect();
    clearInterval(poller);
    clearTimeout(attachTimer);
    clearTimeout(searchTimer);
    panel.remove();
    host.remove();
    style.remove();
    removeEventListener('resize', place);
    removeEventListener('pointermove', onPointerMove, true);
    removeEventListener('pointerup', onPointerUp, true);
    removeEventListener('pointercancel', onPointerUp, true);
  };
})();
