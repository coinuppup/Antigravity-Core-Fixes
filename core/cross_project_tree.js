/* Browse registered project folders without changing the active conversation. */
(() => {
  window.__agCrossProjectTreeCleanup?.();
  const api = window.antigravityFS;
  if (!api?.listNavigationRoots || !api?.readDirEntries) return;

  const style = document.createElement('style');
  style.id = 'ag-cross-project-tree-style';
  style.textContent = `
    .ag-nav-panel{position:relative;display:flex;flex-direction:column;min-height:0;padding:0 8px;gap:6px;font:12px system-ui;color:var(--foreground)}
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
    .ag-nav-tree{min-height:0;overflow:auto;flex:1;display:none;border-top:1px solid var(--border);padding-top:4px}
    .ag-nav-row{display:flex;align-items:center;gap:5px;width:100%;padding:4px 6px;min-width:0}
    .ag-nav-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ag-nav-status{padding:8px;color:var(--muted-foreground)}
    .ag-new-chat-files{position:fixed;top:74px;right:20px;bottom:155px;width:min(320px,calc(100vw - 40px));z-index:25;display:flex;flex-direction:column;align-items:flex-end;pointer-events:none}
    .ag-new-chat-files button,.ag-new-chat-files input,.ag-new-chat-files select{pointer-events:auto}
    .ag-new-chat-files-toggle{border:1px solid var(--border);border-radius:8px;background:var(--background);color:var(--foreground);padding:7px 11px;cursor:pointer;box-shadow:0 2px 8px #0002}
    .ag-new-chat-files-drawer{display:flex;flex-direction:column;min-height:0;width:100%;flex:1;margin-top:8px;padding:10px 0;border:1px solid var(--border);border-radius:10px;background:var(--background);box-shadow:0 8px 26px #0002;pointer-events:auto}
    .ag-new-chat-files-heading{padding:2px 14px 10px;font-size:13px;font-weight:600}
    .ag-new-chat-files-drawer .ag-nav-panel{flex:1;min-height:0}
    @media(max-width:800px){.ag-new-chat-files{top:65px;bottom:125px}}
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
  const draftHost = document.createElement('div');
  draftHost.className = 'ag-new-chat-files';
  draftHost.innerHTML = '<button type="button" class="ag-new-chat-files-toggle" aria-label="打开或关闭文件树">📁 文件树</button><div class="ag-new-chat-files-drawer"><div class="ag-new-chat-files-heading">文件树 · 拖入当前对话</div></div>';
  const draftDrawer = draftHost.querySelector('.ag-new-chat-files-drawer');
  draftHost.querySelector('.ag-new-chat-files-toggle').onclick = () => {
    draftDrawer.style.display = draftDrawer.style.display === 'none' ? 'flex' : 'none';
  };
  let navigation = {home: '', projects: []};
  let selected = null;
  let sidebar = null;
  let nativeWrapper = null;
  let routeKey = '';
  let searchTimer = null;
  let generation = 0;
  let attachTimer = null;
  let disposed = false;

  const projectId = () => new URL(location.href).searchParams.get('project') || '';
  const isDraft = () => location.pathname === '/' && Boolean(document.querySelector('[data-lexical-editor="true"]'));
  const defaultDraftFolder = () => {
    const project = navigation.projects.find(item => item.id === projectId());
    const folder = project?.folders[0];
    return folder ? {path: folder.path, name: project.name + ' / ' + folder.name} :
      navigation.home ? {path: navigation.home, name: '主目录'} : null;
  };
  const parentPath = value => value === '/' ? '/' : value.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';

  function row(parent, name, subtitle, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ag-nav-row';
    button.title = subtitle || name;
    const label = document.createElement('span');
    label.textContent = name;
    button.appendChild(label);
    button.onclick = onClick;
    parent.appendChild(button);
    return button;
  }

  function openFile(filePath) {
    const core = window.__antigravityToolkitCore;
    const open = core?.getOpenFileFn?.();
    if (!open || !core?.pathToCanonicalFileUri) {
      tree.textContent = '当前页面无法打开文件，请先进入一个会话。';
      return;
    }
    open(core.pathToCanonicalFileUri(filePath));
  }

  function enableFileDrag(button, filePath) {
    const uri = window.__antigravityToolkitCore?.pathToCanonicalFileUri?.(filePath);
    if (!uri) return;
    // Reuse the existing workspace drag dispatcher and its chat mention payload.
    button.setAttribute('role', 'treeitem');
    button.setAttribute('data-uri', uri);
    button.setAttribute('data-path', filePath);
    button.draggable = true;
    button.title = `${filePath}\n拖入聊天输入框以引用文件`;
  }

  async function children(container, dir, depth, token) {
    let entries;
    try { entries = await api.readDirEntries(dir); }
    catch (error) { if (token === generation) container.textContent = `无法读取目录：${error.message}`; return; }
    if (token !== generation || !container.isConnected) return;
    if (!entries.length) row(container, '（空目录）', '', () => {});
    for (const entry of entries) {
      const item = row(container, `${entry.isDirectory ? '▸ 📁' : '  📄'} ${entry.name}`, entry.path, () => {
        if (!entry.isDirectory) { openFile(entry.path); return; }
        const nested = item.nextElementSibling?.classList.contains('ag-nav-children') ? item.nextElementSibling : null;
        if (nested) { nested.hidden = !nested.hidden; return; }
        const child = document.createElement('div');
        child.className = 'ag-nav-children';
        child.style.paddingLeft = '14px';
        item.after(child);
        void children(child, entry.path, depth + 1, token);
      });
      if (!entry.isDirectory) enableFileDrag(item, entry.path);
      if (entry.isDirectory) item.ondblclick = event => { event.preventDefault(); event.stopPropagation(); select(entry.path, entry.name); };
    }
  }

  function syncVisibility() {
    const active = Boolean(selected || searchInput.value.trim());
    tree.style.display = active ? 'block' : 'none';
    panel.style.flex = active ? '1 1 0%' : '0 0 auto';
    if (nativeWrapper) nativeWrapper.style.display = active ? 'none' : '';
    locationButton.textContent = (selected?.name || '当前项目目录') + ' ▾';
    locationButton.title = selected?.path || '当前会话项目';
    upButton.disabled = !selected || selected.path === '/';
  }

  function select(dir, name) {
    if (!dir && isDraft()) {
      const fallback = defaultDraftFolder();
      if (fallback) { dir = fallback.path; name = fallback.name; }
    }
    selected = dir ? {path: dir, name: name || dir.split('/').pop() || '/'} : null;
    searchInput.value = '';
    menu.hidden = true;
    const token = ++generation;
    tree.replaceChildren();
    syncVisibility();
    if (selected) {
      row(tree, `📁 ${selected.name}`, selected.path, () => {});
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
    option('当前项目目录', isDraft() ? '浏览新对话所选项目' : '返回反重力原生文件树', () => select(null));
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
      const resultRow = row(tree, `${item.isDirectory ? '📁' : '📄'} ${all && item.projectName ? item.projectName + ' / ' : ''}${item.name}`, item.path, () =>
        item.isDirectory ? select(item.path, item.name) : openFile(item.path));
      if (!item.isDirectory) enableFileDrag(resultRow, item.path);
    }
    if (result.truncated) row(tree, '结果已截断，请输入更具体的名称', '', () => {});
  }

  locationButton.onclick = () => { rebuildMenu(); menu.hidden = !menu.hidden; };
  upButton.onclick = () => { if (selected) { const path = parentPath(selected.path); select(path, path.split('/').pop() || '/'); } };
  searchInput.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => void search(), 300); };
  scopeSelect.onchange = () => { if (searchInput.value.trim()) void search(); };

  function attach() {
    if (disposed) return;
    const key = location.pathname + ':' + projectId();
    if (routeKey && routeKey !== key) select(null);
    routeKey = key;
    const next = document.querySelector('[data-testid="tab-file-tree-sidebar"]');
    if (!next) {
      sidebar = null;
      nativeWrapper = null;
      if (!isDraft()) { draftHost.remove(); panel.remove(); return; }
      if (!draftHost.isConnected) document.body.appendChild(draftHost);
      if (panel.parentElement !== draftDrawer) draftDrawer.appendChild(panel);
      if (!selected && navigation.home) select(null);
      syncVisibility();
      return;
    }
    draftHost.remove();
    const wrapper = next.querySelector('[role="tree"]:not(.ag-nav-tree)')?.parentElement;
    if (!wrapper) return;
    sidebar = next;
    nativeWrapper = wrapper;
    if (panel.parentElement !== wrapper.parentElement) wrapper.before(panel);
    syncVisibility();
  }

  const observer = new MutationObserver(() => {
    if (attachTimer !== null) return;
    attachTimer = setTimeout(() => { attachTimer = null; attach(); }, 100);
  });
  observer.observe(document.body, {childList: true, subtree: true});
  const poller = setInterval(attach, 2000);
  api.listNavigationRoots().then(value => {
    navigation = value;
    if (isDraft() && !selected) select(null);
    rebuildMenu();
  }).catch(() => {});
  attach();
  window.__agCrossProjectTreeCleanup = () => {
    disposed = true;
    observer.disconnect();
    clearInterval(poller);
    clearTimeout(attachTimer);
    clearTimeout(searchTimer);
    if (nativeWrapper) nativeWrapper.style.display = '';
    panel.remove();
    draftHost.remove();
    style.remove();
  };
})();
