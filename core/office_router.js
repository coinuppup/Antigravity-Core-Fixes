/**
 * Antigravity Native Office & Data High-Fidelity Viewer Router
 * Supports: .xlsx, .xls, .csv, .tsv, .docx, .pptx, .pdf
 * 100% Client-Side, In-Place Replacement for Monaco binary view.
 * 2026-10-22-pptx-jszip-fix-v2
 */
(function initializeOfficeRouter() {
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', initializeOfficeRouter, {once:true});
    return;
  }
  if (typeof window.__antigravityOfficeRouterCleanup === 'function') {
    try { window.__antigravityOfficeRouterCleanup(); } catch(e) {}
  }
  const oldStylesInit = document.getElementById('ag-pdf-engine-styles');
  if (oldStylesInit) oldStylesInit.remove();
  window.__antigravityOfficeRouterInitialized = true;
  try { localStorage.removeItem('antigravity_pdf_engine_mode'); } catch(e) {}
  const oldSwitchBtn = document.getElementById('ag-pdf-switch-to-fast-btn');
  if (oldSwitchBtn) oldSwitchBtn.remove();

  console.log('[OfficeRouter] Initializing Native Office Preview Engine...');

  let _lastMountedPath = null;
  let _currentHost = null;

  function safeDecode(str) {
    if (!str || typeof str !== 'string') return '';
    try { return decodeURIComponent(str); } catch(e) { return str; }
  }

  const IS_MACOS = /Mac/i.test(((navigator && navigator.platform) || '') + ' ' + ((navigator && navigator.userAgent) || ''));

  function normalizeFilePath(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let p = raw.split('#')[0].split('?')[0].trim();
    p = safeDecode(p);
    p = safeDecode(p);
    if (IS_MACOS) {
      if (/^file:\/\//i.test(p)) p = p.replace(/^file:\/\//i, '');
      else p = p.replace(/^file:[\\/]+/i, '');
      p = p.replace(/\\/g, '/');
      return p.startsWith('/') ? p : '/' + p;
    }
    p = p.replace(/^file:[\\/]+/i, '');
    p = p.replace(/\//g, '\\');
    return p;
  }

  // --- Client-Side Smart File Path Self-Healing Engine ---
  async function smartResolveFilePath(targetPath) {
  window.__smartResolveFilePathClient = smartResolveFilePath;
    if (!targetPath) return { path: targetPath, isHealed: false, isFile: false };
    const clean = normalizeFilePath(targetPath) || '';
    const pathSeparator = clean.includes('\\') && !clean.includes('/') ? '\\' : '/';
    if (!clean) return { path: targetPath, isHealed: false, isFile: false };

    // 1. Try reading 1 byte to check if it already exists
    if (window.antigravityFS && typeof window.antigravityFS.readFileBytes === 'function') {
      try {
        const b = await window.antigravityFS.readFileBytes(clean);
        if (b && b.length > 0) return { path: clean, isHealed: false, isFile: true };
      } catch(e) {}
    }

    if (!window.antigravityFS || typeof window.antigravityFS.readDirEntries !== 'function') {
      return { path: clean, isHealed: false, isFile: false };
    }

    // 2. Extract baseKey and ext
    const parts = clean.split(pathSeparator);
    const fileName = parts.pop();
    const ext = fileName.includes('.') ? ('.' + fileName.split('.').pop().toLowerCase()) : '';
    let baseKey = fileName.slice(0, fileName.lastIndexOf('.') || fileName.length);
    const parenIdx = baseKey.search(/[（(]/);
    if (parenIdx !== -1) {
      baseKey = baseKey.slice(0, parenIdx).trim();
    }

    // 3. Find highest existing ancestor
    let ancestor = null;
    let cur = parts.join(pathSeparator);
    while (cur && cur.includes(pathSeparator)) {
      try {
        const entries = await window.antigravityFS.readDirEntries(cur);
        if (entries && entries.length > 0) {
          ancestor = cur;
          break;
        }
      } catch(e) {}
      cur = cur.substring(0, cur.lastIndexOf(pathSeparator));
    }

    if (!ancestor) return { path: clean, isHealed: false, isFile: false };

    // 4. Recursive search inside ancestor (max depth 4)
    async function searchDir(dir, depth = 0) {
      if (depth > 4) return null;
      try {
        const entries = await window.antigravityFS.readDirEntries(dir);
        if (!entries || !Array.isArray(entries)) return null;

        const tokens = baseKey.split(/[-_\s—·]+/).filter(t => t.length >= 3);
        for (const ent of entries) {
          if (!ent.isDirectory) {
            const entName = ent.name || '';
            if (ext && !entName.toLowerCase().endsWith(ext)) continue;
            if (entName.includes(baseKey) || (baseKey.length > 6 && entName.includes(baseKey.slice(0, 8)))) {
              return { path: ent.path, isHealed: true, isFile: true };
            }
            if (tokens.length > 0 && tokens.some(t => entName.includes(t))) {
              return { path: ent.path, isHealed: true, isFile: true };
            }
          }
        }
        for (const ent of entries) {
          if (ent.isDirectory) {
            const res = await searchDir(ent.path, depth + 1);
            if (res) return res;
          }
        }
      } catch(e) {}
      return null;
    }

    const match = await searchDir(ancestor, 0);
    if (match) return match;
    return { path: ancestor, isHealed: false, isFile: false, nearestDir: ancestor };
  }
  window.__smartResolveFilePathClient = smartResolveFilePath;
  async function doRevealInExplorer(targetPath) {
    if (!targetPath) return false;
    const resolved = await smartResolveFilePath(targetPath);
    let clean = (resolved && resolved.path) ? resolved.path : targetPath;
    clean = clean.split('#')[0].split('?')[0].trim();
    if (clean.startsWith('file://')) {
      try {
        clean = decodeURIComponent(clean.replace(/^file:[\/]+/i, ''));
      } catch(e) {}
    }
    let ok = false;
    if (window.antigravityFS && typeof window.antigravityFS.revealInExplorer === 'function') {
      try {
        ok = await window.antigravityFS.revealInExplorer(clean);
      } catch(e) {}
    }
    let fileUri = clean;
    if (!fileUri.startsWith('file://')) {
      let normalized = clean.replace(/\\/g, '/');
      if (!normalized.startsWith('/')) normalized = '/' + normalized;
      fileUri = 'file://' + encodeURI(normalized);
    }
    if (!ok && window.electronNative && typeof window.electronNative.revealInFilePicker === 'function') {
      try {
        await window.electronNative.revealInFilePicker(fileUri);
        ok = true;
      } catch(e) {}
    }
    return ok;
  }


  function getActiveFilePath() {
    // Tier 0: React Fiber on .jetski-pdf-viewer-host (authoritative for native PDF)
    try {
      const pdfHost = document.querySelector('.jetski-pdf-viewer-host');
      if (pdfHost) {
        for (const k in pdfHost) {
          if (k.startsWith('__reactFiber$')) {
            let f = pdfHost[k];
            while (f) {
              const props = f.memoizedProps;
              if (props) {
                for (const pk in props) {
                  const val = props[pk];
                  if (typeof val === 'string' && val.includes('.pdf')) {
                    return normalizeFilePath(val);
                  }
                }
              }
              f = f.return;
            }
          }
        }
      }
    } catch (e) {}

    // Tier 1: React Fiber on breadcrumbs navigation (authoritative in Workspace mode)
    try {
      const nav = document.querySelector('nav[aria-label="File path breadcrumbs"]');
      if (nav) {
        for (const k in nav) {
          if (k.startsWith('__reactFiber$')) {
            let f = nav[k];
            while (f) {
              const u = f.memoizedProps?.uri || f.memoizedProps?.fileUri;
              if (u && typeof u === 'string') {
                return normalizeFilePath(u);
              }
              f = f.return;
            }
          }
        }
      }
    } catch (e) {}

    // Tier 2: React Fiber on file viewer region
    try {
      const region = document.querySelector('[role="region"][aria-label="File Viewer"]');
      if (region) {
        for (const k in region) {
          if (k.startsWith('__reactFiber$')) {
            let f = region[k];
            while (f) {
              const u = f.memoizedProps?.fileUri || f.memoizedProps?.uri;
              if (u && typeof u === 'string') {
                return normalizeFilePath(u);
              }
              f = f.return;
            }
          }
        }
      }
    } catch (e) {}

    // Tier 3: URL search params (Outside of project / direct link)
    try {
      const u = new URL(window.location.href);
      const tab = u.searchParams.get('tab');
      if (tab) {
        if (tab.startsWith('file__')) {
          return normalizeFilePath(tab.slice(6));
        } else if (tab.startsWith('artifact__')) {
          return normalizeFilePath(tab.slice(10));
        }
      }
    } catch (e) {}

    return null;
  }

  function getFileExt(path) {
    if (!path) return '';
    const idx = path.lastIndexOf('.');
    return idx !== -1 ? path.slice(idx + 1).toLowerCase() : '';
  }

  function isOfficeOrData(ext) {
    return ['xlsx', 'xls', 'csv', 'tsv', 'docx', 'pptx', 'pdf'].includes(ext);
  }

  function execGlobal(code) {
    if (!code) return;
    try {
      const s = document.createElement('script');
      s.textContent = code;
      (document.head || document.documentElement).appendChild(s);
      s.remove();
    } catch (e) {
      (new Function(code))();
    }
  }

  async function ensureLib(name) {
    if (name === 'xlsx' && typeof XLSX !== 'undefined') return;
    if (name === 'docx' && typeof docx !== 'undefined' && typeof JSZip !== 'undefined') return;
    if (name === 'pptx' && typeof PptxViewJS?.PPTXViewer === 'function') return;

    if (!window.antigravityFS || !window.antigravityFS.getOfficeViewerAsset) {
      console.warn('[OfficeRouter] antigravityFS asset loader not available');
      return;
    }

    if (name === 'xlsx') {
      const code = await window.antigravityFS.getOfficeViewerAsset('xlsx.full.min.js');
      execGlobal(code);
    } else if (name === 'docx') {
      const jszipCode = await window.antigravityFS.getOfficeViewerAsset('jszip.min.js');
      execGlobal(jszipCode);
      const docxCode = await window.antigravityFS.getOfficeViewerAsset('docx-preview.min.js');
      execGlobal(docxCode);
    } else if (name === 'pptx') {
      // PptxViewJS is a browser UMD bundle whose factory receives JSZip from
      // the global object. Loading only the viewer (and a Chart placeholder)
      // leaves JSZip undefined, so the bundle aborts before exporting
      // PptxViewJS and the preview remains a blank canvas.
      if (typeof window.JSZip === 'undefined') {
        const jszipCode = await window.antigravityFS.getOfficeViewerAsset('jszip.min.js');
        execGlobal(jszipCode);
      }
      if (typeof window.Chart === 'undefined') {
        window.Chart = class Chart {
          constructor() {}
          destroy() {}
          update() {}
        };
      }
      // A prior failed bundle execution can leave an empty PptxViewJS object.
      // Remove that partial export so the corrected UMD bundle can initialize.
      if (typeof window.PptxViewJS !== 'undefined' && typeof window.PptxViewJS.PPTXViewer !== 'function') {
        try { delete window.PptxViewJS; } catch (e) { window.PptxViewJS = undefined; }
      }
      const pptxCode = await window.antigravityFS.getOfficeViewerAsset('PptxViewJS.min.js');
      execGlobal(pptxCode);
    }
  }

  function unmountOfficeHost() {
    ++_pdfLoadGeneration;
    _lastMountedPath = null;
    if (typeof _currentPdfCleanup === 'function') {
      try { _currentPdfCleanup(); } catch(e) {}
      _currentPdfCleanup = null;
    }
    if (_currentHost && _currentHost.parentElement) {
      const root = _currentHost.parentElement;
      Array.from(root.children).forEach(c => {
        if (c !== _currentHost) c.style.display = '';
      });
      _currentHost.remove();
      _currentHost = null;
    }
  }

  function createOrGetHost(root) {
    Array.from(root.children).forEach(c => {
      if (c.id !== 'antigravity-office-host') c.style.display = 'none';
    });
    let host = document.getElementById('antigravity-office-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'antigravity-office-host';
      root.appendChild(host);
    } else if (host.parentElement !== root) {
      root.appendChild(host);
    }
    root.style.position = 'relative';
    root.style.width = '100%';
    root.style.height = '100%';
    root.style.overflow = 'hidden';

    host.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;background:#ffffff;color:#1f1f1f;font-family:system-ui,-apple-system,sans-serif;';
    _currentHost = host;
    return host;
  }

  // --- Spreadsheet (Excel / CSV / TSV) Renderer ---
  async function readOfficePreviewBytes(host, filePath) {
    const bytes = window.antigravityFS ? await window.antigravityFS.readFileBytes(filePath) : null;
    if (bytes?.__agFileError === 'OFFICE_PREVIEW_TOO_LARGE' ||
        (/\.(docx|xlsx|xls|pptx)$/i.test(filePath) && bytes?.byteLength > 100 * 1024 * 1024)) {
      host.innerHTML = '<div style="padding:20px;color:#d93025;">Office 文档超过 100 MiB（104,857,600 字节）的预览上限，请使用本地 Office 应用打开。PDF 不受此限制。</div>';
      return null;
    }
    if (!bytes) {
      host.innerHTML = '<div style="padding:20px;color:#d93025;">无法读取 Office 文档。</div>';
      return null;
    }
    return bytes;
  }

  async function renderSpreadsheet(host, filePath, ext) {
    const fileName = filePath.split('\\').pop();
    host.innerHTML = `
      <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:13px;color:#5f6368;background:#ffffff;height:100%;font-family:system-ui,-apple-system,sans-serif;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:16px;border:2px solid #1a73e8;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
          <span>正在加载 ${ext.toUpperCase()} 表格数据...</span>
        </div>
      </div>
      <style>@keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }</style>
    `;

    const bytes = await readOfficePreviewBytes(host, filePath);
    if (!bytes) return;
    await ensureLib('xlsx');
    if (typeof XLSX === 'undefined') {
      host.innerHTML = `<div style="padding:20px;color:#d93025;background:#ffffff;height:100%;">SheetJS 解析引擎未能成功装载。</div>`;
      return;
    }

    let wb;
    try {
      if (ext === 'csv' || ext === 'tsv') {
        const text = await window.antigravityFS.readFileText(filePath);
        wb = XLSX.read(text, { type: 'string', raw: false });
      } else {
        wb = XLSX.read(bytes, { type: 'array' });
      }
    } catch (err) {
      host.innerHTML = `<div style="padding:20px;color:#d93025;background:#ffffff;height:100%;">解析表格失败: ${err.message}</div>`;
      return;
    }

    renderWorkbookUI(host, wb, filePath, ext);
  }

  function renderWorkbookUI(host, wb, filePath, ext) {
    const sheetNames = wb.SheetNames;
    let activeSheetIndex = 0;
    const fileName = filePath.split('\\').pop();

    const SS_ICONS = {
      table: '<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" style="color:#107c41;flex-shrink:0;"><path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3zm1 1v3h4V4H3zm5 0v3h5V4H8zM3 8v4h4V8H3zm5 0v4h5V8H8z"/></svg>',
      search: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6.5" cy="6.5" r="4.5"/><path d="m10 10 3.5 3.5"/></svg>',
      zoomOut: '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M3 7.5h10v1H3z"/></svg>',
      zoomIn: '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M7.5 3v4.5H3v1h4.5V13h1V8.5H13v-1H8.5V3z"/></svg>',
      folder: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v7A1.5 1.5 0 0 0 1.5 13h13a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 14.5 5H7.707l-1.854-1.854A.5.5 0 0 0 5.5 3z"/></svg>',
      more: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>'
    };

    host.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;width:100%;background:#ffffff;color:#1f1f1f;user-select:none;font-size:12px;font-family:system-ui,-apple-system,sans-serif;overflow:hidden;position:relative;">
        <!-- Clean Light Top Toolbar (Height 34px, Matches PDF Minimalist Design) -->
        <div style="height:34px;background:#fdfdfd;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;padding:0 8px;gap:6px;flex-shrink:0;z-index:10;">
          <!-- Left: Table icon, File title, Row x Col dimensions -->
          <div style="display:flex;align-items:center;gap:6px;min-width:0;flex-shrink:1;">
            ${SS_ICONS.table}
            <span style="font-weight:600;color:#1f1f1f;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;" title="${fileName}">${fileName}</span>
            <span id="sheet-dim" style="color:#5f6368;font-size:11px;flex-shrink:0;"></span>
          </div>

          <!-- Center/Right: Search, Zoom, Actions -->
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;position:relative;">
            <!-- Search Input -->
            <div style="position:relative;display:flex;align-items:center;">
              <input id="ss-search" type="text" placeholder="查找单元格..." style="background:#ffffff;border:1px solid #dadce0;color:#1f1f1f;border-radius:4px;padding:3px 8px 3px 22px;font-size:11.5px;outline:none;width:110px;transition:all 0.2s;" onfocus="this.style.width='160px';this.style.borderColor='#1a73e8'" onblur="if(!this.value){this.style.width='110px';this.style.borderColor='#dadce0'}"/>
              <span style="position:absolute;left:5px;color:#80868b;display:flex;align-items:center;pointer-events:none;">${SS_ICONS.search}</span>
            </div>

            <div class="ag-pdf-sep"></div>

            <!-- Zoom Controls -->
            <button id="ss-zoom-out" class="ag-pdf-tool-btn" title="缩小">${SS_ICONS.zoomOut}</button>
            <span id="ss-zoom-level" style="font-size:11.5px;font-weight:500;color:#1f1f1f;padding:0 2px;min-width:36px;text-align:center;">100%</span>
            <button id="ss-zoom-in" class="ag-pdf-tool-btn" title="放大">${SS_ICONS.zoomIn}</button>

            <div class="ag-pdf-sep"></div>

            <!-- Reveal in Explorer -->
            <button id="ss-btn-reveal" class="ag-pdf-tool-btn" title="在系统资源管理器中定位此文件">${SS_ICONS.folder}</button>

            <!-- More Actions -->
            <button id="ss-btn-more" class="ag-pdf-tool-btn" title="更多选项">${SS_ICONS.more}</button>

            <!-- More Popup Menu -->
            <div id="ss-more-menu" style="display:none;position:absolute;top:32px;right:0;background:#ffffff;border:1px solid #dadce0;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.12);padding:4px 0;width:140px;z-index:100;">
              <div id="ss-menu-copy" style="padding:6px 12px;cursor:pointer;font-size:12px;color:#1f1f1f;display:flex;align-items:center;gap:8px;">
                复制文件路径
              </div>
            </div>
          </div>
        </div>

        <!-- Clean Light Formula Bar / Active Cell Indicator (Height 26px) -->
        <div style="height:26px;background:#f8f9fa;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;padding:0 8px;gap:8px;font-size:11.5px;font-family:Consolas,SFMono-Regular,Menlo,Monaco,monospace;flex-shrink:0;">
          <div id="ss-active-cell" style="min-width:44px;color:#1a73e8;font-weight:600;border-right:1px solid #e0e0e0;padding-right:6px;text-align:center;">A1</div>
          <div id="ss-cell-value" style="color:#1f1f1f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;"></div>
        </div>

        <!-- Main Light Grid Area -->
        <div id="ss-grid-wrapper" style="flex:1;overflow:auto;position:relative;background:#ffffff;outline:none;" tabindex="0">
          <div id="ss-grid-inner" style="position:relative;"></div>
        </div>

        <!-- Bottom Sheet Tab Bar (Height 28px) -->
        <div id="ss-tab-bar" style="height:28px;background:#f1f3f4;border-top:1px solid #dadce0;display:flex;align-items:center;padding:0 6px;overflow-x:auto;flex-shrink:0;scrollbar-width:none;"></div>
      </div>
    `;

    let zoom = 1.0;
    let data = [];
    let rowCount = 0;
    let colCount = 0;
    let colWidths = [];
    let selectedCell = { r: 0, c: 0 };
    let searchQuery = '';

    const gridWrapper = host.querySelector('#ss-grid-wrapper');
    const gridInner = host.querySelector('#ss-grid-inner');
    const tabBar = host.querySelector('#ss-tab-bar');
    const activeCellEl = host.querySelector('#ss-active-cell');
    const cellValueEl = host.querySelector('#ss-cell-value');
    const dimEl = host.querySelector('#sheet-dim');
    const searchInput = host.querySelector('#ss-search');
    const btnReveal = host.querySelector('#ss-btn-reveal');
    const btnMore = host.querySelector('#ss-btn-more');
    const moreMenu = host.querySelector('#ss-more-menu');
    const menuCopy = host.querySelector('#ss-menu-copy');

    // More Menu
    btnMore.onclick = (e) => {
      e.stopPropagation();
      moreMenu.style.display = moreMenu.style.display === 'block' ? 'none' : 'block';
    };
    document.addEventListener('click', () => {
      if (moreMenu) moreMenu.style.display = 'none';
    });
    moreMenu.onclick = (e) => e.stopPropagation();

    menuCopy.onmouseenter = () => menuCopy.style.background = '#f1f3f4';
    menuCopy.onmouseleave = () => menuCopy.style.background = 'transparent';
    menuCopy.onclick = async () => {
      moreMenu.style.display = 'none';
      try {
        await navigator.clipboard.writeText(filePath);
        menuCopy.innerText = '✓ 已复制路径';
        setTimeout(() => menuCopy.innerText = '复制文件路径', 2000);
      } catch (e) {
        console.error('Copy path failed:', e);
      }
    };

    btnReveal.onclick = async () => {
      await doRevealInExplorer(filePath);
    };

    function loadActiveSheet() {
      const name = sheetNames[activeSheetIndex];
      const sheet = wb.Sheets[name];
      data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      rowCount = data.length;
      colCount = 0;
      data.forEach(row => { if (row.length > colCount) colCount = row.length; });
      colCount = Math.max(colCount, 1);
      dimEl.innerText = `${rowCount.toLocaleString()} 行 × ${colCount} 列`;

      // Calculate column widths
      colWidths = [];
      for (let c = 0; c < colCount; c++) {
        let maxL = 2;
        const checkRows = Math.min(rowCount, 100);
        for (let r = 0; r < checkRows; r++) {
          const val = data[r] && data[r][c] !== undefined ? String(data[r][c]) : '';
          maxL = Math.max(maxL, val.length);
        }
        colWidths.push(Math.min(Math.max(maxL * 9 + 24, 70), 320));
      }

      renderTabs();
      renderGrid();
    }

    function renderTabs() {
      tabBar.innerHTML = '';
      sheetNames.forEach((name, idx) => {
        const btn = document.createElement('button');
        const isActive = idx === activeSheetIndex;
        btn.innerText = name;
        btn.style.cssText = `
          background: ${isActive ? '#ffffff' : 'transparent'};
          color: ${isActive ? '#1f1f1f' : '#5f6368'};
          border: none;
          border-top: ${isActive ? '2px solid #107c41' : '2px solid transparent'};
          border-left: ${isActive ? '1px solid #dadce0' : '1px solid transparent'};
          border-right: ${isActive ? '1px solid #dadce0' : '1px solid transparent'};
          padding: 3px 14px;
          cursor: pointer;
          font-size: 11.5px;
          white-space: nowrap;
          font-weight: ${isActive ? '600' : 'normal'};
          height: 100%;
          display: flex;
          align-items: center;
          transition: all 0.15s;
          font-family: system-ui, -apple-system, sans-serif;
        `;
        btn.onmouseenter = () => { if (!isActive) btn.style.background = 'rgba(0,0,0,0.05)'; };
        btn.onmouseleave = () => { if (!isActive) btn.style.background = 'transparent'; };
        btn.onclick = () => {
          if (activeSheetIndex !== idx) {
            activeSheetIndex = idx;
            loadActiveSheet();
          }
        };
        tabBar.appendChild(btn);
      });
    }

    function colLabel(idx) {
      let label = '';
      idx++;
      while (idx > 0) {
        let rem = (idx - 1) % 26;
        label = String.fromCharCode(65 + rem) + label;
        idx = Math.floor((idx - 1) / 26);
      }
      return label;
    }

    const ROW_HEIGHT = 24;
    const HEADER_COL_WIDTH = 46;

    function renderGrid() {
      const totalWidth = HEADER_COL_WIDTH + colWidths.reduce((a, b) => a + b, 0);
      const totalHeight = (rowCount + 1) * ROW_HEIGHT;
      gridInner.style.width = (totalWidth * zoom) + 'px';
      gridInner.style.height = (totalHeight * zoom) + 'px';
      updateVisibleCells();
    }

    function updateVisibleCells() {
      const scrollTop = gridWrapper.scrollTop / zoom;
      const scrollLeft = gridWrapper.scrollLeft / zoom;
      const clientHeight = gridWrapper.clientHeight / zoom;
      const clientWidth = gridWrapper.clientWidth / zoom;

      const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
      const endRow = Math.min(rowCount, Math.ceil((scrollTop + clientHeight) / ROW_HEIGHT) + 2);

      let xAcc = HEADER_COL_WIDTH;
      let startCol = 0;
      let endCol = colCount;
      for (let c = 0; c < colCount; c++) {
        if (xAcc + colWidths[c] > scrollLeft) {
          startCol = Math.max(0, c - 1);
          break;
        }
        xAcc += colWidths[c];
      }
      let xAcc2 = xAcc;
      for (let c = startCol; c < colCount; c++) {
        if (xAcc2 > scrollLeft + clientWidth) {
          endCol = Math.min(colCount, c + 1);
          break;
        }
        xAcc2 += colWidths[c];
      }

      // Build DOM
      let html = '';

      // Column Header Row (Sticky Top)
      let curX = HEADER_COL_WIDTH;
      let colHeadersHtml = `<div style="position:sticky;top:0;left:0;height:${ROW_HEIGHT}px;width:${HEADER_COL_WIDTH}px;background:#f1f3f4;border-right:1px solid #dadce0;border-bottom:1px solid #dadce0;z-index:20;display:flex;align-items:center;justify-content:center;color:#80868b;font-size:10px;">◢</div>`;
      for (let c = 0; c < colCount; c++) {
        const w = colWidths[c];
        if (c >= startCol && c <= endCol) {
          const isColSelected = selectedCell.c === c;
          const colHeaderBg = isColSelected ? '#dadce0' : '#f1f3f4';
          const colHeaderColor = isColSelected ? '#1a73e8' : '#444746';
          colHeadersHtml += `<div style="position:absolute;top:0;left:${curX}px;width:${w}px;height:${ROW_HEIGHT}px;background:${colHeaderBg};border-right:1px solid #dadce0;border-bottom:1px solid #dadce0;color:${colHeaderColor};font-weight:600;display:flex;align-items:center;justify-content:center;font-size:11px;z-index:10;box-sizing:border-box;">${colLabel(c)}</div>`;
        }
        curX += w;
      }
      html += `<div style="position:sticky;top:0;z-index:15;background:#f1f3f4;height:${ROW_HEIGHT}px;width:100%;">${colHeadersHtml}</div>`;

      // Data Rows
      for (let r = startRow; r < endRow; r++) {
        const topY = (r + 1) * ROW_HEIGHT;
        const isRowSelected = selectedCell.r === r;
        const rowHeaderBg = isRowSelected ? '#dadce0' : '#f1f3f4';
        const rowHeaderColor = isRowSelected ? '#1a73e8' : '#5f6368';
        let rowHtml = `<div style="position:sticky;left:0;width:${HEADER_COL_WIDTH}px;height:${ROW_HEIGHT}px;background:${rowHeaderBg};border-right:1px solid #dadce0;border-bottom:1px solid #e8eaed;color:${rowHeaderColor};display:flex;align-items:center;justify-content:center;font-size:10px;z-index:5;box-sizing:border-box;font-weight:${isRowSelected ? '600' : 'normal'};">${r + 1}</div>`;

        let cellX = HEADER_COL_WIDTH;
        for (let c = 0; c < colCount; c++) {
          const w = colWidths[c];
          if (c >= startCol && c <= endCol) {
            const rawVal = data[r] && data[r][c] !== undefined ? data[r][c] : '';
            const strVal = String(rawVal);
            const isMatch = searchQuery && strVal.toLowerCase().includes(searchQuery);
            const isSelected = selectedCell.r === r && selectedCell.c === c;

            const isNum = typeof rawVal === 'number' || (!isNaN(Number(rawVal)) && strVal.trim() !== '');
            const align = isNum ? 'right' : 'left';

            let bg = '#ffffff';
            let textColor = '#1f1f1f';
            let outlineStyle = 'none';

            if (isSelected) {
              bg = '#e8f0fe'; // Google / Antigravity subtle light blue
              textColor = '#1a73e8';
              outlineStyle = '2px solid #1a73e8; z-index: 2;';
            } else if (isMatch) {
              bg = '#fef08a'; // Soft yellow highlight
              textColor = '#713f12';
              outlineStyle = '1px solid #eab308; z-index: 1;';
            } else if (r % 2 === 1) {
              bg = '#fafafa'; // Subtle alternating rows
            }

            rowHtml += `<div data-r="${r}" data-c="${c}" style="position:absolute;top:0;left:${cellX}px;width:${w}px;height:${ROW_HEIGHT}px;background:${bg};border-right:1px solid #e8eaed;border-bottom:1px solid #e8eaed;padding:0 8px;display:flex;align-items:center;justify-content:${align === 'right' ? 'flex-end' : 'flex-start'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${textColor};box-sizing:border-box;cursor:cell;outline:${outlineStyle};">${strVal}</div>`;
          }
          cellX += w;
        }

        html += `<div style="position:absolute;top:${topY}px;left:0;height:${ROW_HEIGHT}px;width:100%;display:flex;">${rowHtml}</div>`;
      }

      gridInner.innerHTML = html;
      gridInner.style.transform = `scale(${zoom})`;
      gridInner.style.transformOrigin = '0 0';
    }

    gridWrapper.onscroll = () => updateVisibleCells();

    gridInner.onclick = (e) => {
      const cell = e.target.closest('[data-r]');
      if (cell) {
        const r = parseInt(cell.getAttribute('data-r'));
        const c = parseInt(cell.getAttribute('data-c'));
        selectedCell = { r, c };
        const val = data[r] && data[r][c] !== undefined ? String(data[r][c]) : '';
        activeCellEl.innerText = `${colLabel(c)}${r + 1}`;
        cellValueEl.innerText = val;
        updateVisibleCells();
      }
    };

    host.querySelector('#ss-zoom-in').onclick = () => {
      if (zoom < 2.5) {
        zoom = Math.round((zoom + 0.1) * 10) / 10;
        host.querySelector('#ss-zoom-level').innerText = Math.round(zoom * 100) + '%';
        renderGrid();
      }
    };
    host.querySelector('#ss-zoom-out').onclick = () => {
      if (zoom > 0.4) {
        zoom = Math.round((zoom - 0.1) * 10) / 10;
        host.querySelector('#ss-zoom-level').innerText = Math.round(zoom * 100) + '%';
        renderGrid();
      }
    };

    // Wheel Zooming (Ctrl / Meta + Wheel)
    gridWrapper.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0 && zoom < 2.5) {
          zoom = Math.round((zoom + 0.1) * 10) / 10;
        } else if (e.deltaY > 0 && zoom > 0.4) {
          zoom = Math.round((zoom - 0.1) * 10) / 10;
        }
        host.querySelector('#ss-zoom-level').innerText = Math.round(zoom * 100) + '%';
        renderGrid();
      }
    }, { passive: false });

    searchInput.oninput = (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      updateVisibleCells();
    };

    loadActiveSheet();
  }

  async function renderDocx(host, filePath) {
    const fileName = filePath.split('\\').pop();
    host.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:14px;color:#9aa0a6;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:16px;border:2px solid #8ab4f8;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
          <span>正在排版 Word 文档...</span>
        </div>
      </div>
    `;

    const bytes = await readOfficePreviewBytes(host, filePath);
    if (!bytes) return;
    await ensureLib('docx');
    if (typeof docx === 'undefined') {
      host.innerHTML = `<div style="padding:20px;color:#f28b82;">docx-preview 引擎未能成功装载。</div>`;
      return;
    }

    host.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;overflow:auto;background:#f0f2f5;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;';
    host.innerHTML = `
      <div style="width:100%;background:#ffffff;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;padding:6px 16px;color:#1f1f1f;font-size:13px;flex-shrink:0;box-sizing:border-box;position:sticky;top:0;z-index:100;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:16px;">📄</span>
          <span style="font-weight:600;color:#8ab4f8;">${fileName}</span>
        </div>
        <div style="display:flex;gap:10px;">
          <button onclick="window.print()" style="background:#f8f9fa;border:1px solid #dadce0;color:#1f1f1f;padding:4px 14px;border-radius:4px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px;">
            <span>🖨️</span><span>打印 / 导出PDF</span>
          </button>
        </div>
      </div>
      <div id="docx-viewport" style="flex:1;width:100%;display:flex;flex-direction:column;align-items:center;padding:24px 16px;box-sizing:border-box;"></div>
      <style>
        #docx-viewport .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
        }
        #docx-viewport .docx-wrapper > section.docx {
          box-shadow: 0 4px 24px rgba(0,0,0,0.45) !important;
          margin-bottom: 24px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          border-radius: 2px !important;
          box-sizing: border-box !important;
        }
      </style>
    `;

    const targetEl = host.querySelector('#docx-viewport');
    try {
      await docx.renderAsync(bytes.buffer, targetEl, null, {
        className: 'docx',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false
      });
    } catch (err) {
      targetEl.innerHTML = `<div style="color:red;padding:20px;">渲染文档出错: ${err.message}</div>`;
    }
  }

  // --- PowerPoint (.pptx) Renderer ---
  async function renderPptx(host, filePath) {
    const fileName = filePath.split('\\').pop();
    host.innerHTML = `
      <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:14px;color:#9aa0a6;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:16px;border:2px solid #f28b82;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
          <span>正在加载幻灯片演示文稿...</span>
        </div>
      </div>
    `;

    const bytes = await readOfficePreviewBytes(host, filePath);
    if (!bytes) return;
    await ensureLib('pptx');
    if (typeof PptxViewJS === 'undefined') {
      host.innerHTML = `<div style="padding:20px;color:#f28b82;">PptxViewJS 引擎未能成功装载。</div>`;
      return;
    }

    host.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;overflow:hidden;background:#f0f2f5;display:flex;flex-direction:column;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;';
    host.innerHTML = `
      <div style="height:44px;background:#ffffff;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;padding:0 12px;color:#1f1f1f;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:16px;">📽️</span>
          <span style="font-weight:600;font-size:13px;color:#f28b82;">${fileName}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="pptx-zoom-out" title="缩小" style="background:#f8f9fa;border:1px solid #dadce0;color:#1f1f1f;padding:4px 9px;border-radius:4px;cursor:pointer;font-size:14px;">−</button>
          <span id="pptx-zoom-level" style="min-width:44px;text-align:center;font-size:12px;color:#e8eaed;">100%</span>
          <button id="pptx-zoom-in" title="放大" style="background:#f8f9fa;border:1px solid #dadce0;color:#1f1f1f;padding:4px 9px;border-radius:4px;cursor:pointer;font-size:14px;">＋</button>
          <button id="pptx-zoom-fit" title="适合窗口" style="background:#f8f9fa;border:1px solid #dadce0;color:#1f1f1f;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;">适合</button>
          <span style="width:1px;height:20px;background:#3c4043;margin:0 4px;"></span>
          <button id="pptx-prev" style="background:#f8f9fa;border:1px solid #dadce0;color:#1f1f1f;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;">◀ 上一页</button>
          <span id="pptx-page-info" style="font-size:12px;color:#9aa0a6;">第 <b style="color:#fff;" id="pptx-curr">1</b> / <span id="pptx-total">--</span> 页</span>
          <button id="pptx-next" style="background:#f8f9fa;border:1px solid #dadce0;color:#1f1f1f;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;">下一页 ▶</button>
        </div>
      </div>
      <div id="pptx-stage" style="flex:1;background:#f0f2f5;overflow:auto;display:block;padding:24px;box-sizing:border-box;">
        <canvas id="pptx-main-canvas" style="display:block;margin:0 auto;box-shadow:0 8px 30px rgba(0,0,0,0.6);border-radius:4px;background:#ffffff;"></canvas>
      </div>
    `;

    const stage = host.querySelector('#pptx-stage');
    const canvas = host.querySelector('#pptx-main-canvas');
    const viewer = new PptxViewJS.PPTXViewer({ canvas, autoChartRerenderDelayMs: 0 });

    try {
      await viewer.loadFile(bytes.buffer);
      const slideSize = viewer.presentation?.slideSize || {cx: 16, cy: 9};
      const aspect = (Number(slideSize.cx) > 0 && Number(slideSize.cy) > 0)
        ? Number(slideSize.cx) / Number(slideSize.cy) : 16 / 9;
      let fitWidth = 960;
      let fitHeight = fitWidth / aspect;
      let zoom = 1;
      let renderToken = 0;
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const measureFit = () => {
        const availableWidth = Math.max(320, stage.clientWidth - 48);
        const availableHeight = Math.max(240, stage.clientHeight - 48);
        fitWidth = Math.max(320, Math.min(availableWidth, availableHeight * aspect));
        fitHeight = fitWidth / aspect;
      };
      const setZoomLabel = () => {
        host.querySelector('#pptx-zoom-level').innerText = `${Math.round(zoom * 100)}%`;
      };
      const renderZoom = async (nextZoom) => {
        zoom = Math.max(0.75, Math.min(3, nextZoom));
        const logicalWidth = Math.round(fitWidth * zoom);
        const logicalHeight = Math.round(fitHeight * zoom);
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;
        canvas.width = Math.max(1, Math.round(logicalWidth * dpr));
        canvas.height = Math.max(1, Math.round(logicalHeight * dpr));
        setZoomLabel();
        const token = ++renderToken;
        await viewer.render(canvas);
        if (token !== renderToken) return;
      };
      measureFit();
      await renderZoom(1);

      const count = viewer.getSlideCount();
      host.querySelector('#pptx-total').innerText = count;

      host.querySelector('#pptx-prev').onclick = async () => {
        await viewer.previousSlide();
        host.querySelector('#pptx-curr').innerText = viewer.getCurrentSlideIndex() + 1;
      };
      host.querySelector('#pptx-next').onclick = async () => {
        await viewer.nextSlide();
        host.querySelector('#pptx-curr').innerText = viewer.getCurrentSlideIndex() + 1;
      };
      host.querySelector('#pptx-zoom-in').onclick = () => renderZoom(zoom * 1.25);
      host.querySelector('#pptx-zoom-out').onclick = () => renderZoom(zoom / 1.25);
      host.querySelector('#pptx-zoom-fit').onclick = () => { measureFit(); renderZoom(1); };
      stage.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        renderZoom(zoom * (e.deltaY < 0 ? 1.1 : 0.9));
      }, {passive:false});
      const resizeObserver = new ResizeObserver(() => {
        if (zoom === 1) { measureFit(); renderZoom(1); }
      });
      resizeObserver.observe(stage);

      // Keyboard arrow shortcuts
      const handleKeyDown = async (e) => {
        if (!document.getElementById('antigravity-office-host')) {
          window.removeEventListener('keydown', handleKeyDown);
          return;
        }
        if (e.key === '+' || e.key === '=') {
          e.preventDefault(); renderZoom(zoom * 1.25);
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault(); renderZoom(zoom / 1.25);
        } else if (e.key === '0') {
          e.preventDefault(); measureFit(); renderZoom(1);
        } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          await viewer.nextSlide();
          host.querySelector('#pptx-curr').innerText = viewer.getCurrentSlideIndex() + 1;
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          await viewer.previousSlide();
          host.querySelector('#pptx-curr').innerText = viewer.getCurrentSlideIndex() + 1;
        }
      };
      window.addEventListener('keydown', handleKeyDown);
    } catch (err) {
      canvas.parentElement.innerHTML = `<div style="color:#f28b82;padding:20px;">渲染幻灯片出错: ${err.message}</div>`;
    }
  }


  // =========================================================================
  // --- High-Performance VS Code-Grade PDF Viewer Engine (Option C) ---
  // =========================================================================
  let _currentPdfCleanup = null;
  let _pdfLoadGeneration = 0;

// Native fallback functions permanently removed (Monaco binary crash prevention)

  window.__antigravityRenderPdf = renderPdf;
  window.__antigravityActiveFilePath = getActiveFilePath;
async function renderPdf(host, filePath, options = {}) {
    const generation = ++_pdfLoadGeneration;
    const isCurrent = () => generation === _pdfLoadGeneration && host.isConnected && (!options.isCurrent || options.isCurrent());
    host.dataset.pdfLoading = 'true';
    if (_currentPdfCleanup) {
      try { _currentPdfCleanup(); } catch(e) {}
      _currentPdfCleanup = null;
    }

    const fileName = filePath.split('\\').pop().split('/').pop();
    host.innerHTML = `
      <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:14px;color:#9aa0a6;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:18px;height:18px;border:2px solid #e06c75;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
          <span>正在装载极速 PDF 引擎 (${fileName})...</span>
        </div>
      </div>
      <style>@keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }</style>
    `;

    let bytes = null;
    let actualResolvedPath = filePath;
    let isPathHealed = false;
    // Read once on the normal path. The old existence probe read the complete
    // PDF over IPC, discarded it, then read the same bytes a second time.
    if (window.antigravityFS && typeof window.antigravityFS.readFileBytes === 'function') {
      try {
        bytes = await window.antigravityFS.readFileBytes(actualResolvedPath || filePath);
      } catch(e) {}
      if (!bytes) {
        try {
          const res = await smartResolveFilePath(filePath);
          if (res?.isFile) {
            actualResolvedPath = res.path;
            isPathHealed = !!res.isHealed;
            bytes = await window.antigravityFS.readFileBytes(actualResolvedPath);
          }
        } catch(e) {}
      }
    }
    if (!isCurrent()) return;
    if (!bytes) {
      host.innerHTML = `<div style="padding:20px;color:#f28b82;">无法读取文件: ${filePath}</div>`;
      return;
    }

    if (!window.pdfjsLib) {
      if (typeof window.getPdfjsModule === 'function') {
        try { await window.getPdfjsModule(); } catch(e) {}
      }
      if (!window.pdfjsLib && typeof fetch === 'function') {
        try {
          const [workerRes, pdfRes] = await Promise.all([
            fetch('/workers/pdf.worker.mjs'),
            fetch('/workers/pdf.min.mjs')
          ]);
          if (workerRes.ok && pdfRes.ok) {
            const [workerCode, pdfCode] = await Promise.all([
              workerRes.text(),
              pdfRes.text()
            ]);
            const workerBlobUrl = URL.createObjectURL(new Blob([workerCode], { type: 'text/javascript' }));
            const pdfBlobUrl = URL.createObjectURL(new Blob([pdfCode], { type: 'text/javascript' }));
            const pdfjs = await import(pdfBlobUrl);
            if (pdfjs && pdfjs.GlobalWorkerOptions) {
              pdfjs.GlobalWorkerOptions.workerPort = new Worker(workerBlobUrl, { type: 'module' });
              let _workerSrc = workerBlobUrl;
              Object.defineProperty(pdfjs.GlobalWorkerOptions, 'workerSrc', {
                configurable: true,
                get: () => _workerSrc,
                set: (val) => { if (val && !val.startsWith('blob:')) return; _workerSrc = val; }
              });
            }
            window.pdfjsLib = pdfjs;
          }
        } catch(fe) {
          console.warn('[PdfViewer] Direct inline PDF module fetch fallback failed:', fe);
        }
      }
    }
    if (!window.pdfjsLib) {
      host.innerHTML = `<div style="padding:20px;color:#f28b82;">PDF.js 解析引擎未能成功装载。</div>`;
      return;
    }

    if (!isCurrent()) return;
    let doc;
    let ownedWorker = null;
    let ownedPort = null;
    try {
      // A PDF.js document destroy must not tear down the worker used by the
      // next document. Each reader owns and releases its worker explicitly.
      const workerSrc = window.pdfjsLib.GlobalWorkerOptions.workerSrc;
      ownedPort = new Worker(workerSrc, {type:'module'});
      ownedWorker = new window.pdfjsLib.PDFWorker({port:ownedPort});
      doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(bytes), worker:ownedWorker }).promise;
      doc.__agReleaseWorker = () => { ownedWorker.destroy(); ownedPort.terminate(); };
    } catch (err) {
      ownedWorker?.destroy(); ownedPort?.terminate();
      host.innerHTML = `<div style="padding:20px;color:#f28b82;">解析 PDF 文档失败: ${err.message}</div>`;
      return;
    }

    if (!isCurrent()) { await doc.destroy(); doc.__agReleaseWorker?.(); return; }
    await renderPdfUI(host, doc, actualResolvedPath || filePath, fileName, isPathHealed, actualResolvedPath);
    if (isCurrent()) host.dataset.pdfLoading = 'false';
  }

  function renderPdfUI(host, doc, filePath, fileName, isPathHealed = false, actualResolvedPath = filePath) {
    const pdfObservers = [];
    let pdfDisposed = false;
    let handlePdfKeyDown = null;
    // Inject Minimalist Clean Light Theme CSS
    const oldStyleEl = document.getElementById('ag-pdf-engine-styles');
    if (oldStyleEl) oldStyleEl.remove();
    const styleEl = document.createElement('style');
    styleEl.id = 'ag-pdf-engine-styles';
    styleEl.textContent = `
        .ag-pdf-tool-btn {
          background: transparent;
          border: none;
          color: #444746;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
          padding: 0;
          flex-shrink: 0;
        }
        .ag-pdf-tool-btn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #1f1f1f;
        }
        .ag-pdf-tool-btn.active {
          background: rgba(26, 115, 232, 0.12);
          color: #1a73e8;
        }
        .ag-pdf-sep {
          width: 1px;
          height: 16px;
          background: #dadce0;
          margin: 0 4px;
          flex-shrink: 0;
        }
        .ag-pdf-input {
          width: 34px;
          height: 22px;
          border: 1px solid #dadce0;
          border-radius: 3px;
          background: #ffffff;
          color: #1f1f1f;
          text-align: center;
          font-size: 11.5px;
          font-family: inherit;
          outline: none;
          padding: 0 2px;
          transition: border-color 0.15s;
        }
        .ag-pdf-input:focus {
          border-color: #1a73e8;
        }
        .ag-pdf-select {
          height: 24px;
          border: 1px solid #dadce0;
          border-radius: 3px;
          background: #ffffff;
          color: #1f1f1f;
          font-size: 11.5px;
          font-family: inherit;
          padding: 0 4px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .ag-pdf-select:focus {
          border-color: #1a73e8;
        }
        .ag-pdf-page-slot {
          contain: layout paint style;
          position: relative;
          margin: 14px auto;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(60,64,67,0.15), 0 3px 6px rgba(60,64,67,0.1);
          border-radius: 2px;
          box-sizing: border-box;
          overflow: hidden;
          flex-shrink: 0;
          width: var(--pdf-slot-w, 600px);
          height: var(--pdf-slot-h, 800px);
        }
        .ag-pdf-page-slot canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: block;
        }
        .ag-pdf-page-slot .textLayer {
          position: absolute;
          inset: 0;
          overflow: clip;
          opacity: 1;
          line-height: 1;
          text-size-adjust: none;
          forced-color-adjust: none;
          transform-origin: 0 0;
          z-index: 2;
          pointer-events: auto;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        .ag-pdf-page-slot .textLayer span,
        .ag-pdf-page-slot .textLayer span::selection,
        .ag-pdf-page-slot .textLayer br::selection {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .ag-pdf-page-slot .textLayer ::selection {
          background: rgba(26, 115, 232, 0.28) !important;
          color: transparent !important;
        }
        .ag-pdf-page-slot .textLayer .endOfContent {
          display: block;
          position: absolute;
          inset: 100% 0 0 0;
          z-index: -1;
          cursor: default;
          user-select: none;
          -webkit-user-select: none;
        }
        .ag-pdf-page-slot .textLayer.selecting .endOfContent {
          top: 0;
        }

        /* Region Selection & Native Comment Overlay */
        .ag-pdf-selection-rect {
          position: absolute;
          border: 1.5px solid var(--primary, #2f75c3);
          background: rgba(47, 117, 195, 0.12);
          pointer-events: none;
          z-index: 25;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6);
          border-radius: 4px;
        }
        .ag-pdf-comment-popup {
          position: absolute;
          z-index: 100;
          background: var(--card, #ffffff);
          color: var(--card-foreground, #0a0a0c);
          border: 1px solid var(--border, rgba(0, 0, 0, 0.08));
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
          padding: 10px 12px;
          width: 320px;
          max-width: calc(100vw - 32px);
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: inherit;
          user-select: auto !important;
          -webkit-user-select: auto !important;
          animation: ag-pdf-popup-in 0.14s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes ag-pdf-popup-in {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ag-pdf-comment-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--border, rgba(0, 0, 0, 0.08));
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          line-height: 1.5;
          outline: none;
          resize: none;
          min-height: 62px;
          color: var(--foreground, #0a0a0c);
          background: var(--secondary, rgba(0, 0, 0, 0.03));
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
        }
        .ag-pdf-comment-input:focus {
          background: var(--background, #ffffff);
          border-color: var(--primary, #2f75c3);
          box-shadow: 0 0 0 2px rgba(47, 117, 195, 0.2);
        }
        .ag-pdf-comment-input::placeholder {
          color: var(--muted-foreground, #71717a);
          font-size: 12.5px;
        }
        .ag-pdf-comment-btn-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .ag-pdf-comment-btn {
          border: none;
          outline: none;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }
        .ag-pdf-comment-btn-cancel {
          background: transparent;
          color: var(--muted-foreground, #71717a);
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .ag-pdf-comment-btn-cancel:hover {
          background: var(--muted, rgba(0, 0, 0, 0.05));
          color: var(--foreground, #0a0a0c);
        }
        .ag-pdf-comment-btn-copy {
          background: transparent;
          color: var(--muted-foreground, #71717a);
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .ag-pdf-comment-btn-copy:hover {
          background: var(--muted, rgba(0, 0, 0, 0.05));
          color: var(--foreground, #0a0a0c);
        }
        .ag-pdf-comment-btn-submit {
          background: var(--primary, #2f75c3);
          color: var(--primary-foreground, #ffffff);
          font-size: 12px;
          font-weight: 500;
          padding: 5px 12px;
          border-radius: 6px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }
        .ag-pdf-comment-btn-submit:hover {
          opacity: 0.92;
          transform: translateY(-0.5px);
        }
        .ag-pdf-comment-btn-submit:active {
          transform: translateY(0);
        }
        .ag-pdf-page-slot .textLayer mark.ag-pdf-highlight {
          background-color: rgba(255, 224, 51, 0.6) !important;
          background: rgba(255, 224, 51, 0.6) !important;
          mix-blend-mode: multiply !important;
          color: transparent !important;
          border-radius: 2px !important;
          display: inline !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.4);
        }
        .ag-pdf-page-slot .textLayer mark.ag-pdf-highlight.ag-pdf-highlight-active {
          background-color: rgba(255, 152, 0, 0.75) !important;
          background: rgba(255, 152, 0, 0.75) !important;
          mix-blend-mode: multiply !important;
          box-shadow: 0 0 0 1.5px rgba(230, 81, 0, 0.8), 0 0 6px rgba(255, 152, 0, 0.5);
        }
        .ag-pdf-outline-entry {
          padding: 5px 8px;
          color: #1f1f1f;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          line-height: 1.4;
          transition: background 0.15s, color 0.15s;
        }
        .ag-pdf-outline-entry:hover {
          background: #f1f3f4;
          color: #1a73e8;
        }
        .ag-pdf-thumb-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border-radius: 4px;
          padding: 6px 4px 4px 4px;
          transition: all 0.15s;
        }
        .ag-pdf-thumb-card:hover {
          background: #f1f3f4;
        }
        .ag-pdf-thumb-card.active {
          background: #e8f0fe;
        }
        .ag-pdf-thumb-card.active .ag-pdf-thumb-preview {
          outline: 2px solid #1a73e8;
        }
        .ag-pdf-thumb-preview {
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(60,64,67,0.2);
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .ag-pdf-thumb-num {
          font-size: 11px;
          color: #5f6368;
          font-family: inherit;
        }

        /* Link Layer & Interactive Academic Hyperlinks */
        .ag-pdf-link-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 4;
        }
        .ag-pdf-interactive-link {
          position: absolute;
          pointer-events: auto;
          cursor: pointer;
          border-radius: 2px;
          background: transparent;
          transition: background 0.15s ease, box-shadow 0.15s ease;
        }
        .ag-pdf-interactive-link:hover {
          background: rgba(26, 115, 232, 0.14);
          box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.4);
        }
        .ag-pdf-interactive-link[data-type="external"]:hover {
          background: rgba(24, 128, 56, 0.14);
          box-shadow: 0 0 0 1px rgba(24, 128, 56, 0.4);
        }

        /* Highlight Flash when jumping to reference or figure */
        @keyframes agPdfJumpFlash {
          0% { background: rgba(26, 115, 232, 0.32); box-shadow: 0 0 16px rgba(26, 115, 232, 0.45); }
          50% { background: rgba(26, 115, 232, 0.2); box-shadow: 0 0 10px rgba(26, 115, 232, 0.25); }
          100% { background: transparent; box-shadow: none; }
        }
        .ag-pdf-jump-target {
          animation: agPdfJumpFlash 1.6s ease-out forwards;
        }

        /* Return Pill Floating Action Button */
        .ag-pdf-return-pill {
          position: absolute;
          bottom: 24px;
          right: 28px;
          background: #ffffff;
          color: #1a73e8;
          border: 1px solid #dadce0;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08);
          z-index: 30;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          animation: agPdfSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .ag-pdf-return-pill:hover {
          background: #f8fafd;
          border-color: #1a73e8;
          box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
          transform: translateY(-1px);
        }
        @keyframes agPdfSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Toast for Ctrl+Click Hint */
        .ag-pdf-toast {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(32, 33, 36, 0.92);
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 11.5px;
          pointer-events: none;
          z-index: 50;
          animation: agPdfSlideUp 0.2s ease-out forwards;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `;
      document.head.appendChild(styleEl);

    const SVG_ICONS = {
      sidebar: '<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm4 1H2v8h4V4zm1 0v8h7V4H7z"/></svg>',
      search: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6.5" cy="6.5" r="4.5"/><path d="m10 10 3.5 3.5"/></svg>',
      crop: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1v11a1 1 0 0 0 1 1h11"/><path d="M1 4h11a1 1 0 0 1 1 1v11"/></svg>',
      up: '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="m4 10 4-4 4 4z"/></svg>',
      down: '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="m4 6 4 4 4-4z"/></svg>',
      zoomOut: '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M3 7.5h10v1H3z"/></svg>',
      zoomIn: '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M7.5 3v4.5H3v1h4.5V13h1V8.5H13v-1H8.5V3z"/></svg>',
      rotate: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9L14 2m0 3.5h-3.5"/></svg>',
      print: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h8v3H4zm-1 4h10a1 1 0 0 1 1 1v4h-2v3H4v-3H2V7a1 1 0 0 1 1-1zm2 6h6v-2H5z"/></svg>',
      folder: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v7A1.5 1.5 0 0 0 1.5 13h13a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 14.5 5H7.707l-1.854-1.854A.5.5 0 0 0 5.5 3z"/></svg>',
      thumbs: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/></svg>',
      outline: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h2v2H2zm4 0h8v2H6zm-4 4h2v2H2zm4 0h8v2H6zm-4 4h2v2H2zm4 0h8v2H6z"/></svg>',
      more: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>'
    };

    host.innerHTML = `
      <div style="display:flex;flex-direction:column;width:100%;height:100%;background:#ffffff;color:#1f1f1f;user-select:none;font-family:system-ui,-apple-system,sans-serif;font-size:12px;overflow:hidden;position:relative;">
        <!-- Clean Minimalist Top Toolbar (Height 34px, standard VSCode/Antigravity style) -->
        <div style="height:34px;background:#fdfdfd;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;padding:0 8px;gap:6px;flex-shrink:0;z-index:10;">
          <!-- Left: Sidebar toggle, Search, Navigation -->
          <div style="display:flex;align-items:center;gap:3px;min-width:0;flex-shrink:1;">
            <button id="ag-pdf-btn-sidebar" class="ag-pdf-tool-btn" title="切换侧边栏">
              ${SVG_ICONS.sidebar}
            </button>
            <button id="ag-pdf-btn-search-toggle" class="ag-pdf-tool-btn" title="在文档中查找">
              ${SVG_ICONS.search}
            </button>
            <div class="ag-pdf-sep"></div>
            <button id="ag-pdf-btn-prev" class="ag-pdf-tool-btn" title="上一页">
              ${SVG_ICONS.up}
            </button>
            <button id="ag-pdf-btn-next" class="ag-pdf-tool-btn" title="下一页">
              ${SVG_ICONS.down}
            </button>
            <div style="display:flex;align-items:center;gap:3px;margin-left:2px;">
              <input id="ag-pdf-page-input" class="ag-pdf-input" type="text" value="1" />
              <span id="ag-pdf-page-count" style="color:#5f6368;font-size:11.5px;padding-right:2px;">/ ${doc.numPages}</span>
            </div>

            <!-- Slide-in Search Bar -->
            <div id="ag-pdf-search-bar" style="display:none;align-items:center;gap:3px;margin-left:6px;padding:1px 4px;border:1px solid #dadce0;border-radius:4px;background:#ffffff;">
              <input id="ag-pdf-search-input" type="text" placeholder="查找..." style="border:none;outline:none;font-size:11.5px;width:90px;color:#1f1f1f;background:transparent;" />
              <span id="ag-pdf-search-badge" style="font-size:10px;color:#5f6368;margin-right:2px;"></span>
              <button id="ag-pdf-btn-search-prev" class="ag-pdf-tool-btn" style="width:20px;height:20px;" title="上一处匹配">${SVG_ICONS.up}</button>
              <button id="ag-pdf-btn-search-next" class="ag-pdf-tool-btn" style="width:20px;height:20px;" title="下一处匹配">${SVG_ICONS.down}</button>
            </div>
          </div>

          <!-- Center: Zoom Controls -->
          <div style="display:flex;align-items:center;gap:3px;flex-shrink:0;">
            <button id="ag-pdf-btn-zoom-out" class="ag-pdf-tool-btn" title="缩小">
              ${SVG_ICONS.zoomOut}
            </button>
            <button id="ag-pdf-btn-zoom-in" class="ag-pdf-tool-btn" title="放大">
              ${SVG_ICONS.zoomIn}
            </button>
            <select id="ag-pdf-zoom-select" class="ag-pdf-select" title="缩放比例">
              <option value="auto">自动缩放</option>
              <option value="page-actual">实际大小</option>
              <option value="page-fit">适合整页</option>
              <option value="page-width">适合页宽</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
            </select>
          </div>

          <!-- Right: Action Icons (Crop/Comment, Rotate, Print, Locate, More) -->
          <div style="display:flex;align-items:center;gap:3px;flex-shrink:0;position:relative;">
            <button id="ag-pdf-btn-crop" class="ag-pdf-tool-btn" title="框选提问 (快捷键: 按住Alt在页面拖拽框选)">
              ${SVG_ICONS.crop}
            </button>
            <button id="ag-pdf-btn-rotate" class="ag-pdf-tool-btn" title="顺时针旋转90度">
              ${SVG_ICONS.rotate}
            </button>
            <button id="ag-pdf-btn-print" class="ag-pdf-tool-btn" title="打印">
              ${SVG_ICONS.print}
            </button>
            <button id="ag-pdf-btn-reveal" class="ag-pdf-tool-btn" title="在系统资源管理器中定位文件">
              ${SVG_ICONS.folder}
            </button>
            <button id="ag-pdf-btn-more" class="ag-pdf-tool-btn" title="更多选项">
              ${SVG_ICONS.more}
            </button>

            <!-- More Popup Menu -->
            <div id="ag-pdf-more-menu" style="display:none;position:absolute;top:32px;right:0;background:#ffffff;border:1px solid #dadce0;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.12);padding:4px 0;width:150px;z-index:100;">
              <div id="ag-pdf-menu-copy" style="padding:6px 12px;cursor:pointer;font-size:12px;color:#1f1f1f;display:flex;align-items:center;gap:8px;">
                复制文件路径
              </div>
              <div id="ag-pdf-menu-dark" style="padding:6px 12px;cursor:pointer;font-size:12px;color:#1f1f1f;display:flex;align-items:center;gap:8px;">
                切换护眼模式
              </div>
            </div>
          </div>
        </div>

        ${isPathHealed ? `
          <div id="ag-pdf-heal-banner" style="height:28px;background:rgba(37,99,235,0.08);border-bottom:1px solid rgba(37,99,235,0.25);display:flex;align-items:center;padding:0 12px;font-size:11.5px;color:#2563eb;gap:8px;flex-shrink:0;">
            <span>💡 <b>路径智能自愈</b>：该文件在磁盘上已被重命名或移动，已自动重定向并加载最新文件：<code>${actualResolvedPath.split(/[/\\]/).pop()}</code></span>
          </div>
        ` : ''}
        <!-- Body: Docked Sidebar + Canvas Viewport -->
        <div style="display:flex;flex:1;overflow:hidden;position:relative;">
          <!-- Left Docked Sidebar (width 200px, matches reference image) -->
          <div id="ag-pdf-sidebar" style="width:200px;background:#fcfcfc;border-right:1px solid #e0e0e0;display:flex;flex-direction:column;flex-shrink:0;position:relative;z-index:5;">
            <!-- Sidebar Top Tabs: Thumbnails [田] and Outline [≡] -->
            <div style="height:32px;background:#f3f4f6;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;padding:0 6px;gap:4px;flex-shrink:0;">
              <button id="ag-pdf-tab-thumbs" class="ag-pdf-tool-btn active" title="缩略图" style="width:26px;height:26px;">
                ${SVG_ICONS.thumbs}
              </button>
              <button id="ag-pdf-tab-outline" class="ag-pdf-tool-btn" title="大纲目录" style="width:26px;height:26px;">
                ${SVG_ICONS.outline}
              </button>
            </div>

            <!-- Views -->
            <div id="ag-pdf-thumbs-view" style="flex:1;overflow-y:auto;padding:12px 6px;display:flex;gap:12px;flex-direction:column;align-items:center;"></div>
            <div id="ag-pdf-outline-view" style="flex:1;overflow-y:auto;padding:8px;font-size:12px;color:#1f1f1f;display:none;"></div>
          </div>

          <!-- Main Viewport (Canvas Area with #f0f2f5 background) -->
          <div id="ag-pdf-viewport" style="flex:1;overflow:auto;position:relative;background:#f0f2f5;padding:12px 0;outline:none;" tabindex="0">
            <div id="ag-pdf-pages-host" style="display:flex;flex-direction:column;align-items:center;min-height:100%;min-width:100%;width:max-content;backface-visibility:hidden;"></div>
          </div>
        </div>
      </div>
    `;

    // Element References
    const viewport = host.querySelector('#ag-pdf-viewport');
    const pagesHost = host.querySelector('#ag-pdf-pages-host');
    const pageInput = host.querySelector('#ag-pdf-page-input');
    const btnPrev = host.querySelector('#ag-pdf-btn-prev');
    const btnNext = host.querySelector('#ag-pdf-btn-next');
    const btnZoomOut = host.querySelector('#ag-pdf-btn-zoom-out');
    const btnZoomIn = host.querySelector('#ag-pdf-btn-zoom-in');
    const zoomSelect = host.querySelector('#ag-pdf-zoom-select');
    const btnRotate = host.querySelector('#ag-pdf-btn-rotate');
    const btnPrint = host.querySelector('#ag-pdf-btn-print');
    const btnReveal = host.querySelector('#ag-pdf-btn-reveal');
    const btnMore = host.querySelector('#ag-pdf-btn-more');
    const moreMenu = host.querySelector('#ag-pdf-more-menu');
    const menuCopy = host.querySelector('#ag-pdf-menu-copy');
    const menuDark = host.querySelector('#ag-pdf-menu-dark');

    const btnSidebar = host.querySelector('#ag-pdf-btn-sidebar');
    const sidebar = host.querySelector('#ag-pdf-sidebar');
    const tabThumbs = host.querySelector('#ag-pdf-tab-thumbs');
    const tabOutline = host.querySelector('#ag-pdf-tab-outline');
    const thumbsView = host.querySelector('#ag-pdf-thumbs-view');
    const outlineView = host.querySelector('#ag-pdf-outline-view');

    const btnSearchToggle = host.querySelector('#ag-pdf-btn-search-toggle');
    const searchBar = host.querySelector('#ag-pdf-search-bar');
    const searchInput = host.querySelector('#ag-pdf-search-input');
    const searchBadge = host.querySelector('#ag-pdf-search-badge');
    const btnSearchPrev = host.querySelector('#ag-pdf-btn-search-prev');
    const btnSearchNext = host.querySelector('#ag-pdf-btn-search-next');

    // Engine State
    let currentScale = 1.0;
    let rotation = 0;
    let isDarkMode = false;
    let activePage = 1;
    let rawPageWidth = 595;
    let rawPageHeight = 842;
    const renderTasks = new Map();
    const renderQueue = new Map();
    const cachedPages = new Map();
    const pageSlots = [];
    const pageDimensionsMap = new Map();
    let activeRenders = 0;
    let queueTimer = null;
    let zoomFrame = null;
    const MAX_PAGE_PIXELS = 4 * 1024 * 1024;
    const MAX_CACHE_PIXELS = 12 * 1024 * 1024;
    const perf = {renders:0, cancelled:0, cacheHits:0, maxConcurrent:0};
    host.__agPdfPerformance = () => ({...perf, activeRenders, queued:renderQueue.size,
      cachedPages:cachedPages.size, canvasPixels:[...cachedPages.values()].reduce((n,v)=>n+v.pixels,0)});
    let isSidebarOpen = true;
    let currentSidebarTab = 'thumbs'; // 'thumbs' | 'outline'

    // Sidebar Toggling
    btnSidebar.classList.add('active');
    btnSidebar.onclick = () => {
      isSidebarOpen = !isSidebarOpen;
      sidebar.style.display = isSidebarOpen ? 'flex' : 'none';
      btnSidebar.classList.toggle('active', isSidebarOpen);
    };

    tabThumbs.onclick = () => {
      currentSidebarTab = 'thumbs';
      tabThumbs.classList.add('active');
      tabOutline.classList.remove('active');
      thumbsView.style.display = 'flex';
      outlineView.style.display = 'none';
      highlightActiveThumb(activePage);
    };

    tabOutline.onclick = () => {
      currentSidebarTab = 'outline';
      tabOutline.classList.add('active');
      tabThumbs.classList.remove('active');
      outlineView.style.display = 'block';
      thumbsView.style.display = 'none';
    };

    // More Menu
    btnMore.onclick = (e) => {
      e.stopPropagation();
      moreMenu.style.display = moreMenu.style.display === 'block' ? 'none' : 'block';
    };
    const closeMoreMenu = () => {
      if (moreMenu) moreMenu.style.display = 'none';
    };
    document.addEventListener('click', closeMoreMenu);
    moreMenu.onclick = (e) => e.stopPropagation();

    menuCopy.onmouseenter = () => menuCopy.style.background = '#f1f3f4';
    menuCopy.onmouseleave = () => menuCopy.style.background = 'transparent';
    menuCopy.onclick = async () => {
      moreMenu.style.display = 'none';
      try {
        await navigator.clipboard.writeText(filePath);
        menuCopy.innerText = '✓ 已复制路径';
        setTimeout(() => menuCopy.innerText = '复制文件路径', 2000);
      } catch (e) {
        console.error('Copy path failed:', e);
      }
    };

    menuDark.onmouseenter = () => menuDark.style.background = '#f1f3f4';
    menuDark.onmouseleave = () => menuDark.style.background = 'transparent';
    menuDark.onclick = () => {
      moreMenu.style.display = 'none';
      isDarkMode = !isDarkMode;
      menuDark.innerText = isDarkMode ? '恢复常规浅色' : '切换护眼模式';
      pagesHost.querySelectorAll('.ag-pdf-page-slot canvas').forEach(c => {
        c.style.filter = isDarkMode ? 'invert(0.9) hue-rotate(180deg) brightness(0.95)' : 'none';
      });
    };

    // Reveal in Explorer
    btnReveal.onclick = async () => {
      await doRevealInExplorer(actualResolvedPath || filePath);
    };

    // Print
    btnPrint.onclick = () => window.print();

    // Search Toggle
    btnSearchToggle.onclick = () => {
      const isVisible = searchBar.style.display === 'flex';
      searchBar.style.display = isVisible ? 'none' : 'flex';
      btnSearchToggle.classList.toggle('active', !isVisible);
      if (!isVisible) {
        setTimeout(() => searchInput.focus(), 50);
        if (searchInput.value) executeSearch(searchInput.value);
      } else {
        if (typeof clearSearchHighlights === 'function') clearSearchHighlights();
      }
    };

    // One foreground raster task at a time; queued work is coalesced per page.
    function isRenderCurrent(pageNum, record) {
      return !pdfDisposed && !record.cancelled && renderTasks.get(pageNum) === record;
    }
    function scheduleRenderQueue() {
      if (pdfDisposed || queueTimer !== null) return;
      queueTimer = setTimeout(() => { queueTimer=null; pumpRenderQueue(); }, 0);
    }
    function pumpRenderQueue() {
      if (pdfDisposed || isWheelZooming || activeRenders >= 1) return;
      const center = viewport.getBoundingClientRect().top + viewport.clientHeight/2;
      let chosen=null, distance=Infinity;
      for (const [number, record] of renderQueue) {
        if (renderTasks.has(number)) continue;
        const rect=record.slot.getBoundingClientRect();
        const next=Math.abs((rect.top+rect.bottom)/2-center);
        if (next<distance) { chosen=[number,record]; distance=next; }
      }
      if (!chosen) return;
      const [number,record]=chosen;
      renderQueue.delete(number); renderTasks.set(number,record);
      activeRenders++; perf.maxConcurrent=Math.max(perf.maxConcurrent,activeRenders);
      drawPageSlot(number,record);
    }
    function renderPageSlot(pageNum, slot) {
      if (pdfDisposed || !slot) return;
      if (slot.dataset.renderedScale === String(currentScale) &&
          slot.dataset.renderedRotation === String(rotation) && slot.querySelector('canvas')) {
        perf.cacheHits++;
        const cached=cachedPages.get(pageNum);
        if (cached) { cachedPages.delete(pageNum); cachedPages.set(pageNum,cached); }
        return;
      }
      const ongoing=renderTasks.get(pageNum);
      if (ongoing && ongoing.renderScale===currentScale && ongoing.renderRotation===rotation && !ongoing.cancelled) return;
      if (ongoing) { ongoing.cancelled=true; ongoing.task?.cancel(); perf.cancelled++; }
      renderQueue.set(pageNum,{slot,renderScale:currentScale,renderRotation:rotation,cancelled:false,task:null});
      scheduleRenderQueue();
    }
    function drawPageSlot(pageNum, record) {
      const {renderScale, renderRotation, slot} = record;
      let newCanvas;
      (async () => {
        try {
          const page = await doc.getPage(pageNum);
          if (!isRenderCurrent(pageNum, record)) return;
          const vp = page.getViewport({ scale: renderScale, rotation: renderRotation });

          const unscaledW = vp.width / renderScale;
          const unscaledH = vp.height / renderScale;
          pageDimensionsMap.set(pageNum, { width: unscaledW, height: unscaledH });
          slot.style.width = Math.round(vp.width) + 'px';
          slot.style.height = Math.round(vp.height) + 'px';

          const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(MAX_PAGE_PIXELS / (vp.width * vp.height)));
          newCanvas = document.createElement('canvas');
          newCanvas.width = Math.round(vp.width * dpr);
          newCanvas.height = Math.round(vp.height * dpr);
          newCanvas.style.width = '100%';
          newCanvas.style.height = '100%';
          newCanvas.style.position = 'absolute';
          newCanvas.style.top = '0';
          newCanvas.style.left = '0';
          newCanvas.style.display = 'block';
          if (isDarkMode) {
            newCanvas.style.filter = 'invert(0.9) hue-rotate(180deg) brightness(0.95)';
          }

          const ctx = newCanvas.getContext('2d', { alpha: false });
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const renderTask = page.render({ canvasContext: ctx, viewport: vp });
          record.task = renderTask;
          // PDF.js splits expensive operator lists into chunks. Give input and
          // scrolling a chance between chunks rather than monopolizing the UI.
          renderTask.onContinue = resume => setTimeout(() => {
            if (isRenderCurrent(pageNum,record)) resume();
            else renderTask.cancel();
          }, 0);
          perf.renders++;

          await renderTask.promise;

          // If another render was triggered while this one was running, abort
          if (!isRenderCurrent(pageNum, record)) {
            return;
          }

          // 1. Double-buffering atomic swap: SHOW CANVAS IMMEDIATELY (0 blank frames, 0 delay)
          slot.prepend(newCanvas);
          const oldCanvases = Array.from(slot.querySelectorAll('canvas')).filter(c => c !== newCanvas);
          oldCanvases.forEach(c => { c.remove(); c.width=0; c.height=0; });
          cachedPages.delete(pageNum);
          cachedPages.set(pageNum, {slot, pixels:newCanvas.width*newCanvas.height});
          trimPageCache();

          slot.dataset.renderedScale = String(renderScale);
          slot.dataset.renderedRotation = String(renderRotation);
          slot.dataset.rendered = 'true';

          // 2. Offscreen preparation for text layer (non-blocking for canvas display)
          const existingTextLayer=slot.querySelector('.textLayer');
          if (existingTextLayer?.dataset.pdfRotation===String(renderRotation) && existingTextLayer.dataset.pdfScale===String(renderScale)) {
            if (currentSearchQuery && typeof applyHighlightToPage === 'function') {
              applyHighlightToPage(slot, currentSearchQuery, pageNum);
              if (searchMatches[currentMatchIndex]?.pageNum === pageNum) {
                const marks = slot.querySelectorAll('mark.ag-pdf-highlight');
                const targetMark = marks[searchMatches[currentMatchIndex].matchOnPage] || marks[0];
                if (targetMark) targetMark.classList.add('ag-pdf-highlight-active');
              }
            }
          } else if (window.pdfjsLib && window.pdfjsLib.TextLayer) {
            try {
              const newTl = document.createElement('div');
              newTl.className = 'textLayer';
              newTl.dataset.pdfScale=String(renderScale);
              newTl.dataset.pdfRotation=String(renderRotation);
              newTl.style.setProperty('--total-scale-factor', String(renderScale));
              newTl.style.setProperty('--scale-round-x', '1px');
              newTl.style.setProperty('--scale-round-y', '1px');
              newTl.style.width = Math.round(vp.width) + 'px';
              newTl.style.height = Math.round(vp.height) + 'px';
              const tc = await page.getTextContent();
              if (isRenderCurrent(pageNum, record)) {
                const textLayer = new window.pdfjsLib.TextLayer({
                  textContentSource: tc,
                  container: newTl,
                  viewport: vp
                });
                await textLayer.render();
                const endOfContent = document.createElement('div');
                endOfContent.className = 'endOfContent';
                newTl.appendChild(endOfContent);
                if (isRenderCurrent(pageNum, record)) {
                  const oldTl = slot.querySelector('.textLayer');
                  slot.appendChild(newTl);
                  if (oldTl) oldTl.remove();
                  if (currentSearchQuery && typeof applyHighlightToPage === 'function') {
                    applyHighlightToPage(slot, currentSearchQuery, pageNum);
                    if (searchMatches[currentMatchIndex]?.pageNum === pageNum) {
                      const marks = slot.querySelectorAll('mark.ag-pdf-highlight');
                      const targetMark = marks[searchMatches[currentMatchIndex].matchOnPage] || marks[0];
                      if (targetMark) targetMark.classList.add('ag-pdf-highlight-active');
                    }
                  }
                }
              }
            } catch(tlErr) {}
          }

          // 3. Offscreen preparation for annotations (non-blocking)
          try {
            const existingLinks=slot.querySelector('.ag-pdf-link-layer');
            if (existingLinks?.dataset.pdfRotation===String(renderRotation)) {
              existingLinks.style.transform=`scale(${renderScale/Number(existingLinks.dataset.pdfScale)})`;
              return;
            }
            const annotations = await page.getAnnotations({ intent: 'display' });
            if (annotations && annotations.length > 0 && isRenderCurrent(pageNum, record)) {
              const newLl = document.createElement('div');
              newLl.className = 'ag-pdf-link-layer';
              newLl.dataset.pdfScale=String(renderScale);
              newLl.dataset.pdfRotation=String(renderRotation);
              newLl.style.transformOrigin='0 0';
              for (const annot of annotations) {
                if (annot.subtype !== 'Link' && annot.annotationType !== (window.pdfjsLib?.AnnotationType?.LINK ?? 2)) continue;
                if (!annot.rect || annot.rect.length < 4) continue;

                const rect = vp.convertToViewportRectangle(annot.rect);
                const left = Math.min(rect[0], rect[2]);
                const top = Math.min(rect[1], rect[3]);
                const width = Math.abs(rect[0] - rect[2]);
                const height = Math.abs(rect[1] - rect[3]);

                if (width <= 0 || height <= 0) continue;

                const linkEl = document.createElement('a');
                linkEl.className = 'ag-pdf-interactive-link';
                linkEl.style.left = Math.round(left) + 'px';
                linkEl.style.top = Math.round(top) + 'px';
                linkEl.style.width = Math.round(width) + 'px';
                linkEl.style.height = Math.round(height) + 'px';

                if (annot.dest) {
                  linkEl.dataset.type = 'internal';
                  linkEl.title = '单击跳转到引用目标/参考文献';
                  linkEl.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await navigateToDestination(annot.dest, pageNum);
                  };
                } else if (annot.url || annot.unsafeUrl) {
                  const extUrl = annot.url || annot.unsafeUrl;
                  linkEl.dataset.type = 'external';
                  linkEl.title = `按住 Ctrl 并单击以在默认浏览器打开:\n${extUrl}`;
                  linkEl.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.ctrlKey || e.metaKey) {
                      if (window.electronNative && typeof window.electronNative.openExternal === 'function') {
                        window.electronNative.openExternal(extUrl);
                      } else {
                        window.open(extUrl, '_blank');
                      }
                    } else {
                      showToast('按住 Ctrl 单击可在系统默认浏览器中打开外部链接');
                    }
                  };
                }

                newLl.appendChild(linkEl);
              }
              if (isRenderCurrent(pageNum, record)) {
                const oldLl = slot.querySelector('.ag-pdf-link-layer');
                slot.appendChild(newLl);
                if (oldLl) oldLl.remove();
              }
            }
          } catch (annErr) {}
        } catch (err) {
          if (err?.name !== 'RenderingCancelledException') {
            console.warn(`[PdfViewer] Slot ${pageNum} render error:`, err);
          }
        } finally {
          if (renderTasks.get(pageNum) === record) renderTasks.delete(pageNum);
          if (newCanvas && !newCanvas.isConnected) { newCanvas.width=0; newCanvas.height=0; }
          activeRenders--;
          scheduleRenderQueue();
        }
      })();
    }

    function releasePageSlot(pageNum, slot) {
      slot.querySelectorAll('canvas').forEach(c=>{c.remove();c.width=0;c.height=0;});
      slot.querySelector('.textLayer')?.remove();
      slot.querySelector('.ag-pdf-link-layer')?.remove();
      delete slot.dataset.rendered;
      delete slot.dataset.renderedScale;
      delete slot.dataset.renderedRotation;
      cachedPages.delete(pageNum);
    }
    function trimPageCache() {
      let pixels=[...cachedPages.values()].reduce((n,v)=>n+v.pixels,0);
      const rect=viewport.getBoundingClientRect();
      for (const [number,cached] of cachedPages) {
        if (cachedPages.size<=6 && pixels<=MAX_CACHE_PIXELS) break;
        const bounds=cached.slot.getBoundingClientRect();
        if (renderTasks.has(number) || (bounds.bottom>=rect.top && bounds.top<=rect.bottom)) continue;
        pixels-=cached.pixels;
        releasePageSlot(number,cached.slot);
      }
    }
    function cullPageSlot(pageNum, slot) {
      if (isWheelZooming) return;
      renderQueue.delete(pageNum);
      const record=renderTasks.get(pageNum);
      if (record) {record.cancelled=true;record.task?.cancel();perf.cancelled++;}
      // Keep nearby completed canvases under a bounded LRU pixel budget.
      trimPageCache();
    }

    function updateZoomSelect() {
      const pct = Math.round(currentScale * 100);
      zoomSelect.querySelector('option[data-dynamic-zoom]')?.remove();
      const opt = Array.from(zoomSelect.options).find(o => Math.round(parseFloat(o.value)*100) === pct);
      if (opt) {
        zoomSelect.value = opt.value;
      } else {
        const custom = document.createElement('option');
        custom.dataset.dynamicZoom = 'true';
        custom.value = String(currentScale);
        custom.textContent = `${pct}%`;
        zoomSelect.appendChild(custom);
        zoomSelect.value = custom.value;
      }
    }

    // Literature Navigation History & Return Stack
    const jumpHistory = [];
    let returnPillTimer = null;
    let toastTimer = null;

    function showToast(text) {
      let toast = host.querySelector('#ag-pdf-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ag-pdf-toast';
        toast.className = 'ag-pdf-toast';
        viewport.parentElement.appendChild(toast);
      }
      toast.innerText = text;
      toast.style.display = 'block';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        if (toast) toast.style.display = 'none';
      }, 2500);
    }

    function showReturnPill(fromPage) {
      let pill = host.querySelector('#ag-pdf-return-pill');
      if (!pill) {
        pill = document.createElement('div');
        pill.id = 'ag-pdf-return-pill';
        pill.className = 'ag-pdf-return-pill';
        pill.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9 13.5l-5-5 5-5 .7.7L5.9 8H14v1H5.9l3.8 3.8-.7.7z"/>
          </svg>
          <span id="ag-pdf-return-text">返回正文 (第 ${fromPage} 页)</span>
        `;
        pill.onclick = () => popNavigationHistory();
        viewport.parentElement.appendChild(pill);
      } else {
        const textSpan = pill.querySelector('#ag-pdf-return-text');
        if (textSpan) textSpan.innerText = `返回正文 (第 ${fromPage} 页)`;
        pill.style.display = 'flex';
      }

      if (returnPillTimer) clearTimeout(returnPillTimer);
      returnPillTimer = setTimeout(() => {
        if (pill) pill.style.display = 'none';
      }, 15000);
    }

    function hideReturnPill() {
      const pill = host.querySelector('#ag-pdf-return-pill');
      if (pill) pill.style.display = 'none';
      if (returnPillTimer) clearTimeout(returnPillTimer);
    }

    function popNavigationHistory() {
      const last = jumpHistory.pop();
      if (!last) return;
      viewport.scrollTo({ top: last.scrollTop, behavior: 'smooth' });
      activePage = last.pageNum;
      pageInput.value = last.pageNum;
      highlightActiveThumb(last.pageNum);
      if (jumpHistory.length === 0) {
        hideReturnPill();
      } else {
        showReturnPill(jumpHistory[jumpHistory.length - 1].pageNum);
      }
    }

    function highlightJumpTarget(slot, relativeY) {
      const flash = document.createElement('div');
      flash.className = 'ag-pdf-jump-target';
      flash.style.cssText = `
        position: absolute;
        left: 8px;
        right: 8px;
        top: ${Math.max(0, relativeY)}px;
        height: 48px;
        pointer-events: none;
        z-index: 10;
        border-radius: 4px;
      `;
      slot.appendChild(flash);
      setTimeout(() => flash.remove(), 1700);
    }

    async function navigateToDestination(dest, fromPageNum) {
      try {
        let resolved = dest;
        if (typeof dest === 'string') {
          resolved = await doc.getDestination(dest);
        }
        if (!Array.isArray(resolved)) return;

        const pageIndex = await doc.getPageIndex(resolved[0]);
        const targetPage = pageIndex + 1;
        const targetSlot = document.getElementById(`ag-pdf-slot-${targetPage}`);
        if (!targetSlot) return;

        // Record current reading position before jumping
        jumpHistory.push({
          pageNum: fromPageNum,
          scrollTop: viewport.scrollTop
        });

        // Compute destination Y offset if available
        let targetScrollTop = targetSlot.offsetTop;
        const destY = resolved[3];
        if (typeof destY === 'number') {
          const offsetFromTop = (rawPageHeight - destY) * currentScale;
          targetScrollTop += Math.max(0, offsetFromTop - 36);
        }

        viewport.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        activePage = targetPage;
        pageInput.value = targetPage;
        highlightActiveThumb(targetPage);

        // Flash highlight target reference/figure
        highlightJumpTarget(targetSlot, targetScrollTop - targetSlot.offsetTop);

        // Show return pill
        showReturnPill(fromPageNum);

      } catch (err) {
        console.warn('[PdfViewer] Navigate destination error:', err);
      }
    }

    // Foxit-style Center-Locked Smooth Zoom Engine
    // Horizontal: Always centered (symmetric margins, Foxit continuous reading mode)
    // Vertical: Anchor locked to the exact PDF content coordinate at viewport vertical center
    let isWheelZooming = false;
    let wheelCommitTimer = null;
    let activeWheelAnchor = null;

    function captureZoomAnchor(overrideScreenY) {
      const vRect = viewport.getBoundingClientRect();
      const vW = viewport.clientWidth;
      const vH = viewport.clientHeight;
      const screenY = (typeof overrideScreenY === 'number') ? overrideScreenY : (vRect.top + vH / 2);

      if (!pageSlots.length) return {targetPage:1,fractionY:0.5,screenY,vW,vH};
      const first=pageSlots[0];
      const firstRect=first.getBoundingClientRect();
      const stride=firstRect.height+28;
      const index=Math.max(0,Math.min(pageSlots.length-1,Math.floor((screenY-firstRect.top)/stride)));
      const chosenSlot=pageSlots[index];
      const r=chosenSlot.getBoundingClientRect();
      const fractionY=r.height>0 ? Math.max(0,Math.min(1,(screenY-r.top)/r.height)) : 0.5;
      const gapOffsetY=undefined;

      const targetPage = parseInt(chosenSlot.dataset.page, 10);
      return {
        targetPage,
        fractionY,
        gapOffsetY,
        screenY,
        vW,
        vH
      };
    }

    function commitCrispRender() {
      if (zoomFrame !== null) { cancelAnimationFrame(zoomFrame); zoomFrame=null; }
      if (activeWheelAnchor) applyZoom(activeWheelAnchor);
      activeWheelAnchor = null;
      isWheelZooming = false;

      const vr = viewport.getBoundingClientRect();
      const first=pageSlots[0]?.getBoundingClientRect();
      if (!first) return;
      const stride=first.height+28;
      const start=Math.max(0,Math.floor((vr.top-first.top-400)/stride));
      const end=Math.min(pageSlots.length-1,Math.ceil((vr.bottom-first.top+400)/stride));
      renderQueue.clear();
      for (let i=start;i<=end;i++) renderPageSlot(i+1,pageSlots[i]);
      trimPageCache();
      scheduleRenderQueue();
    }

    function applyZoom(anchor) {
      if (!anchor) anchor = captureZoomAnchor();
      updateZoomSelect();

      const newSlotWidth = Math.round(rawPageWidth * currentScale);
      const newSlotHeight = Math.round(rawPageHeight * currentScale);
      const vW = viewport.clientWidth;
      const vH = viewport.clientHeight;
      const vRect = viewport.getBoundingClientRect();

      // 1. Instant CSS variable update on pagesHost for default slots
      pagesHost.style.setProperty('--pdf-slot-w', newSlotWidth + 'px');
      pagesHost.style.setProperty('--pdf-slot-h', newSlotHeight + 'px');
      for (let i = 1; i <= pageSlots.length; i++) {
        const slot = pageSlots[i - 1];
        if (!slot) continue;
        const dims = pageDimensionsMap.get(i);
        if (dims) {
          slot.style.width = Math.round(dims.width * currentScale) + 'px';
          slot.style.height = Math.round(dims.height * currentScale) + 'px';
        } else if (slot.style.width) {
          slot.style.width = newSlotWidth + 'px';
          slot.style.height = newSlotHeight + 'px';
        }
      }
      // Keep selection and link geometry aligned while reusing their DOM.
      for (const {slot} of cachedPages.values()) {
        for (const layer of slot.querySelectorAll('.textLayer, .ag-pdf-link-layer')) {
          if (layer.dataset.pdfRotation===String(rotation)) {
            layer.style.transform=`scale(${currentScale/Number(layer.dataset.pdfScale)})`;
          }
        }
      }

      // 2. Synchronous scroll realignment locked to viewport center
      if (anchor && anchor.targetPage) {
        const targetSlot = document.getElementById(`ag-pdf-slot-${anchor.targetPage}`);
        if (targetSlot) {
          const dims = pageDimensionsMap.get(anchor.targetPage);
          const targetSlotH = dims ? Math.round(dims.height * currentScale) : newSlotHeight;
          let newScrollTop;
          if (anchor.fractionY !== null && anchor.fractionY !== undefined) {
            newScrollTop = targetSlot.offsetTop + (anchor.fractionY * targetSlotH) - (anchor.screenY - vRect.top);
          } else if (anchor.gapOffsetY !== undefined) {
            newScrollTop = targetSlot.offsetTop - anchor.gapOffsetY - (anchor.screenY - vRect.top);
          } else {
            newScrollTop = targetSlot.offsetTop - (anchor.screenY - vRect.top);
          }
          viewport.scrollTop = Math.max(0, Math.round(newScrollTop));
        }
      }

      // 3. Perfect horizontal centering (symmetric margins, Foxit continuous reading mode)
      if (newSlotWidth > vW) {
        viewport.scrollLeft = Math.max(0, Math.round((newSlotWidth - vW) / 2));
      } else {
        viewport.scrollLeft = 0;
      }
    }

    // Zoom Controls
    btnZoomIn.onclick = () => {
      if (wheelCommitTimer) clearTimeout(wheelCommitTimer);
      activeWheelAnchor = null;
      isWheelZooming = false;
      const anchor = captureZoomAnchor();
      currentScale = Math.min(currentScale * 1.2, 4.5);
      applyZoom(anchor);
      commitCrispRender();
    };
    btnZoomOut.onclick = () => {
      if (wheelCommitTimer) clearTimeout(wheelCommitTimer);
      activeWheelAnchor = null;
      isWheelZooming = false;
      const anchor = captureZoomAnchor();
      currentScale = Math.max(currentScale / 1.2, 0.35);
      applyZoom(anchor);
      commitCrispRender();
    };

    zoomSelect.onchange = () => {
      if (wheelCommitTimer) clearTimeout(wheelCommitTimer);
      activeWheelAnchor = null;
      isWheelZooming = false;
      const anchor = captureZoomAnchor();
      const val = zoomSelect.value;
      if (val === 'auto' || val === 'page-width') {
        const availW = (viewport.clientWidth || 800) - 40;
        currentScale = Math.min(Math.max(availW / rawPageWidth, 0.35), 4.5);
      } else if (val === 'page-fit') {
        const availH = (viewport.clientHeight || 800) - 40;
        currentScale = Math.min(Math.max(availH / rawPageHeight, 0.35), 4.5);
      } else if (val === 'page-actual') {
        currentScale = 1.0;
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) currentScale = num;
      }
      applyZoom(anchor);
      commitCrispRender();
    };

    btnRotate.onclick = () => {
      if (wheelCommitTimer) clearTimeout(wheelCommitTimer);
      activeWheelAnchor = null;
      isWheelZooming = false;
      const anchor = captureZoomAnchor();
      rotation = (rotation + 90) % 360;
      pagesHost.querySelectorAll('.ag-pdf-page-slot').forEach(s => {
        delete s.dataset.renderedScale;
        delete s.dataset.renderedRotation;
      });
      applyZoom(anchor);
      commitCrispRender();
    };

    // Wheel Zooming (Ctrl / Meta + Wheel: Foxit-style screen-center lock + 60fps zero-reflow smooth zoom)
    viewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        // 1. Capture invariant anchor at the initial wheel tick of continuous gesture
        // Anchor is locked to the screen center (PDF center at the pre-zoom moment)
        if (!activeWheelAnchor) {
          isWheelZooming = true;
          activeWheelAnchor = captureZoomAnchor();
        }

        // 2. Symmetric exponential zoom factor (smooth for high-precision touchpad & standard mouse wheel)
        let factor;
        if (Math.abs(e.deltaY) < 50) {
          factor = Math.exp(-e.deltaY * 0.005);
        } else {
          factor = e.deltaY < 0 ? 1.12 : (1 / 1.12);
        }
        currentScale = Math.min(Math.max(currentScale * factor, 0.35), 4.5);

        // 3. Instant layout & scroll realignment (GPU texture scaling, 0ms latency, zero jump)
        if (zoomFrame === null) zoomFrame=requestAnimationFrame(()=>{
          zoomFrame=null; if (!pdfDisposed && activeWheelAnchor) applyZoom(activeWheelAnchor);
        });

        // 4. Debounced settle: redraw high-res crisp canvases when user stops rolling
        if (wheelCommitTimer) clearTimeout(wheelCommitTimer);
        wheelCommitTimer = setTimeout(() => {
          commitCrispRender();
        }, 180);
      }
    }, { passive: false });

    // Page Navigation
    function scrollToPage(pageNum) {
      if (pageNum < 1 || pageNum > doc.numPages) return;
      if (wheelCommitTimer) clearTimeout(wheelCommitTimer);
      activeWheelAnchor = null;
      isWheelZooming = false;
      const targetSlot = document.getElementById(`ag-pdf-slot-${pageNum}`);
      if (targetSlot) {
        targetSlot.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pageInput.value = pageNum;
        activePage = pageNum;
        highlightActiveThumb(pageNum);
      }
    }

    btnPrev.onclick = () => scrollToPage(activePage - 1);
    btnNext.onclick = () => scrollToPage(activePage + 1);
    pageInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const val = parseInt(pageInput.value, 10);
        if (!isNaN(val)) scrollToPage(val);
      }
    };

    // Scroll Tracking
    let scrollThrottle = null;
    viewport.addEventListener('scroll', () => {
      if (isWheelZooming) return;
      if (scrollThrottle) return;
      scrollThrottle = setTimeout(() => {
        scrollThrottle = null;
        const vRect = viewport.getBoundingClientRect();
        const vMid = vRect.top + vRect.height / 3;
        const first=pageSlots[0]?.getBoundingClientRect();
        if (!first) return;
        const index=Math.max(0,Math.min(pageSlots.length-1,Math.floor((vMid-first.top)/(first.height+28))));
        const pageNum=index+1;
        if (activePage!==pageNum) {
          activePage=pageNum; pageInput.value=pageNum; highlightActiveThumb(pageNum);
        }
      }, 60);
    });

    // Outline Tree Builder
    async function renderOutlineTree(items, container, docProxy, depth = 0) {
      for (const item of items) {
        const row = document.createElement('div');
        row.className = 'ag-pdf-outline-entry';
        row.style.paddingLeft = (depth * 12 + 6) + 'px';
        row.innerHTML = `<span style="color:#80868b;font-size:9px;">${item.items && item.items.length > 0 ? '▶' : '•'}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${item.title}">${item.title}</span>`;
        
        row.onclick = async () => {
          try {
            await navigateToDestination(item.dest, activePage);
          } catch (err) {
            console.warn('[PdfViewer] Outline jump failed:', err);
          }
        };
        container.appendChild(row);

        if (item.items && item.items.length > 0) {
          await renderOutlineTree(item.items, container, docProxy, depth + 1);
        }
      }
    }

    // Thumbnails Builder (Clean cards with page numbers, matching reference image)
    function initThumbnails(container, docProxy, numPages, ratio) {
      container.innerHTML = '';
      const thumbWidth = 96;
      const thumbHeight = Math.round(thumbWidth * ratio);

      for (let i = 1; i <= numPages; i++) {
        const card = document.createElement('div');
        card.className = 'ag-pdf-thumb-card' + (i === 1 ? ' active' : '');
        card.id = `ag-pdf-thumb-${i}`;
        card.dataset.page = String(i);
        card.innerHTML = `
          <div class="ag-pdf-thumb-preview" style="width:${thumbWidth}px;height:${thumbHeight}px;">
            <canvas width="${thumbWidth}" height="${thumbHeight}" style="display:none;"></canvas>
            <span style="font-size:11px;color:#9aa0a6;">${i}</span>
          </div>
          <span class="ag-pdf-thumb-num">${i}</span>
        `;
        card.onclick = () => scrollToPage(i);
        container.appendChild(card);
      }

      const pendingThumbs = new Set();
      let thumbnailBusy=false;
      let thumbnailTimer=null;
      const thumbTasks=new Set();
      async function renderNextThumb() {
        thumbnailTimer=null;
        if (pdfDisposed || thumbnailBusy || !pendingThumbs.size) return;
        if (activeRenders || renderQueue.size || isWheelZooming || !isSidebarOpen || currentSidebarTab!=='thumbs') {
          thumbnailTimer=setTimeout(renderNextThumb,150); return;
        }
        const card=pendingThumbs.values().next().value;
        pendingThumbs.delete(card); thumbnailBusy=true;
        let task;
        try {
          const p=await docProxy.getPage(Number(card.dataset.page));
          if (pdfDisposed) return;
          const vp=p.getViewport({scale:thumbWidth/rawPageWidth});
          const c=card.querySelector('canvas');
          c.width=vp.width; c.height=vp.height;
          task=p.render({canvasContext:c.getContext('2d'),viewport:vp});
          thumbTasks.add(task);
          task.onContinue=resume=>setTimeout(()=>pdfDisposed?task.cancel():resume(),0);
          await task.promise;
          if (pdfDisposed) return;
          c.style.display='block';
          card.dataset.renderedThumb='true';
          const ph=card.querySelector('.ag-pdf-thumb-preview > span');
          if (ph) ph.style.display='none';
        } catch (_) {}
        finally {
          thumbTasks.delete(task); thumbnailBusy=false;
          if (!pdfDisposed && pendingThumbs.size) thumbnailTimer=setTimeout(renderNextThumb,50);
        }
      }
      pdfObservers.push({disconnect(){
        if (thumbnailTimer!==null) clearTimeout(thumbnailTimer);
        pendingThumbs.clear(); thumbTasks.forEach(task=>task.cancel());
      }});
      // Thumbnails are lower priority than foreground pages and run serially.
      const thumbObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const card = entry.target;
            const pNum = parseInt(card.dataset.page, 10);
            if (!card.dataset.renderedThumb) {
              pendingThumbs.add(card);
              if (thumbnailTimer===null) thumbnailTimer=setTimeout(renderNextThumb,100);
            }
          } else pendingThumbs.delete(entry.target);
        }
      }, { root: container, rootMargin: '200px 0px' });
      pdfObservers.push(thumbObserver);

      container.querySelectorAll('.ag-pdf-thumb-card').forEach(c => thumbObserver.observe(c));
    }

    function highlightActiveThumb(pageNum) {
      const activeCard = thumbsView.querySelector('.ag-pdf-thumb-card.active');
      if (activeCard) activeCard.classList.remove('active');
      const targetCard = document.getElementById(`ag-pdf-thumb-${pageNum}`);
      if (targetCard) {
        targetCard.classList.add('active');
        if (isSidebarOpen && currentSidebarTab==='thumbs') {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }

    // Search Engine with Native Yellow Match Highlighting & Centered Jumping
    let searchMatches = [];
    let currentMatchIndex = -1;
    let searchDebounce = null;
    let searchGeneration = 0;
    let currentSearchQuery = '';

    function escapeSearchReg(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function clearSearchHighlights() {
      currentSearchQuery = '';
      host.querySelectorAll('.ag-pdf-page-slot .textLayer mark.ag-pdf-highlight').forEach(m => {
        const p = m.parentNode;
        if (p) p.textContent = p.textContent;
      });
    }

    function applyHighlightToPage(slot, query, pageNum) {
      const textLayer = slot.querySelector('.textLayer');
      if (!textLayer || !query) return;

      // Clear any prior marks first
      textLayer.querySelectorAll('mark.ag-pdf-highlight').forEach(m => {
        const p = m.parentNode;
        if (p) p.textContent = p.textContent;
      });

      const spans = textLayer.querySelectorAll('span');
      const regex = new RegExp('(' + escapeSearchReg(query) + ')', 'gi');
      let matchIdx = 0;

      spans.forEach(span => {
        const text = span.textContent;
        if (!text || !text.toLowerCase().includes(query)) return;

        const parts = text.split(regex);
        span.innerHTML = '';
        parts.forEach(part => {
          if (part.toLowerCase() === query) {
            const mark = document.createElement('mark');
            mark.className = 'ag-pdf-highlight';
            mark.dataset.pageNum = String(pageNum);
            mark.dataset.matchOnPage = String(matchIdx++);
            mark.textContent = part;
            span.appendChild(mark);
          } else if (part) {
            span.appendChild(document.createTextNode(part));
          }
        });
      });
    }

    searchInput.oninput = () => {
      searchGeneration++;
      if (searchDebounce) clearTimeout(searchDebounce);
      clearSearchHighlights();
      searchDebounce = setTimeout(() => {
        executeSearch(searchInput.value);
      }, 250);
    };

    searchInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) jumpSearchMatch(-1);
        else jumpSearchMatch(1);
      }
    };

    btnSearchPrev.onclick = () => jumpSearchMatch(-1);
    btnSearchNext.onclick = () => jumpSearchMatch(1);

    async function executeSearch(query) {
      const generation = ++searchGeneration;
      query = (query || '').trim().toLowerCase();
      clearSearchHighlights();
      searchMatches = [];
      currentMatchIndex = -1;

      if (!query) {
        searchBadge.innerText = '';
        btnSearchPrev.style.display = 'none';
        btnSearchNext.style.display = 'none';
        return;
      }

      currentSearchQuery = query;
      searchBadge.innerText = '...';

      const matches = [];
      for (let i = 1; i <= doc.numPages; i++) {
        if (pdfDisposed || generation !== searchGeneration) return;
        try {
          const page = await doc.getPage(i);
          const textContent = await page.getTextContent();
          let pageMatchCount = 0;
          for (const item of textContent.items) {
            const str = (item.str || '').toLowerCase();
            let pos = 0;
            while ((pos = str.indexOf(query, pos)) !== -1) {
              matches.push({ pageNum: i, matchOnPage: pageMatchCount++ });
              pos += query.length;
            }
          }
        } catch (e) {}
      }

      if (pdfDisposed || generation !== searchGeneration) return;
      searchMatches = matches;

      // Apply highlights to all currently rendered page slots
      for (const { slot } of cachedPages.values()) {
        const pNum = Number(slot.dataset.page || (slot.id ? slot.id.replace('ag-pdf-slot-', '') : 0));
        applyHighlightToPage(slot, query, pNum);
      }

      if (matches.length > 0) {
        currentMatchIndex = 0;
        searchBadge.innerText = `1/${matches.length}`;
        btnSearchPrev.style.display = 'inline-flex';
        btnSearchNext.style.display = 'inline-flex';
        jumpToMatch(0);
      } else {
        searchBadge.innerText = '0/0';
        btnSearchPrev.style.display = 'none';
        btnSearchNext.style.display = 'none';
      }
    }

    function jumpToMatch(index) {
      if (searchMatches.length === 0) return;
      currentMatchIndex = (index + searchMatches.length) % searchMatches.length;
      searchBadge.innerText = `${currentMatchIndex + 1}/${searchMatches.length}`;

      const match = searchMatches[currentMatchIndex];
      scrollToPage(match.pageNum);

      const activateMark = () => {
        host.querySelectorAll('mark.ag-pdf-highlight.ag-pdf-highlight-active').forEach(m => {
          m.classList.remove('ag-pdf-highlight-active');
        });

        const slot = document.getElementById(`ag-pdf-slot-${match.pageNum}`) || pageSlots[match.pageNum - 1];
        if (!slot) return;

        if (currentSearchQuery && !slot.querySelector('mark.ag-pdf-highlight')) {
          applyHighlightToPage(slot, currentSearchQuery, match.pageNum);
        }

        const marks = slot.querySelectorAll('mark.ag-pdf-highlight');
        const targetMark = marks[match.matchOnPage] || marks[0];
        if (targetMark) {
          targetMark.classList.add('ag-pdf-highlight-active');
          targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };

      activateMark();
      setTimeout(activateMark, 100);
      setTimeout(activateMark, 300);
    }

    function jumpSearchMatch(step) {
      jumpToMatch(currentMatchIndex + step);
    }

    // Region Selection & Native Comment System
    let isCropActive = false;
    let activeSelectionBox = null;
    let activeCommentPopup = null;
    const btnCrop = host.querySelector('#ag-pdf-btn-crop');

    if (btnCrop) {
      btnCrop.onclick = () => {
        isCropActive = !isCropActive;
        btnCrop.classList.toggle('active', isCropActive);
        viewport.style.cursor = isCropActive ? 'crosshair' : '';
        if (!isCropActive) clearSelection();
      };
    }

    function clearSelection() {
      if (activeSelectionBox) {
        activeSelectionBox.remove();
        activeSelectionBox = null;
      }
      if (activeCommentPopup) {
        activeCommentPopup.remove();
        activeCommentPopup = null;
      }
    }

    function toCanonicalUri(p) {
      if (!p) return '';
      if (p.startsWith('file:///')) return p;
      const norm = p.replace(/\\/g, '/');
      const parts = norm.split('/');
      if (parts.length > 0 && /^[a-zA-Z]:$/i.test(parts[0])) {
        parts[0] = parts[0][0].toLowerCase() + '%3A';
      }
      return 'file:///' + parts.map(encodeURIComponent).join('/').replace(/%253A/g, '%3A');
    }

    function getReduxStore() {
      if (window.__antigravityReduxStore?.dispatch) return window.__antigravityReduxStore;
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        const k = Object.keys(el).find(key => key.startsWith('__reactFiber$'));
        if (k && el[k]) {
          let f = el[k];
          while (f) {
            if (f.memoizedProps?.store?.dispatch) {
              window.__antigravityReduxStore = f.memoizedProps.store;
              return f.memoizedProps.store;
            }
            f = f.return;
          }
        }
      }
      return null;
    }

    async function cropPageRegion(slot, normBox) {
      const canvas = slot.querySelector('canvas');
      if (!canvas) return null;

      const sx = normBox.x * canvas.width;
      const sy = normBox.y * canvas.height;
      const sw = normBox.width * canvas.width;
      const sh = normBox.height * canvas.height;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = Math.max(1, Math.round(sw));
      cropCanvas.height = Math.max(1, Math.round(sh));
      const ctx = cropCanvas.getContext('2d');
      ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);

      const blob = await new Promise(r => cropCanvas.toBlob(r, 'image/png'));
      if (!blob) return null;
      const arrayBuffer = await blob.arrayBuffer();
      return {
        blob,
        bytes: new Uint8Array(arrayBuffer),
        dataUrl: cropCanvas.toDataURL('image/png')
      };
    }

    function dispatchNativeComment({ sourceUri, fileName, pageNum, normBox, croppedBytes, commentText }) {
      const store = getReduxStore();
      if (!store) {
        console.warn('[PdfViewer] Could not locate Redux store to dispatch comment.');
        return false;
      }

      const convId = (window.location.pathname.split('/c/')[1]?.split('?')[0]) || '';
      const commentId = crypto.randomUUID();
      const commentObj = {
        id: commentId,
        ari: {
          sourceUri: sourceUri,
          displayName: `${fileName} (Page ${pageNum})`
        },
        artifactSelection: {
          selection: {
            case: "imageSelection",
            value: {
              croppedMedia: {
                mimeType: "image/png",
                payload: {
                  case: "inlineData",
                  value: croppedBytes
                }
              },
              x: normBox.x,
              y: normBox.y,
              width: normBox.width,
              height: normBox.height
            }
          }
        },
        comment: commentText,
        cascadeId: convId,
        initialPositioning: {
          beforeText: "",
          afterText: "",
          textSelection: "",
          startLine: 1,
          endLine: 1
        }
      };

      store.dispatch({
        type: "comments/updateArtifactComments",
        payload: {
          type: "deltaComments",
          artifactSourceUri: sourceUri,
          toAdd: [commentObj]
        }
      });
      return true;
    }

    // --- Smart Multi-Column & Whitespace Selection Clamping ---
    function getColumnInfo(startSpan, textLayer) {
      const spans = Array.from(textLayer.querySelectorAll('span'));
      const sLeft = startSpan.offsetLeft;
      const sRight = sLeft + startSpan.offsetWidth;
      const colSpans = spans.filter(s => {
        const leftDiff = Math.abs(s.offsetLeft - sLeft);
        const overlap = Math.max(0, Math.min(sRight, s.offsetLeft + s.offsetWidth) - Math.max(sLeft, s.offsetLeft));
        return leftDiff < 80 || overlap > 30;
      });
      if (colSpans.length === 0) colSpans.push(startSpan);
      return {
        spans: colSpans,
        minX: Math.min(...colSpans.map(s => s.offsetLeft)),
        maxX: Math.max(...colSpans.map(s => s.offsetLeft + s.offsetWidth)),
        maxY: Math.max(...colSpans.map(s => s.offsetTop + s.offsetHeight))
      };
    }

    function findClampedSpan(colInfo, clientX, clientY, slotRect) {
      const my = clientY - slotRect.top;
      const mx = clientX - slotRect.left;

      let targetSpan = null;
      let minVertDist = Infinity;
      for (const s of colInfo.spans) {
        const sTop = s.offsetTop;
        const sBottom = sTop + s.offsetHeight;
        let vDist = 0;
        if (my < sTop) vDist = sTop - my;
        else if (my > sBottom) vDist = my - sBottom;
        if (vDist < minVertDist) {
          minVertDist = vDist;
          targetSpan = s;
        }
      }
      if (!targetSpan) targetSpan = colInfo.spans[0];
      const tText = targetSpan.textContent || '';

      let offset = tText.length;
      if (mx < targetSpan.offsetLeft) {
        offset = 0;
      } else if (mx < targetSpan.offsetLeft + targetSpan.offsetWidth && targetSpan.offsetWidth > 0) {
        const ratio = Math.max(0, Math.min(1, (mx - targetSpan.offsetLeft) / targetSpan.offsetWidth));
        offset = Math.round(ratio * tText.length);
      }
      return { span: targetSpan, offset };
    }

    let isTextSelecting = false;
    let textSelectAnchorSpan = null;
    let textSelectAnchorNode = null;
    let textSelectAnchorOffset = 0;
    let textSelectColInfo = null;
    let activeTextLayer = null;

    const onTextSelectionMove = (moveEvt) => {
      if (!isTextSelecting || !textSelectColInfo || !activeTextLayer) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const slot = activeTextLayer.closest('.ag-pdf-page-slot');
      if (!slot) return;
      const slotRect = slot.getBoundingClientRect();
      const mx = moveEvt.clientX - slotRect.left;

      const elUnderPointer = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY);
      const spanUnderPointer = elUnderPointer?.closest('.textLayer span');

      const focusNode = sel.focusNode;
      const isFocusContainer = (focusNode === activeTextLayer || (focusNode?.nodeType === Node.ELEMENT_NODE && focusNode.classList.contains('textLayer')));

      let isCrossColumnJump = false;
      if (spanUnderPointer) {
        const spanLeft = spanUnderPointer.offsetLeft;
        if (mx <= textSelectColInfo.maxX + 35 && spanLeft > textSelectColInfo.maxX + 45) {
          isCrossColumnJump = true;
        }
      } else {
        isCrossColumnJump = true;
      }

      if (isFocusContainer || (isCrossColumnJump && mx <= textSelectColInfo.maxX + 45)) {
        const clamped = findClampedSpan(textSelectColInfo, moveEvt.clientX, moveEvt.clientY, slotRect);
        if (clamped && clamped.span) {
          const targetTextNode = clamped.span.firstChild || clamped.span;
          const targetOffset = Math.min((targetTextNode.textContent || '').length, clamped.offset);
          const anchorNode = textSelectAnchorNode || textSelectAnchorSpan?.firstChild || textSelectAnchorSpan;
          try {
            sel.setBaseAndExtent(anchorNode, textSelectAnchorOffset, targetTextNode, targetOffset);
          } catch (_) {}
        }
      }
    };

    const onTextSelectionUp = () => {
      if (isTextSelecting) {
        isTextSelecting = false;
        if (activeTextLayer) {
          activeTextLayer.classList.remove('selecting');
          activeTextLayer = null;
        }
        textSelectAnchorSpan = null;
        textSelectAnchorNode = null;
        textSelectColInfo = null;
        window.removeEventListener('mousemove', onTextSelectionMove);
        window.removeEventListener('mouseup', onTextSelectionUp);
      }
    };

    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ag-pdf-comment-popup')) return;

      const shouldCrop = isCropActive || e.altKey;
      if (!shouldCrop) {
        if (activeCommentPopup && !e.target.closest('.ag-pdf-comment-popup')) {
          clearSelection();
        }
        if (e.button === 0) {
          const targetSpan = e.target.closest('.textLayer span');
          if (targetSpan) {
            isTextSelecting = true;
            textSelectAnchorSpan = targetSpan;
            activeTextLayer = targetSpan.closest('.textLayer');
            if (activeTextLayer) {
              activeTextLayer.classList.add('selecting');
              textSelectColInfo = getColumnInfo(targetSpan, activeTextLayer);
            }
            // Precisely calculate the anchor text node and character offset at the click point
            let anchorNode = null;
            let anchorOffset = 0;
            if (document.caretRangeFromPoint) {
              const clickRange = document.caretRangeFromPoint(e.clientX, e.clientY);
              if (clickRange && targetSpan.contains(clickRange.startContainer)) {
                anchorNode = clickRange.startContainer;
                anchorOffset = clickRange.startOffset;
              }
            }
            if (!anchorNode) {
              anchorNode = targetSpan.firstChild || targetSpan;
              anchorOffset = 0;
            }
            textSelectAnchorNode = anchorNode;
            textSelectAnchorOffset = anchorOffset;
            window.addEventListener('mousemove', onTextSelectionMove);
            window.addEventListener('mouseup', onTextSelectionUp);
          }
        }
        return;
      }

      const slot = e.target.closest('.ag-pdf-page-slot');
      if (!slot) return;

      e.preventDefault();
      e.stopPropagation();
      clearSelection();

      const pageNum = Number(slot.dataset.page || (slot.id ? slot.id.replace('ag-pdf-slot-', '') : 1));
      const slotRect = slot.getBoundingClientRect();
      const startX = Math.max(0, Math.min(slot.clientWidth, e.clientX - slotRect.left));
      const startY = Math.max(0, Math.min(slot.clientHeight, e.clientY - slotRect.top));

      const rectBox = document.createElement('div');
      rectBox.className = 'ag-pdf-selection-rect';
      rectBox.style.left = startX + 'px';
      rectBox.style.top = startY + 'px';
      rectBox.style.width = '0px';
      rectBox.style.height = '0px';
      slot.appendChild(rectBox);
      activeSelectionBox = rectBox;

      let curX = startX;
      let curY = startY;

      const onMouseMove = (moveEvt) => {
        curX = Math.max(0, Math.min(slot.clientWidth, moveEvt.clientX - slotRect.left));
        curY = Math.max(0, Math.min(slot.clientHeight, moveEvt.clientY - slotRect.top));

        const left = Math.min(startX, curX);
        const top = Math.min(startY, curY);
        const width = Math.abs(curX - startX);
        const height = Math.abs(curY - startY);

        rectBox.style.left = left + 'px';
        rectBox.style.top = top + 'px';
        rectBox.style.width = width + 'px';
        rectBox.style.height = height + 'px';
      };

      const onMouseUp = async () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        const left = Math.min(startX, curX);
        const top = Math.min(startY, curY);
        const width = Math.abs(curX - startX);
        const height = Math.abs(curY - startY);

        if (width < 15 || height < 15) {
          clearSelection();
          return;
        }

        const normBox = {
          x: left / slot.clientWidth,
          y: top / slot.clientHeight,
          width: width / slot.clientWidth,
          height: height / slot.clientHeight
        };

        const popup = document.createElement('div');
        popup.className = 'ag-pdf-comment-popup';
        
        let popupTop = top + height + 8;
        if (popupTop + 140 > slot.clientHeight) {
          popupTop = Math.max(8, top - 130);
        }
        let popupLeft = Math.min(left, slot.clientWidth - 290);
        if (popupLeft < 8) popupLeft = 8;

        popup.style.top = popupTop + 'px';
        popup.style.left = popupLeft + 'px';

        popup.innerHTML = `
          <textarea class="ag-pdf-comment-input" placeholder="输入针对此区域的问题或批注... (Ctrl+Enter 添加)"></textarea>
          <div class="ag-pdf-comment-btn-row">
            <button class="ag-pdf-comment-btn ag-pdf-comment-btn-cancel" type="button">Cancel</button>
            <div style="display:flex;align-items:center;gap:6px;">
              <button class="ag-pdf-comment-btn ag-pdf-comment-btn-copy" type="button" title="仅复制截图到剪贴板">复制截图</button>
              <button class="ag-pdf-comment-btn ag-pdf-comment-btn-submit" type="button">Add Comment</button>
            </div>
          </div>
        `;

        slot.appendChild(popup);
        activeCommentPopup = popup;

        const input = popup.querySelector('.ag-pdf-comment-input');
        const btnCancel = popup.querySelector('.ag-pdf-comment-btn-cancel');
        const btnCopy = popup.querySelector('.ag-pdf-comment-btn-copy');
        const btnSubmit = popup.querySelector('.ag-pdf-comment-btn-submit');

        setTimeout(() => input.focus(), 50);

        btnCancel.onclick = (ce) => {
          ce.stopPropagation();
          clearSelection();
        };

        btnCopy.onclick = async (ce) => {
          ce.stopPropagation();
          const crop = await cropPageRegion(slot, normBox);
          if (crop && crop.blob) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': crop.blob })]);
              showToast('✓ 局部截图已复制到剪贴板');
            } catch (err) {
              console.warn('Clipboard write error:', err);
            }
          }
        };

        const doSubmit = async () => {
          const text = input.value.trim();
          const crop = await cropPageRegion(slot, normBox);
          if (!crop) {
            showToast('⚠️ 区域截取失败');
            return;
          }

          const rawPath = actualResolvedPath || filePath;
          const canonicalUri = toCanonicalUri(rawPath);
          const fName = rawPath.split(/[\\/]/).pop() || 'document.pdf';

          const ok = dispatchNativeComment({
            sourceUri: canonicalUri,
            fileName: fName,
            pageNum: pageNum,
            normBox: normBox,
            croppedBytes: crop.bytes,
            commentText: text || '对此区域进行提问'
          });

          if (ok) {
            showToast(`✓ 已添加批注至输入框 (Page ${pageNum})`);
          } else {
            showToast(`✓ 截图已生成 (未能直通Redux，已复制至剪贴板)`);
            try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': crop.blob })]); } catch(e) {}
          }

          rectBox.style.borderColor = 'rgba(59, 130, 246, 0.5)';
          rectBox.style.background = 'rgba(59, 130, 246, 0.08)';
          if (activeCommentPopup) {
            activeCommentPopup.remove();
            activeCommentPopup = null;
          }
          if (isCropActive) {
            isCropActive = false;
            btnCrop?.classList.remove('active');
            viewport.style.cursor = '';
          }
        };

        btnSubmit.onclick = (se) => {
          se.stopPropagation();
          doSubmit();
        };

        input.onkeydown = (ke) => {
          if ((ke.ctrlKey || ke.metaKey) && ke.key === 'Enter') {
            ke.preventDefault();
            doSubmit();
          } else if (ke.key === 'Escape') {
            clearSelection();
          }
        };
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    _currentPdfCleanup = () => {
      if (pdfDisposed) return;
      if (typeof clearSelection === 'function') clearSelection();
      if (typeof onTextSelectionUp === 'function') onTextSelectionUp();
      pdfDisposed = true;
      pdfObservers.forEach(observer => observer.disconnect());
      renderTasks.forEach(record => { record.cancelled=true; try { record.task?.cancel(); } catch (_) {} });
      renderQueue.clear();
      if (queueTimer !== null) clearTimeout(queueTimer);
      if (zoomFrame !== null) cancelAnimationFrame(zoomFrame);
      if (scrollThrottle) clearTimeout(scrollThrottle);
      cachedPages.forEach(({slot},number)=>releasePageSlot(number,slot));
      delete host.__agPdfPerformance;
      document.removeEventListener('click', closeMoreMenu);
      renderTasks.clear();
      if (searchDebounce) clearTimeout(searchDebounce);
      if (wheelCommitTimer) clearTimeout(wheelCommitTimer);
      if (toastTimer) clearTimeout(toastTimer);
      activeWheelAnchor = null;
      isWheelZooming = false;
      if (handlePdfKeyDown) window.removeEventListener('keydown', handlePdfKeyDown);
      hideReturnPill();
      doc.destroy().catch(() => {}).finally(() => doc.__agReleaseWorker?.());
    };
    // Return readiness so translation switches can preserve page position.
    return (async () => {
      try {
        const p1 = await doc.getPage(1);
        if (pdfDisposed || !host.isConnected) return;
        const rawVp = p1.getViewport({ scale: 1.0, rotation: 0 });
        rawPageWidth = rawVp.width;
        rawPageHeight = rawVp.height;

        // Auto fit width initially
        const availW = (viewport.clientWidth || 800) - 36;
        currentScale = Math.min(Math.max(availW / rawPageWidth, 0.5), 1.8);
        updateZoomSelect();

        // Create page slots
        pagesHost.innerHTML = '';
        pagesHost.style.setProperty('--pdf-slot-w', Math.round(rawPageWidth * currentScale) + 'px');
        pagesHost.style.setProperty('--pdf-slot-h', Math.round(rawPageHeight * currentScale) + 'px');
        pageDimensionsMap.set(1, { width: rawPageWidth, height: rawPageHeight });
        for (let i = 1; i <= doc.numPages; i++) {
          const slot = document.createElement('div');
          slot.className = 'ag-pdf-page-slot';
          slot.id = `ag-pdf-slot-${i}`;
          slot.dataset.page = String(i);
          pagesHost.appendChild(slot);
          pageSlots.push(slot);
        }

        // Fast non-blocking asynchronous pre-scan of all page dimensions (~10ms for 60 pages)
        (async () => {
          for (let i = 1; i <= doc.numPages; i++) {
            if (pdfDisposed) return;
            try {
              const p = await doc.getPage(i);
              const vp = p.getViewport({ scale: 1.0, rotation: 0 });
              pageDimensionsMap.set(i, { width: vp.width, height: vp.height });
              const s = pageSlots[i - 1];
              if (s && !s.dataset.rendered) {
                s.style.width = Math.round(vp.width * currentScale) + 'px';
                s.style.height = Math.round(vp.height * currentScale) + 'px';
              }
            } catch (_) {}
          }
        })();

        // Setup IntersectionObserver for virtualized rendering & memory culling
        const observer = new IntersectionObserver((entries) => {
          if (isWheelZooming) return;
          for (const entry of entries) {
            const pageNum = parseInt(entry.target.dataset.page, 10);
            if (entry.isIntersecting) {
              renderPageSlot(pageNum, entry.target);
            } else {
              cullPageSlot(pageNum, entry.target);
            }
          }
        }, {
          root: viewport,
          rootMargin: '400px 0px 400px 0px'
        });

        pagesHost.querySelectorAll('.ag-pdf-page-slot').forEach(s => observer.observe(s));
        pdfObservers.push(observer);

        // Immediately render first visible pages upfront to eliminate initial blank frame
        renderPageSlot(1, document.getElementById('ag-pdf-slot-1'));
        if (doc.numPages >= 2) {
          renderPageSlot(2, document.getElementById('ag-pdf-slot-2'));
        }

        // Load Outline
        try {
          const outline = await doc.getOutline();
          if (pdfDisposed || !host.isConnected) return;
          if (outline && outline.length > 0) {
            outlineView.innerHTML = '';
            await renderOutlineTree(outline, outlineView, doc);
          } else {
            outlineView.innerHTML = '<div style="padding:16px;color:#80868b;font-size:12px;text-align:center;">此文档无目录大纲</div>';
          }
        } catch (e) {
          outlineView.innerHTML = '<div style="padding:16px;color:#80868b;font-size:12px;text-align:center;">此文档无目录大纲</div>';
        }

        // Load Thumbnails
        if (pdfDisposed || !host.isConnected) return;
        initThumbnails(thumbsView, doc, doc.numPages, rawPageHeight / rawPageWidth);

        // Keyboard Shortcut for Navigation History (Alt + LeftArrow)
        handlePdfKeyDown = (e) => {
          if (!document.getElementById('antigravity-office-host')) {
            window.removeEventListener('keydown', handlePdfKeyDown);
            return;
          }
          if (e.altKey && e.key === 'ArrowLeft') {
            if (jumpHistory.length > 0) {
              e.preventDefault();
              popNavigationHistory();
            }
          }
        };
        window.addEventListener('keydown', handlePdfKeyDown);

      } catch (err) {
        console.error('[PdfViewer] Layout initialization error:', err);
      }
    })();
  }

  function findMainContentRoot() {
    const fileRegion = document.querySelector('[role="region"][aria-label="File Viewer"]');
    if (fileRegion) {
      const splitCandidates = fileRegion.querySelectorAll('div[style*="container-type"], div.relative.flex.w-full.h-full');
      for (const sc of splitCandidates) {
        if (sc.children.length >= 2) {
          return sc.children[0];
        }
      }

      const firstChild = fileRegion.firstElementChild;
      if (firstChild && firstChild.firstElementChild) {
        const sc = firstChild.firstElementChild;
        if (sc.children && sc.children.length >= 2) {
          return sc.children[0];
        }
      }

      const codeArea = fileRegion.querySelector('.code-line')?.closest('.relative.h-full.w-full') ||
                       fileRegion.querySelector('.relative.h-full.w-full');
      if (codeArea) return codeArea;

      return fileRegion;
    }

    return document.querySelector('.file-viewer-root') ||
           document.querySelector('.flex.flex-col.w-full.h-full.outline-none > .flex-1');
  }

  // --- Master Router Function ---
  async function checkAndRoute() {
    const filePath = getActiveFilePath();
    const ext = getFileExt(filePath);

    if (!filePath || !isOfficeOrData(ext)) {
      if (_lastMountedPath !== null) {
        unmountOfficeHost();
      }
      return;
    }

    const root = findMainContentRoot();
    if (!root) return;

    if (_lastMountedPath?.toLowerCase() === filePath.toLowerCase() && document.getElementById('antigravity-office-host')) {
      return; // Already cleanly mounted
    }

    console.log(`[OfficeRouter] Mounting ${ext.toUpperCase()} view for:`, filePath);
    _lastMountedPath = filePath;
    const host = createOrGetHost(root);
    if (ext !== 'pdf' && _currentPdfCleanup) {
      ++_pdfLoadGeneration;
      _currentPdfCleanup();
      _currentPdfCleanup = null;
    }

// PDF is always handled exclusively by our High-Performance Engine
    try { localStorage.removeItem('antigravity_pdf_engine_mode'); } catch(e) {}

    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || ext === 'tsv') {
      await renderSpreadsheet(host, filePath, ext);
    } else if (ext === 'docx') {
      await renderDocx(host, filePath);
    } else if (ext === 'pptx') {
      await renderPptx(host, filePath);
    } else if (ext === 'pdf') {
      await renderPdf(host, filePath);
    }
  }

  // Intercept history navigation
  let routeTimer = null;
  let routerDisposed = false;
  function scheduleRoute(delay=80) {
    if (routerDisposed || routeTimer!==null) return;
    routeTimer=setTimeout(()=>{routeTimer=null;if(!routerDisposed)checkAndRoute();},delay);
  }
  const origPush = history.pushState;
  const patchedPush = function() {
    origPush.apply(this, arguments);
    scheduleRoute(20);
  };
  history.pushState=patchedPush;
  const origReplace = history.replaceState;
  const patchedReplace = function() {
    origReplace.apply(this, arguments);
    scheduleRoute(20);
  };
  history.replaceState=patchedReplace;
  const onPopState=()=>scheduleRoute(20);
  window.addEventListener('popstate', onPopState);

  // MutationObserver for DOM changes
  const observer = new MutationObserver(records => {
    // Page canvases/text layers and the translation bar cannot change the
    // active file. Do not rescan React fibers for thousands of internal nodes.
    if (records.some(record=>!record.target.closest?.('#antigravity-office-host, #ag-pdf-engine-styles'))) scheduleRoute();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Fallback periodic poller (500ms)
  const pollTimer = setInterval(()=>scheduleRoute(), 1000);

  // Initial check
  checkAndRoute();

  window.__antigravityOfficeRouterCleanup = () => {
    routerDisposed=true;
    if (routeTimer!==null) clearTimeout(routeTimer);
    if (history.pushState===patchedPush) history.pushState=origPush;
    if (history.replaceState===patchedReplace) history.replaceState=origReplace;
    window.removeEventListener('popstate',onPopState);
    window.__agPdfTranslation?.dispose();
    observer.disconnect();
    clearInterval(pollTimer);
    unmountOfficeHost();
    const oldStyles = document.getElementById('ag-pdf-engine-styles');
    if (oldStyles) oldStyles.remove();
  };
})();
