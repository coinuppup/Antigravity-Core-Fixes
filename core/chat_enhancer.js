/**







 * Antigravity Chat UI Enhancer (Codex-Grade Hybrid Edition v8 - Production Master)







 * 







 * Modular System Architecture:







 * 1. File Pill & Code Reference Context Menu:







 *    - Native menu (Copy, Copy Path, Copy Relative Path, Reveal in File Explorer) on file pills & code paths.







 *    - Hover Tooltip automatic uppercase drive letter normalization (c:\ -> C:\).







 * 2. Codex Turn Navigator (Hybrid Global-Indexed Architecture):







 *    - Instant full-turn awareness from transcript/IPC; 20-turn compact viewport (260px) with damped scrolling.







 *    - Dual-color status (Blue active reading, Warm Amber hover jump); 5-layer ghost card defense.







 *    - Responsive dual-modal layout: permanent gutter in wide screen, auto-hidden dock in split screen.







 * 3. Auxiliary Pane Quick Collapse Button:







 *    - Direct collapse toggle in Overview pane header for rapid workspace reclaim.







 * 4. System Notification Click Focus & Jump:







 *    - Restores minimized window, forces foreground focus, and navigates to the active conversation.







 * 5. Workspace Tree Interactive Suite:







 *    - Ctrl/Shift multi-selection, drag-to-chat with silent cancel on invalid targets.







 *    - Native context menu (Copy, Copy Path, Copy Relative Path, Reveal in File Explorer) + Toast feedback.







 * 6. Dual-Surface Proceed Enhancer & Lifecycle State Machine:







 *    - Artifact tab header + chat inline card with strict lifecycle intent tracking.







 *    - Negative filter precedence & idempotency lock, completely preventing false positives after completion.







 * 7. Persistent Workspace Tree in Artifact View:







 *    - 100% pixel-perfect native style, zero truncation, unconstrained natural scrolling.







 *    - Kernel-level fs.watch real-time sync with scroll position & expansion memory.







 *    - Canonical File URI encoding & broken tab auto-healing.







 * 8. Academic Image Viewer Photoshop Zoom & Pan Engine:







 *    - Sub-pixel cursor-anchored zoom (20%-1000%) with zero spatial drift.







 *    - Space + Left drag / Middle click hand tool roam; floating HUD controller pill.







 */







(function() {







  'use strict';







  // [DragShield] Neutralized: native preventDefault is now required for OLE startDrag







  // [Singleton Drag Dispatcher] 全局单例拖拽事件总线，杜绝多次热重载导致的 DOM 监听器堆积







  if (!window.__antigravityDragStartDispatcherInstalled) {







    window.__antigravityDragStartDispatcherInstalled = true;







    document.addEventListener('dragstart', (e) => {







      try {







        if (typeof window.__antigravityTreeDragHandler === 'function') {







          window.__antigravityTreeDragHandler(e);







        }







      } catch (err) {







        console.warn('[DragDispatcher] Tree drag handler error:', err);







      }







      try {







        if (typeof window.__antigravityPillDragHandler === 'function') {







          window.__antigravityPillDragHandler(e);







        }







      } catch (err) {







        console.warn('[DragDispatcher] Pill drag handler error:', err);







      }







    }, true);







  }







  // Clean up any previous instance







  if (window.__antigravityChatEnhancerCleanup) {







    try { window.__antigravityChatEnhancerCleanup(); } catch(e) {}







  }







  window.__antigravityChatEnhancerInitialized = true;







  console.log('[ChatEnhancer v8 Master] Initializing Toolkit Core...');







  // =========================================================================







  // ToolkitCore: Unified Shared Foundation & Resilience Base







  // =========================================================================







  const ToolkitCore = {







    // 1. Unified Toast Notification







    showToast(msg) {







      try {







        let toast = document.getElementById('__antigravity_toolkit_toast');







        if (!toast) {







          toast = document.createElement('div');







          toast.id = '__antigravity_toolkit_toast';







          toast.style.cssText = `







            position: fixed;







            bottom: 24px;







            left: 50%;







            transform: translateX(-50%) translateY(10px);







            background: var(--popover, #1e293b);







            color: var(--popover-foreground, #f8fafc);







            padding: 6px 16px;







            border-radius: 20px;







            font-size: 12px;







            font-weight: 500;







            box-shadow: 0 4px 16px rgba(0,0,0,0.18);







            border: 1px solid var(--border, rgba(140,140,140,0.25));







            pointer-events: none;







            z-index: 99999;







            opacity: 0;







            transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);







            font-family: inherit;







          `;







          document.body.appendChild(toast);







        }







        toast.innerText = msg;







        toast.style.opacity = '1';







        toast.style.transform = 'translateX(-50%) translateY(0)';







        clearTimeout(toast.__timer);







        toast.__timer = setTimeout(() => {







          toast.style.opacity = '0';







          toast.style.transform = 'translateX(-50%) translateY(10px)';







        }, 1400);







      } catch (e) {}







    },







    // 2. Normalizes drive letter to uppercase (e.g. c:\ -> C:\)







    normalizeDriveLetter(pathStr) {







      if (!pathStr || typeof pathStr !== 'string') return pathStr;







      if (/^[a-z]:[\\\/]/i.test(pathStr)) {







        return pathStr.charAt(0).toUpperCase() + pathStr.slice(1);







      }







      return pathStr;







    },







    // 3. Resolve parent workspace directory from file or folder URI







    resolveWorkspaceRootUri(fileOrFolderUri) {







      if (!fileOrFolderUri) return '';







      let clean = fileOrFolderUri.split('?')[0].split('#')[0];







      clean = clean.replace(/\/+$/, '');







      if (clean.includes('/brain/')) return '';







      if (/\.[a-zA-Z0-9]+$/.test(clean)) {







        clean = clean.substring(0, clean.lastIndexOf('/'));







      }







      return clean;







    },







    // 4. Authoritative Workspace URI detection across React Fiber & LocalStorage







    __lastConvId: null,







    getActiveWorkspaceUri() {







      let convId = '';







      let sectionId = '';







      try {







        const url = new URL(window.location.href);







        convId = url.pathname.split('/c/')[1]?.split('?')[0] || '';







        sectionId = (url.searchParams.get('project') || url.searchParams.get('section')) || '';







      } catch(e) {}







      // If conversation switched in SPA, invalidate current in-memory workspace







      if (this.__lastConvId !== convId) {







        this.__lastConvId = convId;







        window.__antigravityCurrentWorkspaceUri = null;







      }







      if (window.__antigravityCurrentWorkspaceUri) {







        return window.__antigravityCurrentWorkspaceUri;







      }







      // 1. If in a Project (sectionId is a project ID), check project-specific session cache







      if (sectionId && sectionId !== 'outside-of-project') {







        const projCached = window.sessionStorage?.getItem('__antigravity_proj_ws_' + sectionId) || window.__antigravityProjectFolderCache?.[sectionId];







        if (projCached) {







          window.__antigravityCurrentWorkspaceUri = projCached;







          return projCached;







        }







      }







      // 2. If in an independent conversation, check conversation-specific session cache







      if (convId) {







        const convCached = window.sessionStorage?.getItem('__antigravity_conv_ws_' + convId);







        if (convCached && !convCached.includes('/brain/')) {







          window.__antigravityCurrentWorkspaceUri = convCached;







          return convCached;







        }







      }







      // 3. Check open file tabs: if a tab has a physical file outside /brain/, use its parent directory







      const openTabs = Array.from(document.querySelectorAll('[data-tab-id]'));







      for (const t of openTabs) {







        const tid = t.getAttribute('data-tab-id') || '';







        if (tid.includes('file://') && !tid.includes('/brain/')) {







          const rawUri = tid.replace(/^file__/, '');







          const ws = this.resolveWorkspaceRootUri(rawUri);







          if (ws) {







            window.__antigravityCurrentWorkspaceUri = ws;







            if (convId) window.sessionStorage?.setItem('__antigravity_conv_ws_' + convId, ws);







            return ws;







          }







        }







      }







      const nativeSidebar = document.querySelector('[data-testid="tab-file-tree-sidebar"]');







      if (nativeSidebar) {







        try {







          const key = Object.keys(nativeSidebar).find(k => k.startsWith('__reactFiber$'));







          if (key) {







            let curr = nativeSidebar[key];







            while (curr) {







              const r = curr.memoizedProps?.rootUris || curr.memoizedProps?.workspaceUris;







              if (Array.isArray(r) && r.length > 0 && r[0]) {







                const ws = this.resolveWorkspaceRootUri(r[0]);







                if (ws && !ws.includes('/brain/')) {







                  window.__antigravityCurrentWorkspaceUri = ws;







                  if (sectionId && sectionId !== 'outside-of-project') {







                    window.sessionStorage?.setItem('__antigravity_proj_ws_' + sectionId, ws);







                  } else if (convId) {







                    window.sessionStorage?.setItem('__antigravity_conv_ws_' + convId, ws);







                  }







                  return ws;







                }







              }







              curr = curr.return;







            }







          }







        } catch (e) {}







      }







      const fiberCandidates = [







        document.querySelector('[data-lexical-editor="true"]'),







        document.querySelector('.chat-input-container'),







        document.querySelector('[data-testid="chat-pane"]'),







        document.querySelector('#root')







      ].filter(Boolean);







      for (const el of fiberCandidates) {







        try {







          const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));







          if (key) {







            let curr = el[key];







            let depth = 0;







            while (curr && depth < 60) {







              const u = curr.memoizedProps?.workspaceInfo?.workspaceUris || 







                        curr.memoizedProps?.value?.workspaceInfo?.workspaceUris ||







                        curr.memoizedProps?.workspaceUris ||







                        curr.memoizedProps?.rootUris;







              if (Array.isArray(u) && u.length > 0 && u[0]) {







                const ws = this.resolveWorkspaceRootUri(u[0]);







                if (ws) {







                  window.__antigravityCurrentWorkspaceUri = ws;







                  try { window.localStorage.setItem('__antigravity_last_workspace_uri', ws); } catch(e) {}







                  return ws;







                }







              }







              curr = curr.return;







              depth++;







            }







          }







        } catch(e) {}







      }







      const tabElements = document.querySelectorAll('[data-tab-id], [role="tab"]');







      for (const tab of tabElements) {







        const rawTabId = tab.getAttribute('data-tab-id') || '';







        if (rawTabId.startsWith('file__file:///') && !rawTabId.includes('/brain/')) {







          const ws = this.resolveWorkspaceRootUri(rawTabId.replace(/^file__/, ''));







          if (ws) {







            window.__antigravityCurrentWorkspaceUri = ws;







            try { window.localStorage.setItem('__antigravity_last_workspace_uri', ws); } catch(e) {}







            return ws;







          }







        }







      }







      // Fallback: check last workspace URI

      const lastWs = window.localStorage?.getItem('__antigravity_last_workspace_uri');

      if (lastWs && !lastWs.includes('/brain/')) {

        return lastWs;

      }

      return '';







    },







    // 5. Converts file:// URI or raw path to clean Windows path (with drive recovery & uppercase)







    uriToWindowsPath(uri) {
      const __agPlatform = ((navigator && navigator.platform) || '') + ' ' + ((navigator && navigator.userAgent) || '');
      const __agIsMacOS = /Mac/i.test(__agPlatform);
      if (__agIsMacOS) {
        if (!uri) return '';
        let cleanUri = String(uri).split('#')[0].split('?')[0];
        if (/^file:\/\/\/?/i.test(cleanUri)) {
          cleanUri = cleanUri.replace(/^file:\/\/\//i, '/').replace(/^file:\/\//i, '');
        }
        try { cleanUri = decodeURIComponent(cleanUri); } catch (e) {}
        return cleanUri.replace(/\\/g, '/').replace(/\/+/g, '/');
      }


      if (!uri) return '';







      let cleanUri = uri.split('#')[0].split('?')[0];







      let p = decodeURIComponent(cleanUri.replace(/^file:\/\/\//i, '').replace(/^file:\/\//i, ''));







      p = p.replace(/\//g, '\\');







      if (/^[a-zA-Z]:/.test(p)) {







        p = p.charAt(0).toUpperCase() + p.slice(1);







      } else if (p.startsWith('\\')) {







        const ws = this.getActiveWorkspaceUri();







        const match = ws && ws.match(/file:\/\/\/([a-zA-Z])(%3A|:)/i);







        if (match) {







          p = match[1].toUpperCase() + ':' + p;







        }







      }







      return p;







    },







    // 6. Gets current active workspace root in Windows path format







    getActiveWorkspaceRoot() {







      const curUri = this.getActiveWorkspaceUri();







      return curUri ? this.uriToWindowsPath(curUri) : '';







    },







    // 7. Converts Windows path to Canonical File URI (%3A formatted)







    pathToCanonicalFileUri(winPath) {







      if (!winPath) return '';







      let clean = String(winPath).trim();
      const __agPlatform = ((navigator && navigator.platform) || '') + ' ' + ((navigator && navigator.userAgent) || '');
      if (/Mac/i.test(__agPlatform)) {
        clean = clean.replace(/^file:\/\/\/?/i, '');
        clean = clean.replace(/\\/g, '/').replace(/\/(?!\/)/g, '/');
        if (!clean.startsWith('/')) clean = '/' + clean;
        try {
          return 'file://' + clean.split('/').map(seg => {
            if (!seg) return '';
            try { return encodeURIComponent(decodeURIComponent(seg)); } catch (e) { return encodeURIComponent(seg); }
          }).join('/');
        } catch (e) {
          return 'file://' + encodeURI(clean);
        }
      }







      clean = clean.replace(/^file:\/\//i, '').replace(/^\/+/, '');







      clean = clean.replace(/\\+/g, '/').replace(/\/+/g, '/');







      const driveMatch = clean.match(/^([a-zA-Z])(?::|%3A)\/(.*)$/i);







      if (driveMatch) {







        const drive = driveMatch[1].toLowerCase();







        const rest = driveMatch[2];







        const encodedSegments = rest.split('/').filter(Boolean).map(seg => {







          try {







            return encodeURIComponent(decodeURIComponent(seg));







          } catch(e) {







            return encodeURIComponent(seg);







          }







        });







        return 'file:///' + drive + '%3A/' + encodedSegments.join('/');







      }







      const encoded = clean.split('/').filter(Boolean).map(seg => {







        try {







          return encodeURIComponent(decodeURIComponent(seg));







        } catch(e) {







          return encodeURIComponent(seg);







        }







      }).join('/');







      return 'file:///' + encoded;







    },







    // 8. Unified reveal in Windows Explorer (shell.showItemInFolder + fallback)







    async revealInExplorer(winPath, rawUri) {

      try {

        const target = winPath || rawUri;

        if (!target) return false;



        let pathToReveal = target;

        if (typeof window.__smartResolveFilePathClient === 'function') {

          try {

            const res = await window.__smartResolveFilePathClient(target);

            if (res && res.path) pathToReveal = res.path;

          } catch(e) {}

        }



        if (window.antigravityFS && typeof window.antigravityFS.revealInExplorer === 'function') {

          const ok = await window.antigravityFS.revealInExplorer(pathToReveal);

          if (ok) return true;

        }



        let fileUri = rawUri;

        if (!fileUri || !fileUri.startsWith('file://')) {

          fileUri = this.pathToCanonicalFileUri(pathToReveal);

        }



        if (window.electronNative && typeof window.electronNative.revealInFilePicker === 'function') {

          await window.electronNative.revealInFilePicker(fileUri);

          return true;

        }

      } catch (err) {

        console.warn('[ToolkitCore] revealInExplorer error:', err);

      }

      return false;

    },







    // 9. Ensures element title displays normalized uppercase drive letter







    ensureUppercaseTitle(el) {







      if (!el) return;







      let title = el.getAttribute('title');







      if (title) {







        const norm = this.normalizeDriveLetter(title);







        if (norm !== title) {







          el.setAttribute('title', norm);







        }







      } else {







        const rawUri = el.getAttribute('data-uri') || el.getAttribute('data-file-path');







        if (rawUri) {







          const winPath = this.uriToWindowsPath(rawUri);







          if (winPath) {







            el.setAttribute('title', winPath);







          }







        }







      }







    },







    // 10. React Fiber File Opener Resolver



    getOpenFileFn() {



      const el = document.querySelector('[data-lexical-editor="true"]') || 



                 document.querySelector('.chat-input-container') ||



                 document.querySelector('[data-testid="chat-pane"]');



      if (!el) return null;



      try {



        const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));



        if (!key) return null;



        let curr = el[key];



        while (curr) {



          if (curr.memoizedProps?.stepHandler?.openFile) {



            return curr.memoizedProps.stepHandler.openFile;



          }



          curr = curr.return;



        }



      } catch(e) {}



      return null;



    }







  };







  window.__antigravityToolkitCore = ToolkitCore;







  // =========================================================================







  // Feature 1: File Pill & Code Reference Context Menu (Copy, Copy Path, Reveal in Explorer)







  // =========================================================================







  function initPillContextMenu() {







    function findPillOrFileTarget(target) {







      if (!target) return null;







      // 1. Direct pill container (button/span with inline-pill, data-uri, data-file-path, etc.)







      const pill = target.closest('button.inline-pill, span.inline-pill, [data-uri], [data-file-path], .context-scope-mention, [data-quotable-inline="true"], [data-testid="entity-pill"]');







      if (pill) return pill;







      // 2. Inline code block or anchor containing a file path or extension







      const code = target.closest('code, a[href^="file:"]');







      if (code) {







        const text = (code.innerText || code.getAttribute('href') || '').trim();







        if (/\.(?:py|js|ts|tsx|jsx|json|md|html|css|cpp|c|h|hpp|rs|go|sh|bat|ps1|yaml|yml|toml|docx|xlsx|pptx|png|jpg|jpeg|gif|svg|pdf)\b/i.test(text) ||







            /^[a-zA-Z]:[\\\/]/.test(text) || text.startsWith('file:')) {







          return code;







        }







      }







      return null;







    }







    function resolvePillWinPath(target) {







      if (!target) return null;







      let rawUri = target.getAttribute('data-uri') || 







                   target.getAttribute('data-file-path') || 







                   target.getAttribute('href') || '';







      let titleAttr = target.getAttribute('title') || '';







      let winPath = '';







      if (rawUri) {







        winPath = ToolkitCore.uriToWindowsPath(rawUri);







      }







      if (!winPath && titleAttr) {







        if (/^[a-zA-Z]:[\\\/]/.test(titleAttr) || titleAttr.startsWith('\\\\') || titleAttr.startsWith('/') || titleAttr.startsWith('file:')) {







          winPath = ToolkitCore.uriToWindowsPath(titleAttr);







        }







      }







      let copyText = '';







      const codeEl = target.querySelector('code') || target.querySelector('.select-text');







      copyText = (codeEl ? codeEl.innerText : target.innerText || '').trim();







      if (copyText.includes('\n')) {







        copyText = copyText.split('\n')[0].trim();







      }







      if (!winPath && /^[a-zA-Z]:[\\\/]/.test(copyText)) {







        winPath = copyText;







      }







      const wsRoot = ToolkitCore.getActiveWorkspaceRoot();







      if (!winPath && wsRoot && copyText) {







        const candidate = wsRoot.replace(/[\\\/]+$/, '') + '\\' + copyText.replace(/\//g, '\\');







        winPath = candidate;







      }







      return winPath || null;







    }







    const handleContextMenu = async (e) => {







      try {







        const target = findPillOrFileTarget(e.target);







        if (!target) return;







        // If the user right-clicked on an item that is inside a treeitem in workspace, let workspace handler process it







        if (target.closest('[role="treeitem"]')) return;







        let rawUri = target.getAttribute('data-uri') || 







                     target.getAttribute('data-file-path') || 







                     target.getAttribute('href') || '';







        let titleAttr = target.getAttribute('title') || '';







        let winPath = '';







        if (rawUri) {







          winPath = ToolkitCore.uriToWindowsPath(rawUri);







        }







        if (!winPath && titleAttr) {







          if (/^[a-zA-Z]:[\\\/]/.test(titleAttr) || titleAttr.startsWith('\\\\') || titleAttr.startsWith('/') || titleAttr.startsWith('file:')) {







            winPath = ToolkitCore.uriToWindowsPath(titleAttr);







          }







        }







        let copyText = '';







        const userSel = window.getSelection()?.toString()?.trim();







        if (userSel && target.contains(window.getSelection()?.anchorNode)) {







          copyText = userSel;







        } else {







          const codeEl = target.querySelector('code') || target.querySelector('.select-text');







          copyText = (codeEl ? codeEl.innerText : target.innerText || '').trim();







        }







        if (copyText.includes('\n')) {







          copyText = copyText.split('\n')[0].trim();







        }







        if (!winPath && /^[a-zA-Z]:[\\\/]/.test(copyText)) {







          winPath = copyText;







        }







        const wsRoot = ToolkitCore.getActiveWorkspaceRoot();







        let relPath = '';







        if (winPath && wsRoot) {







          const lowerWin = winPath.toLowerCase();







          const lowerWs = wsRoot.toLowerCase();







          if (lowerWin.startsWith(lowerWs)) {







            relPath = winPath.slice(wsRoot.length).replace(/^[\\\/]+/, '');







          }







        }







        if (!relPath && winPath) {







          const parts = winPath.split('\\');







          relPath = parts.slice(-2).join('\\');







        }







        if (!copyText && !winPath) return;







        e.preventDefault();







        e.stopPropagation();







        const menuItems = [];







        if (winPath) {







          menuItems.push({







            id: 'copy-file',







            label: '复制文件 (Copy File)'







          });







          menuItems.push({







            id: 'copy-path',







            label: '复制完整路径 (Copy Path)'







          });







          if (relPath && relPath !== winPath && relPath !== copyText) {







            menuItems.push({







              id: 'copy-relative-path',







              label: '复制相对路径 (Copy Relative Path)'







            });







          }







          menuItems.push({







            id: 'reveal-in-explorer',







            label: '在文件夹中显示 (Reveal in Explorer)'







          });







        } else {







          menuItems.push({







            id: 'copy',







            label: 'Copy'







          });







        }







        if (window.electronNative && typeof window.electronNative.showContextMenu === 'function') {







          const selectedId = await window.electronNative.showContextMenu(menuItems);







          let textToCopy = null;







          let toastLabel = '';







          if (selectedId === 'copy-file') {







            if (window.antigravityFS && typeof window.antigravityFS.copyFilesToClipboard === 'function') {







              await window.antigravityFS.copyFilesToClipboard([winPath]);







            } else if (navigator.clipboard && navigator.clipboard.writeText) {







              await navigator.clipboard.writeText(winPath).catch(() => {});







            }







            const fileName = winPath.split('\\').pop();







            ToolkitCore.showToast(`✓ 已复制文件: ${fileName} (可直接粘贴文件)`);







            return;







          } else if (selectedId === 'copy') {







            textToCopy = copyText || winPath;







            toastLabel = `✓ 已复制: ${textToCopy}`;







          } else if (selectedId === 'copy-path') {







            textToCopy = winPath || copyText;







            toastLabel = `✓ 已复制路径: ${textToCopy}`;







          } else if (selectedId === 'copy-relative-path') {







            textToCopy = relPath || winPath || copyText;







            toastLabel = `✓ 已复制相对路径: ${textToCopy}`;







          } else if (selectedId === 'reveal-in-explorer') {







            await ToolkitCore.revealInExplorer(winPath, rawUri);







            const fileName = copyText || (winPath ? winPath.split('\\').pop() : '文件');







            ToolkitCore.showToast(`✓ 已在文件资源管理器中定位: ${fileName}`);







            return;







          }







          if (textToCopy && navigator.clipboard && navigator.clipboard.writeText) {







            await navigator.clipboard.writeText(textToCopy);







            ToolkitCore.showToast(toastLabel);







          }







        } else {







          // Fallback if electronNative is unavailable







          if (navigator.clipboard && navigator.clipboard.writeText) {







            await navigator.clipboard.writeText(copyText || winPath);







            ToolkitCore.showToast(`✓ 已复制: ${copyText || winPath}`);







          }







        }







      } catch (err) {







        console.warn('[ChatEnhancer] Pill context menu error:', err);







      }







    };







    // Global delegated mouseover listener: ensures hovering pills immediately shows capitalized C:\ and enables drag







    const handleMouseOver = (e) => {







      const pill = findPillOrFileTarget(e.target);







      if (pill) {







        ToolkitCore.ensureUppercaseTitle(pill);







        if (pill.getAttribute('draggable') !== 'true') {







          pill.setAttribute('draggable', 'true');







        }







        pill.style.cursor = 'grab';







      } else {







        const titled = e.target.closest('[title]');







        if (titled) ToolkitCore.ensureUppercaseTitle(titled);







      }







    };







    // Global dragstart on chat pill: triggers native OS drag out to external browser (AI Studio) or desktop







    const handleDragStart = (e) => {



      const target = findPillOrFileTarget(e.target);



      if (!target || target.closest('[role="treeitem"]')) return;







      const winPath = resolvePillWinPath(target);



      if (!winPath) return;







      const rawUri = target.getAttribute('data-uri') || (winPath ? 'file:///' + winPath.replace(/\\/g, '/') : '');



      if (rawUri) {



        window.__antigravityDraggedUris = [rawUri];



      }







      if (e.dataTransfer) {



        e.dataTransfer.effectAllowed = 'copy';



        e.dataTransfer.setData('application/context-scope-item-cider', JSON.stringify({ file: { absoluteUri: rawUri } }));



        e.dataTransfer.setData('ResourceURLs', JSON.stringify([rawUri]));



        e.dataTransfer.setData('text/plain', rawUri);



      }



    };







    window.__antigravityPillDragHandler = handleDragStart;







    document.addEventListener('mouseover', handleMouseOver, true);



    document.addEventListener('mousedown', handleMouseOver, true);







    document.addEventListener('contextmenu', handleContextMenu, true);







    return () => {







      window.__antigravityPillDragHandler = null;







      document.removeEventListener('mouseover', handleMouseOver, true);



      document.removeEventListener('mousedown', handleMouseOver, true);







      document.removeEventListener('contextmenu', handleContextMenu, true);







    };







  }







  // =========================================================================







  // Feature 2: Codex Turn Navigator (Hybrid Architecture)







  // =========================================================================







  function initCodexTurnNavigator() {

    if (window.__antigravityEnhancerProfile?.turnNavigator === false) return () => {};

    // 官方 v2.28+ 已内置时间线轮次导航栏，全面抑制套件自研 Codex 导航栏以避让官方原生

    const existingNav = document.getElementById('__antigravity_codex_turn_nav');

    if (existingNav) existingNav.remove();

    const existingStyle = document.getElementById('__antigravity_codex_turn_nav_style');

    if (existingStyle) existingStyle.remove();

    return () => {

      const nav = document.getElementById('__antigravity_codex_turn_nav');

      if (nav) nav.remove();

      const style = document.getElementById('__antigravity_codex_turn_nav_style');

      if (style) style.remove();

    };



    const NAV_ID = '__antigravity_codex_turn_nav';







    const STYLE_ID = '__antigravity_codex_turn_nav_style';







    const ITEM_PITCH = 12.5; // 9.5px item + 3px gap







    const NAV_MAX_HEIGHT = 260; // 20 items * 12.5px = 250px + 10px padding







    function ensureStyle() {







      let styleEl = document.getElementById(STYLE_ID);







      if (!styleEl) {







        styleEl = document.createElement('style');







        styleEl.id = STYLE_ID;







        styleEl.textContent = `







          #${NAV_ID} {







            position: absolute;







            left: 8px;







            top: 50%;







            transform: translateY(-50%);







            z-index: 45;







            display: flex;







            flex-direction: column;







            align-items: flex-start;







            gap: 3px;







            padding: 5px 3px;







            background: transparent;







            border-radius: 6px;







            transition: background 0.15s ease, opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;







            user-select: none;







            pointer-events: auto;







            max-height: ${NAV_MAX_HEIGHT}px;







            overflow-y: auto;







            overscroll-behavior: contain;







            scrollbar-width: none;







          }







          #${NAV_ID}::-webkit-scrollbar {







            display: none;







          }







          #${NAV_ID}:hover {







            background: rgba(128, 128, 128, 0.08);







          }







          /* --- Mode 2: Narrow Mode (面板狭窄拥挤态：常态零遮挡隐藏，边缘感知呼出) --- */







          #${NAV_ID}.is-narrow-mode {







            left: 0 !important;







            padding: 8px 10px 8px 4px !important;







            border-radius: 0 8px 8px 0 !important;







            opacity: 0 !important;







            pointer-events: none !important;







            transform: translateY(-50%) translateX(-6px) !important;







            background: transparent !important;







            border: none !important;







            box-shadow: none !important;







          }







          /* 窄屏呼出态微型 Dock：严格对齐官方原生卡片质感 (白底/深色底自适应) */







          #${NAV_ID}.is-narrow-mode.is-hovered,







          #${NAV_ID}.is-narrow-mode:hover {







            opacity: 1 !important;







            pointer-events: auto !important;







            transform: translateY(-50%) translateX(0) !important;







            background: var(--card, #ffffff) !important;







            backdrop-filter: blur(16px) !important;







            -webkit-backdrop-filter: blur(16px) !important;







            border: 1px solid var(--border, rgba(0, 0, 0, 0.08)) !important;







            border-left: none !important;







            box-shadow: 2px 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important;







          }







          #${NAV_ID}.is-narrow-mode .${NAV_ID}_item {







            width: 24px !important;







          }







          .${NAV_ID}_item {







            display: flex;







            align-items: center;







            justify-content: flex-start;







            width: 32px;







            height: 9.5px;







            flex-shrink: 0 !important;







            cursor: pointer;







            padding: 0;







            background: transparent;







            box-sizing: border-box;







          }







          .${NAV_ID}_tick {







            width: 9.5px;







            height: 1.5px;







            border-radius: 1px;







            background-color: var(--muted-foreground, #94a3b8);







            opacity: 0.35;







            transition: width 0.15s ease, height 0.15s ease, background-color 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;







            pointer-events: none;







          }







          /* Active Reading Turn */







          .${NAV_ID}_item.active .${NAV_ID}_tick {







            width: 20px;







            height: 2.5px;







            opacity: 1;







            background-color: #3b82f6 !important;







            box-shadow: 0 0 6px rgba(59, 130, 246, 0.45);







          }







          /* Hover Jump Candidate */







          .${NAV_ID}_item:hover:not(.active) .${NAV_ID}_tick {







            width: 17px;







            height: 2.2px;







            opacity: 1;







            background-color: #f59e0b !important;







            box-shadow: 0 0 5px rgba(245, 158, 11, 0.5);







          }







          /* Hovering the Active Turn */







          .${NAV_ID}_item.active:hover .${NAV_ID}_tick {







            width: 22px;







            height: 2.5px;







            background-color: #3b82f6 !important;







            box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);







          }







          .${NAV_ID}_card {







            position: fixed;







            pointer-events: none !important;







            z-index: 1000;







            width: 320px;







            max-width: calc(100vw - 60px);







            padding: 11px 13px;







            border-radius: 10px;







            background: var(--popover, #ffffff);







            color: var(--popover-foreground, #1e293b);







            border: 1px solid var(--border, rgba(140, 140, 140, 0.22));







            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);







            opacity: 0;







            transform: translateX(-6px) scale(0.98);







            transition: opacity 0.12s ease, transform 0.12s ease;







            display: flex;







            flex-direction: column;







            gap: 5px;







            font-family: inherit;







          }







          .${NAV_ID}_card.show {







            opacity: 1;







            transform: translateX(0) scale(1);







          }







          .${NAV_ID}_card_header {







            display: flex;







            align-items: baseline;







            justify-content: space-between;







            font-size: 11px;







            font-weight: 600;







            letter-spacing: 0.02em;







          }







          .${NAV_ID}_card_header.is-active {







            color: #3b82f6;







          }







          .${NAV_ID}_card_header.is-hover {







            color: #d97706;







          }







          .${NAV_ID}_card_prompt {







            font-size: 12px;







            font-weight: 600;







            line-height: 1.4;







            color: var(--foreground, #0f172a);







            display: -webkit-box;







            -webkit-line-clamp: 3;







            -webkit-box-orient: vertical;







            overflow: hidden;







            word-break: break-word;







          }







          .${NAV_ID}_card_response {







            font-size: 11px;







            line-height: 1.45;







            color: var(--muted-foreground, #64748b);







            display: -webkit-box;







            -webkit-line-clamp: 2;







            -webkit-box-orient: vertical;







            overflow: hidden;







            word-break: break-word;







          }







        `;







        const target = document.head || document.documentElement || document.body;







        if (target) target.appendChild(styleEl);







      }







      return styleEl;







    }







    function getCardEl() {







      let cardEl = document.getElementById(NAV_ID + '_card');







      if (!cardEl) {







        const parent = document.body || document.documentElement;







        if (!parent) return null;







        cardEl = document.createElement('div');







        cardEl.id = NAV_ID + '_card';







        cardEl.className = NAV_ID + '_card';







        parent.appendChild(cardEl);







      }







      return cardEl;







    }







    let cardDismissTimer = null;







    function hideCard() {







      clearTimeout(cardDismissTimer);







      const cardEl = document.getElementById(NAV_ID + '_card');







      if (cardEl && cardEl.classList.contains('show')) {







        cardEl.classList.remove('show');







      }







    }







    let activeTurnIdx = 0;







    let mutationObs = null;







    let scrollListener = null;







    let resizeObs = null;







    let lastScrollTime = 0;







    let scrollThrottleTimer = null;







    let currentConversationId = '';







    let globalTurnsCache = [];







    let isFetchingTurns = false;







    // Helper: Extract conversation ID from URL or page







    function getConversationId() {







      const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9_\-]+)/);







      if (match) return match[1];







      const param = new URLSearchParams(window.location.search).get('conversationId');







      if (param) return param;







      return '';







    }







    // Helper: Fetch all turns from session transcript via antigravityFS







    async function fetchAllSessionTurns(convId) {







      if (!convId) return [];







      if (typeof window.antigravityFS === 'undefined') return [];







      try {







        // Preferred: IPC dedicated handler if available







        if (typeof window.antigravityFS.getConversationTurns === 'function') {







          const res = await window.antigravityFS.getConversationTurns(convId);







          if (Array.isArray(res) && res.length > 0) return res;







        }







        // Direct reading of transcript.jsonl via existing readFileBytes







        if (typeof window.antigravityFS.readFileBytes === 'function') {







          const userHome = 'C:/Users/HIT'; // fallback standard base







          const transcriptPath = `${userHome}/.gemini/antigravity/brain/${convId}/.system_generated/logs/transcript.jsonl`;







          const bytes = await window.antigravityFS.readFileBytes(transcriptPath);







          if (bytes && bytes.length > 0) {







            const text = new TextDecoder('utf-8').decode(bytes);







            const lines = text.split('\n');







            const turns = [];







            let turnNumber = 1;







            for (const line of lines) {







              if (!line.trim()) continue;







              try {







                const step = JSON.parse(line);







                if (step.type === 'USER_INPUT') {







                  let prompt = (step.content || '').trim();







                  if (prompt.includes('<USER_REQUEST>')) {







                    prompt = prompt.split('<USER_REQUEST>')[1].split('</USER_REQUEST>')[0].trim();







                  }







                  if (prompt.startsWith('<CONTEXT_SUMMARY>') && prompt.includes('</CONTEXT_SUMMARY>')) {







                    prompt = prompt.split('</CONTEXT_SUMMARY>')[1].trim();







                  }







                  const firstLine = prompt.split('\n')[0].trim();







                  turns.push({







                    turnIndex: turnNumber++,







                    stepIndex: step.step_index,







                    createdAt: step.created_at,







                    prompt: prompt.substring(0, 300),







                    title: (firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine) || '（用户输入）'







                  });







                }







              } catch (e) {}







            }







            if (turns.length > 0) return turns;







          }







        }







      } catch (err) {







        console.warn('[ChatEnhancer] Failed to fetch full session turns:', err);







      }







      return [];







    }







    let currentAttachedPanel = null;







    let panelMouseMoveHandler = null;







    let panelMouseLeaveHandler = null;







    function updateNavDisplayMode(chatPanel, nav) {







      if (!chatPanel || !nav) return;







      const pRect = chatPanel.getBoundingClientRect();







      const article = chatPanel.querySelector('[role="article"]');







      const aRect = article ? article.getBoundingClientRect() : null;







      const gutter = aRect ? (aRect.left - pRect.left) : 0;







      // 1. Extreme narrow: hide completely if unusable (< 320px)







      if (pRect.width < 320) {







        nav.style.display = 'none';







        return;







      }







      nav.style.display = 'flex';







      // 2. Dual-mode judgment: Narrow Mode if panel width < 780px OR gutter < 45px







      const isNarrow = pRect.width < 780 || gutter < 45;







      if (isNarrow) {







        nav.classList.add('is-narrow-mode');







      } else {







        nav.classList.remove('is-narrow-mode', 'is-hovered');







      }







    }







    function attachPanelHoverListeners(chatPanel, nav) {







      if (currentAttachedPanel === chatPanel) return;







      if (currentAttachedPanel && panelMouseMoveHandler) {







        currentAttachedPanel.removeEventListener('mousemove', panelMouseMoveHandler);







        currentAttachedPanel.removeEventListener('mouseleave', panelMouseLeaveHandler);







      }







      currentAttachedPanel = chatPanel;







      if (!chatPanel) return;







      panelMouseMoveHandler = (e) => {







        if (!nav || !nav.classList.contains('is-narrow-mode')) return;







        const pRect = chatPanel.getBoundingClientRect();







        const distFromLeft = e.clientX - pRect.left;







        // Enter hotspot: <= 28px







        if (distFromLeft <= 28) {







          nav.classList.add('is-hovered');







        } else if (distFromLeft > 48) {







          // Exit hotspot: > 48px (with hysteresis, and keep visible if preview card is open)







          const cardEl = document.getElementById(NAV_ID + '_card');







          const isCardShowing = cardEl && cardEl.classList.contains('show');







          if (!isCardShowing) {







            nav.classList.remove('is-hovered');







          }







        }







      };







      panelMouseLeaveHandler = () => {







        if (!nav || !nav.classList.contains('is-narrow-mode')) return;







        const cardEl = document.getElementById(NAV_ID + '_card');







        const isCardShowing = cardEl && cardEl.classList.contains('show');







        if (!isCardShowing) {







          nav.classList.remove('is-hovered');







        }







      };







      chatPanel.addEventListener('mousemove', panelMouseMoveHandler, { passive: true });







      chatPanel.addEventListener('mouseleave', panelMouseLeaveHandler, { passive: true });







    }







    function keepActiveInNavView(nav, index) {







      if (!nav) return;







      const targetScrollTop = (index * ITEM_PITCH) - (NAV_MAX_HEIGHT / 2) + (ITEM_PITCH / 2);







      nav.scrollTop = Math.max(0, targetScrollTop);







    }







    async function renderNav() {







      ensureStyle();







      hideCard();







      const convId = getConversationId();







      if (convId !== currentConversationId) {







        currentConversationId = convId;







        globalTurnsCache = [];







        activeTurnIdx = 0;







      }







      // Bulletproof resolution of chatPanel and scrollContainer







      let scrollContainer = null;







      let chatPanel = null;







      // 1. First attempt: check for user message sticky bleeds or turn containers







      const bleeds = Array.from(document.querySelectorAll('.md-sticky-message-bleed, div[class*="scroll-mt-4"]'));







      if (bleeds.length > 0) {







        scrollContainer = bleeds[0].closest('.overflow-y-auto');







        if (scrollContainer) {







          chatPanel = scrollContainer.parentElement;







        }







      }







      // 2. Second attempt: if bleeds are scrolled off-screen, trace upwards from chatEditor







      const chatEditor = document.querySelector('[data-lexical-editor="true"]');







      if ((!scrollContainer || !chatPanel) && chatEditor) {







        let curr = chatEditor.parentElement;







        while (curr && curr !== document.body) {







          const candidates = Array.from(curr.querySelectorAll('.overflow-y-auto'));







          // Find the scroll container that does NOT contain the chat editor itself







          const msgScroll = candidates.find(c => !c.contains(chatEditor));







          if (msgScroll) {







            scrollContainer = msgScroll;







            chatPanel = msgScroll.parentElement || curr;







            break;







          }







          curr = curr.parentElement;







        }







      }







      // 3. Fallback: check for any markdown or message container







      if (!scrollContainer || !chatPanel) {







        const anyMsg = document.querySelector('[data-message-author-role], .markdown-body, div[class*="scroll-mt-4"]');







        if (anyMsg) {







          scrollContainer = anyMsg.closest('.overflow-y-auto');







          if (scrollContainer) chatPanel = scrollContainer.parentElement;







        }







      }







      // If we are definitely not in a chat panel (e.g. standalone document view or image), hide immediately!







      if (!chatPanel || !scrollContainer) {







        const navExisting = document.getElementById(NAV_ID);







        if (navExisting) navExisting.style.display = 'none';







        hideCard();







        return;







      }







      // Defense in depth: Ensure chatPanel is NEVER an input bar / form







      if (chatPanel.closest('[data-lexical-editor="true"], .chat-input-container, form')) {







        let p = chatPanel.parentElement;







        while (p && p.closest('[data-lexical-editor="true"], .chat-input-container, form')) {







          p = p.parentElement;







        }







        if (p) chatPanel = p;







      }







      if (window.getComputedStyle(chatPanel).position === 'static') {







        chatPanel.style.position = 'relative';







      }







      let nav = document.getElementById(NAV_ID);







      if (!nav) {







        nav = document.createElement('div');







        nav.id = NAV_ID;







        chatPanel.appendChild(nav);







        nav.addEventListener('wheel', (e) => {







          e.stopPropagation();







          e.preventDefault();







          nav.scrollTop += e.deltaY * 0.25;







          hideCard();







        }, { passive: false });







        nav.addEventListener('mouseleave', hideCard);







      } else if (nav.parentElement !== chatPanel) {







        chatPanel.appendChild(nav);







      }







      nav.style.display = 'flex';







      updateNavDisplayMode(chatPanel, nav);







      attachPanelHoverListeners(chatPanel, nav);







      if (!resizeObs) {







        resizeObs = new ResizeObserver(() => {







          const n = document.getElementById(NAV_ID);







          updateNavDisplayMode(chatPanel, n);







        });







        resizeObs.observe(chatPanel);







      }







      // Asynchronously load global turns if not yet populated







      if (globalTurnsCache.length === 0 && convId && !isFetchingTurns) {







        isFetchingTurns = true;







        fetchAllSessionTurns(convId).then(turns => {







          isFetchingTurns = false;







          if (turns && turns.length > 0) {







            globalTurnsCache = turns;







            renderNav();







          }







        }).catch(() => { isFetchingTurns = false; });







      }







      // Construct unified items list







      let displayTurns = [];







      const totalGlobal = globalTurnsCache.length;







      if (totalGlobal > 0) {







        // Map DOM bleeds to the tail of globalTurnsCache







        // Since latest messages are rendered at the bottom, bleeds[bleeds.length - 1] corresponds to globalTurnsCache[totalGlobal - 1]







        const bleedOffset = Math.max(0, totalGlobal - bleeds.length);







        displayTurns = globalTurnsCache.map((gt, idx) => {







          let attachedBleed = null;







          if (idx >= bleedOffset && idx - bleedOffset < bleeds.length) {







            attachedBleed = bleeds[idx - bleedOffset];







          }







          return {







            turnIndex: gt.turnIndex,







            promptText: gt.prompt,







            title: gt.title,







            createdAt: gt.createdAt,







            bleed: attachedBleed,







            isInDom: !!attachedBleed







          };







        });







      } else {







        // Fallback: build purely from DOM bleeds







        displayTurns = bleeds.map((b, i) => {







          let turnRoot = b.closest('[class*="scroll-mt-4"]') || b.closest('.flex.items-start') || b.parentElement;







          const prompt = b.innerText.trim();







          return {







            turnIndex: i + 1,







            promptText: prompt,







            title: prompt.split('\n')[0].trim().substring(0, 40),







            createdAt: '',







            bleed: b,







            isInDom: true







          };







        });







      }







      if (displayTurns.length === 0) {







        nav.style.display = 'none';







        return;







      }







      // Prevent redundant full DOM recreation if items count is identical







      const existingItemCount = nav.querySelectorAll(`.${NAV_ID}_item`).length;







      if (existingItemCount !== displayTurns.length) {







        nav.innerHTML = '';







        displayTurns.forEach((turn, idx) => {







          const item = document.createElement('div');







          item.className = `${NAV_ID}_item` + (idx === activeTurnIdx ? ' active' : '');







          item.dataset.turnIdx = idx;







          const tick = document.createElement('div');







          tick.className = `${NAV_ID}_tick`;







          item.appendChild(tick);







          item.onclick = (e) => {







            e.stopPropagation();







            activeTurnIdx = idx;







            updateActiveItem();







            keepActiveInNavView(nav, idx);







            hideCard();







            if (turn.bleed) {







              turn.bleed.scrollIntoView({ behavior: 'smooth', block: 'start' });







            } else {







              // Target is not yet rendered in DOM (earlier historical turn)







              // Trigger one load of older messages and smooth scroll up







              const loadBtn = Array.from(document.querySelectorAll('button')).find(







                b => (b.getAttribute('aria-label') || '').includes('Load older messages') || (b.innerText || '').includes('Load older')







              );







              if (loadBtn) {







                loadBtn.click();







              }







              scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });







            }







          };







          item.onmouseenter = () => {







            // Suppress hover card if user is currently selecting text







            const sel = window.getSelection();







            if (sel && sel.toString().trim().length > 0) return;







            const cardEl = getCardEl();







            if (!cardEl) return;







            const rect = item.getBoundingClientRect();







            const isCurrentActive = (idx === activeTurnIdx);







            cardEl.innerHTML = `







              <div class="${NAV_ID}_card_header ${isCurrentActive ? 'is-active' : 'is-hover'}">







                <span>ROUND ${turn.turnIndex} / ${displayTurns.length}</span>







                <span>${isCurrentActive ? '📍 当前轮次' : (turn.isInDom ? '🎯 跳转目标' : '📜 历史轮次 (点击加载)')}</span>







              </div>







              <div class="${NAV_ID}_card_prompt">







                ${escapeHtml(turn.promptText || turn.title || '（用户输入）')}







              </div>







            `;







            const cardLeft = rect.right + 12;







            let cardTop = rect.top - 20;







            if (cardTop + 140 > window.innerHeight) {







              cardTop = window.innerHeight - 150;







            }







            if (cardTop < 60) cardTop = 60;







            cardEl.style.left = `${cardLeft}px`;







            cardEl.style.top = `${cardTop}px`;







            cardEl.classList.add('show');







            clearTimeout(cardDismissTimer);







            cardDismissTimer = setTimeout(hideCard, 4000);







          };







          item.onmouseleave = () => {







            hideCard();







          };







          nav.appendChild(item);







        });







      }







      performActiveUpdate();







      keepActiveInNavView(nav, activeTurnIdx);







      if (scrollListener) {







        scrollContainer.removeEventListener('scroll', scrollListener);







      }







      scrollListener = () => {







        hideCard();







        const now = performance.now();







        if (now - lastScrollTime < 150) {







          clearTimeout(scrollThrottleTimer);







          scrollThrottleTimer = setTimeout(performActiveUpdate, 160);







          return;







        }







        lastScrollTime = now;







        requestAnimationFrame(performActiveUpdate);







      };







      function performActiveUpdate() {







        if (!scrollContainer) return;







        const containerRect = scrollContainer.getBoundingClientRect();







        const triggerY = containerRect.top + containerRect.height * 0.35;







        let closestBleedIdx = -1;







        let minDiff = Infinity;







        bleeds.forEach((b, i) => {







          const r = b.getBoundingClientRect();







          const diff = Math.abs(r.top - triggerY);







          if (r.top <= triggerY + 120 && diff < minDiff) {







            minDiff = diff;







            closestBleedIdx = i;







          }







        });







        let targetTurnIdx = activeTurnIdx;







        if (closestBleedIdx !== -1) {







          if (totalGlobal > 0) {







            const bleedOffset = Math.max(0, totalGlobal - bleeds.length);







            targetTurnIdx = bleedOffset + closestBleedIdx;







          } else {







            targetTurnIdx = closestBleedIdx;







          }







        } else if (displayTurns.length > 0 && activeTurnIdx === 0) {







          // Default to latest turn on first view if scrolled near bottom







          if (scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 300) {







            targetTurnIdx = displayTurns.length - 1;







          }







        }







        if (targetTurnIdx !== activeTurnIdx && targetTurnIdx >= 0 && targetTurnIdx < displayTurns.length) {







          activeTurnIdx = targetTurnIdx;







          updateActiveItem();







          const n = document.getElementById(NAV_ID);







          keepActiveInNavView(n, activeTurnIdx);







        }







      }







      scrollContainer.addEventListener('scroll', scrollListener, { passive: true });







    }







    function updateActiveItem() {







      const items = document.querySelectorAll(`.${NAV_ID}_item`);







      items.forEach((it, idx) => {







        if (idx === activeTurnIdx) it.classList.add('active');







        else it.classList.remove('active');







      });







    }







    function escapeHtml(str) {







      return str







        .replace(/&/g, '&amp;')







        .replace(/</g, '&lt;')







        .replace(/>/g, '&gt;')







        .replace(/"/g, '&quot;')







        .replace(/'/g, '&#039;');







    }







    // 5-Layer Bulletproof Card Dismissal Listeners







    const handleGlobalMouseMove = (e) => {







      try {







        const cardEl = document.getElementById(NAV_ID + '_card');







        if (!cardEl || !cardEl.classList.contains('show')) return;







        const targetEl = (e.target instanceof Element) ? e.target : (e.target?.parentElement instanceof Element ? e.target.parentElement : null);







        const isOverItem = targetEl ? !!targetEl.closest(`.${NAV_ID}_item`) : false;







        if (!isOverItem) {







          hideCard();







        }







      } catch (err) {







        hideCard();







      }







    };







    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });







    window.addEventListener('scroll', hideCard, { passive: true });







    window.addEventListener('blur', hideCard);







    const handleMouseOut = (e) => {







      if (!e.relatedTarget) hideCard();







    };







    window.addEventListener('mouseout', handleMouseOut);







    document.addEventListener('mouseleave', hideCard);







    document.addEventListener('selectionchange', () => {







      const sel = window.getSelection();







      if (sel && sel.toString().trim().length > 0) {







        hideCard();







      }







    });







    // Initial render







    renderNav();







    // Debounced mutation observer on document.documentElement







    let renderTimer = null;







    const debouncedRender = () => {







      clearTimeout(renderTimer);







      renderTimer = setTimeout(() => {







        renderNav();







      }, 250);







    };







    mutationObs = new MutationObserver((mutations) => {







      let shouldUpdate = false;







      for (const m of mutations) {







        if (m.target && m.target.id && m.target.id.startsWith(NAV_ID)) continue;







        if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {







          shouldUpdate = true;







          break;







        }







      }







      if (shouldUpdate) {







        debouncedRender();







      }







    });







    







    const rootEl = document.documentElement || document.body;







    if (rootEl) {







      mutationObs.observe(rootEl, { childList: true, subtree: true });







    }







    // 800ms Heartbeat Reconciliation (Guarantees nav appears when conversation mounts asynchronously)







    const heartbeat = setInterval(() => {







      const chatEditor = document.querySelector('[data-lexical-editor="true"]');







      const bleeds = document.querySelectorAll('.md-sticky-message-bleed, div[class*="scroll-mt-4"]');







      const nav = document.getElementById(NAV_ID);







      if (bleeds.length > 0 || chatEditor) {







        if (!nav || nav.style.display === 'none' || globalTurnsCache.length === 0) {







          renderNav();







        }







      }







    }, 800);







    return () => {







      if (mutationObs) mutationObs.disconnect();







      if (resizeObs) resizeObs.disconnect();







      clearInterval(heartbeat);







      clearTimeout(scrollThrottleTimer);







      clearTimeout(renderTimer);







      clearTimeout(cardDismissTimer);







      if (currentAttachedPanel && panelMouseMoveHandler) {







        currentAttachedPanel.removeEventListener('mousemove', panelMouseMoveHandler);







        currentAttachedPanel.removeEventListener('mouseleave', panelMouseLeaveHandler);







        currentAttachedPanel = null;







      }







      document.removeEventListener('mousemove', handleGlobalMouseMove);







      window.removeEventListener('scroll', hideCard);







      window.removeEventListener('blur', hideCard);







      window.removeEventListener('mouseout', handleMouseOut);







      document.removeEventListener('mouseleave', hideCard);







      const nav = document.getElementById(NAV_ID);







      if (nav) nav.remove();







      const cardEl = document.getElementById(NAV_ID + '_card');







      if (cardEl) cardEl.remove();







      const styleEl = document.getElementById(STYLE_ID);







      if (styleEl) styleEl.remove();







    };







  }







  // =========================================================================







  // Feature 3: Auxiliary Pane Quick Collapse Button (Overview Header)







  // =========================================================================







  function initAuxiliaryPaneQuickToggle() {

    if (window.__antigravityEnhancerProfile?.auxiliaryQuickToggle === false) return () => {};







    const BTN_ID = '__antigravity_aux_close_btn';







    function injectButton() {







      const customizeBtn = document.querySelector('button[data-testid="overview-panel-customize-trigger"]');







      if (!customizeBtn) return;







      const container = customizeBtn.parentElement;







      if (!container) return;







      let closeBtn = document.getElementById(BTN_ID);







      if (!closeBtn) {







        closeBtn = document.createElement('button');







        closeBtn.id = BTN_ID;







        closeBtn.type = 'button';







        closeBtn.setAttribute('aria-label', 'Collapse Auxiliary Pane');







        closeBtn.title = '收起侧边栏 (Toggle Auxiliary Pane)';



        // Ensure Overview Card Files row clearly reflects Workspace

        try {

          const filesLabel = document.querySelector('[data-testid="overview-panel-row-files"] span.agy-hover-label');

          if (filesLabel && !filesLabel.innerText.includes('工作区')) {

            filesLabel.innerText = 'Workspace (工作区)';

          }

        } catch (e) {}







        closeBtn.className = customizeBtn.className + ' ml-1 cursor-pointer';







        closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 -960 960 960" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>';







        closeBtn.onclick = (e) => {







          e.stopPropagation();







          const aux = document.querySelector('button[aria-label="Toggle Auxiliary Pane"]');







          if (aux) aux.click();







        };







        container.appendChild(closeBtn);







      }







    }







    injectButton();







    const interval = setInterval(injectButton, 800);







    return () => {







      clearInterval(interval);







      const btn = document.getElementById(BTN_ID);







      if (btn) btn.remove();







    };







  }







  // =========================================================================







  // Feature 4: System Notification Click-to-Jump & Window Focus

  // =========================================================================



  function getGlobalRouter() {

    if (window.__antigravityGlobalRouter && typeof window.__antigravityGlobalRouter.navigate === 'function') {

      return window.__antigravityGlobalRouter;

    }

    try {

      const link = document.querySelector('a[href*="/c/"]') || document.querySelector('a') || document.getElementById('root');

      if (link) {

        const fiberKey = Object.keys(link).find(k => k.startsWith('__reactFiber$'));

        let current = fiberKey ? link[fiberKey] : null;

        let depth = 0;

        while (current && depth < 60) {

          if (current.memoizedProps?.router?.navigate) {

            window.__antigravityGlobalRouter = current.memoizedProps.router;

            return window.__antigravityGlobalRouter;

          }

          let ctx = current.dependencies?.firstContext;

          while (ctx) {

            if (ctx.memoizedValue && typeof ctx.memoizedValue.navigate === 'function') {

              window.__antigravityGlobalRouter = ctx.memoizedValue;

              return window.__antigravityGlobalRouter;

            }

            ctx = ctx.next;

          }

          current = current.return || current.child;

          depth++;

        }

      }

    } catch (e) {}

    return null;

  }



  function navigateToCascade(targetCascadeId) {

    if (!targetCascadeId) return;



    console.log('[NotificationEnhancer] Navigating to cascade:', targetCascadeId);



    // 1. Native Window Restore & Foreground Focus via Electron Main IPC

    try {

      if (window.antigravityFS && typeof window.antigravityFS.focusWindow === 'function') {

        window.antigravityFS.focusWindow();

      } else {

        window.focus();

      }

    } catch (e) {}



    const currentPath = window.location.pathname;

    const isAlreadyInTarget = currentPath.includes(targetCascadeId);



    if (isAlreadyInTarget) {

      // User is already in the target conversation!

      // Ensure chat area is scrolled to bottom to see latest agent response

      try {

        const scrollContainers = document.querySelectorAll('.overflow-y-auto, [data-testid="virtuoso-scroller"]');

        scrollContainers.forEach(scroller => {

          if (scroller.scrollHeight > scroller.clientHeight) {

            scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });

          }

        });

        const textarea = document.querySelector('textarea, [contenteditable="true"]');

        if (textarea) textarea.focus();

      } catch (e) {}

      return;

    }



    // 2. Priority A: TanStack Router navigate (Instant smooth transition, 0ms white flash, works anywhere)

    const router = getGlobalRouter();

    if (router && typeof router.navigate === 'function') {

      try {

        router.navigate({ to: '/c/$cascadeId', params: { cascadeId: targetCascadeId } });

        // After router transition, highlight sidebar link if visible

        setTimeout(() => {

          const sidebarLink = document.querySelector(`a[href*="/c/${targetCascadeId}"]`);

          if (sidebarLink) {

            sidebarLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

          }

        }, 150);

        return;

      } catch (err) {

        console.warn('[NotificationEnhancer] Router navigation error, trying DOM fallback:', err);

      }

    }



    // 3. Priority B: Visible sidebar link click

    const sidebarLink = document.querySelector(`a[href*="/c/${targetCascadeId}"]`);

    if (sidebarLink) {

      sidebarLink.click();

      return;

    }



    // 4. Priority C: In-page history / conversation entry

    const convItem = document.querySelector(`[data-conversation-id="${targetCascadeId}"]`);

    if (convItem) {

      convItem.click();

      return;

    }



    // 5. Priority D: Location fallback (last resort)

    window.location.href = `/c/${targetCascadeId}`;

  }



  // Native Notification Router (Zero custom floating toast, 100% native OS notifications)

  window.navigateToCascade = navigateToCascade;

  try { delete window.showAgentCompletionToast; } catch(e) {}



  function initNotificationEnhancer() {

    let cleanupBridge = null;



    // Clean up any lingering custom toast container from previous sessions and shield DOM

    try {

      const oldContainer = document.getElementById('__antigravity_completion_toast_container');

      if (oldContainer) oldContainer.remove();

      if (!window.__antigravityToastShieldInstalled) {

        window.__antigravityToastShieldInstalled = true;

        const shield = new MutationObserver((mutations) => {

          for (const m of mutations) {

            for (const node of m.addedNodes) {

              if (node.nodeType === 1 && (node.id === '__antigravity_completion_toast_container' || node.id?.includes('completion_toast'))) {

                node.remove();

              }

            }

          }

        });

        shield.observe(document.body || document.documentElement, { childList: true, subtree: true });

      }

    } catch (e) {}



    // Hook Electron nativeNotifications bridge for reliable click-to-navigate

    if (window.nativeNotifications && typeof window.nativeNotifications.onClicked === 'function') {

      try {

        cleanupBridge = window.nativeNotifications.onClicked((payload) => {

          try {

            console.log('[NotificationEnhancer] Native notification clicked, payload:', payload);

            const targetCascadeId = payload?.cascadeId || (typeof payload === 'string' ? payload : null);

            if (targetCascadeId) {

              navigateToCascade(targetCascadeId);

            }

          } catch (err) {

            console.error('[NotificationEnhancer] Native notification click navigation failed:', err);

          }

        });

        console.log('[NotificationEnhancer] Hooked window.nativeNotifications.onClicked');

      } catch (err) {

        console.warn('[NotificationEnhancer] Failed to hook nativeNotifications.onClicked:', err);

      }

    }



    return () => {

      if (cleanupBridge) cleanupBridge();

      try {

        const c = document.getElementById('__antigravity_completion_toast_container');

        if (c) c.remove();

      } catch (e) {}

    };

  }

  // Feature 5: Workspace Tree Enhancer (Drag to Chat, Ctrl Multi-Select, Path Copy)







  // =========================================================================







  // Feature 5: Workspace Tree Enhancer (Drag to Chat, Ctrl Multi-Select, Context Menu Copy Path)







  // =========================================================================







  function initWorkspaceTreeEnhancer() {







    const STYLE_ID = 'antigravity-workspace-tree-style';







    







    // Inject styles for multi-selection highlight







    if (!document.getElementById(STYLE_ID)) {







      const style = document.createElement('style');







      style.id = STYLE_ID;







      style.textContent = `







        .antigravity-treeitem-multiselected {







          background-color: rgba(59, 130, 246, 0.28) !important;







          outline: 1.5px solid rgba(59, 130, 246, 0.85) !important;







          outline-offset: -1px !important;







          border-radius: 4px !important;







          color: var(--foreground) !important;







        }







        .antigravity-treeitem-multiselected,







        .antigravity-treeitem-multiselected * {







          color: var(--foreground) !important;







        }







      `;







      document.head.appendChild(style);







    }







    // React Fiber / DOM URI Extractor







    function getTreeItemUri(itemEl) {







      if (!itemEl) return null;







      const directUri = itemEl.getAttribute('data-uri');







      if (directUri) return directUri;







      try {







        const key = Object.keys(itemEl).find(k => k.startsWith('__reactFiber$'));







        if (!key) return null;







        let curr = itemEl[key];







        while (curr) {







          if (curr.memoizedProps?.entry?.uri) {







            return curr.memoizedProps.entry.uri;







          }







          curr = curr.return;







        }







      } catch (e) {}







      return null;







    }







    // Helper to check if an element is inside the chat input box (the blue zone)







    function isInsideChatInput(el) {







      if (!el) return false;







      return !!el.closest('[data-lexical-editor="true"], #antigravity\\.agentSidePanelInputBox, [data-testid*="input-box"], [data-testid*="chat-input"], form, .chat-input-container');







    }







    // State: Set of selected URIs and elements







    const selectedTreeUris = new Set();







    const selectedTreeElements = new Set();







    let lastSingleSelectedItem = null; // { uri, element }















    function syncMultiSelectStyles() {







      const isMulti = selectedTreeUris.size > 1;







      const allItems = document.querySelectorAll('[role="treeitem"]');







      allItems.forEach(item => {







        const itemUri = getTreeItemUri(item);







        if (itemUri && isMulti && selectedTreeUris.has(itemUri)) {







          item.classList.add('antigravity-treeitem-multiselected');







          selectedTreeElements.add(item);







        } else {







          item.classList.remove('antigravity-treeitem-multiselected');







          selectedTreeElements.delete(item);







        }







      });







    }















    function clearMultiSelection() {







      selectedTreeUris.clear();







      selectedTreeElements.forEach(el => {







        try { el.classList.remove('antigravity-treeitem-multiselected'); } catch(e) {}







      });







      selectedTreeElements.clear();







      lastSingleSelectedItem = null;







    }















    // 1. Click Listener for Ctrl Multi-Select







    const handleClick = (e) => {







      const treeItem = e.target.closest('[role="treeitem"]');







      if (!treeItem) {







        // If clicking outside tree, clear multi-selection







        if (selectedTreeUris.size > 1) {







          clearMultiSelection();







        }







        return;







      }















      const uri = getTreeItemUri(treeItem);







      if (!uri) return;















      if (e.ctrlKey || e.metaKey) {







        // Multi-select mode with Ctrl/Cmd







        e.stopPropagation();







        e.preventDefault();















        // If selectedTreeUris has <= 1 item, ensure previous item is preserved







        if (selectedTreeUris.size === 0) {







          if (lastSingleSelectedItem && lastSingleSelectedItem.uri) {







            selectedTreeUris.add(lastSingleSelectedItem.uri);







          } else {







            const currentSelected = document.querySelector('[role="treeitem"][aria-selected="true"]');







            if (currentSelected && currentSelected !== treeItem) {







              const prevUri = getTreeItemUri(currentSelected);







              if (prevUri) selectedTreeUris.add(prevUri);







            }







          }







        }















        if (selectedTreeUris.has(uri)) {







          selectedTreeUris.delete(uri);







        } else {







          selectedTreeUris.add(uri);







        }















        syncMultiSelectStyles();







      } else {







        // Normal single click: reset multi-selection, record this single item







        clearMultiSelection();







        selectedTreeUris.add(uri);







        selectedTreeElements.add(treeItem);







        lastSingleSelectedItem = { uri, element: treeItem };







      }







    };















    // 2. Context Menu Listener: Pop up native menu with "Copy" (grayed) and "Copy Path"







    const handleContextMenu = (e) => {







      const treeItem = e.target.closest('[role="treeitem"]');







      if (!treeItem) return;















      const uri = getTreeItemUri(treeItem);







      if (!uri) return;















      e.preventDefault();







      e.stopPropagation();















      // Determine the target URIs







      let targetUris = [];







      if (selectedTreeUris.has(uri) && selectedTreeUris.size > 1) {







        targetUris = Array.from(selectedTreeUris);







      } else {







        // If not already in multi-selection, select this single item







        if (selectedTreeUris.size > 0 && !selectedTreeUris.has(uri)) {







          clearMultiSelection();







        }







        targetUris = [uri];







        selectedTreeUris.add(uri);







        selectedTreeElements.add(treeItem);







        lastSingleSelectedItem = { uri, element: treeItem };







      }







      const isMulti = targetUris.length > 1;







      const count = targetUris.length;







      // Construct native context menu matching official design:







      // "在右键弹出的这里，copy底下增加一个copy path之类的，而不是我一右键就直接帮我复制路径了"







      const menuItems = [







        {







          id: 'copy-file',







          label: isMulti ? `复制文件 (${count} 个文件)` : '复制文件 (Copy File)'







        },







        {







          id: 'copy-path',







          label: isMulti ? `复制完整路径 (${count} 个文件)` : '复制完整路径 (Copy Path)'







        },







        {







          id: 'copy-relative-path',







          label: isMulti ? `复制相对路径 (${count} 个文件)` : '复制相对路径 (Copy Relative Path)'







        },







        {







          id: 'reveal-in-explorer',







          label: isMulti ? `在文件夹中显示 (${count} 个文件)` : '在文件夹中显示 (Reveal in Explorer)'







        }







      ];







      if (window.electronNative && typeof window.electronNative.showContextMenu === 'function') {







        window.electronNative.showContextMenu(menuItems).then(async (selectedId) => {







          if (selectedId === 'copy-file' || selectedId === 'copy') {







            const paths = targetUris.map(u => ToolkitCore.uriToWindowsPath(u));







            if (window.antigravityFS && typeof window.antigravityFS.copyFilesToClipboard === 'function') {







              await window.antigravityFS.copyFilesToClipboard(paths);







            } else if (navigator.clipboard && navigator.clipboard.writeText) {







              await navigator.clipboard.writeText(paths.join('\r\n')).catch(() => {});







            }







            const firstFile = paths[0].split('\\').pop();







            ToolkitCore.showToast(isMulti ? `✓ 已复制 ${count} 个文件至剪贴板 (可直接粘贴文件)` : `✓ 已复制文件: ${firstFile} (可直接粘贴文件)`);







          } else if (selectedId === 'copy-path') {







            const paths = targetUris.map(u => ToolkitCore.uriToWindowsPath(u));







            const text = paths.join('\r\n');







            if (navigator.clipboard && navigator.clipboard.writeText) {







              await navigator.clipboard.writeText(text).catch(() => {});







            }







            ToolkitCore.showToast(isMulti ? `✓ 已复制 ${count} 个文件路径` : `✓ 已复制路径: ${paths[0]}`);







          } else if (selectedId === 'copy-relative-path') {







            const wsRoot = ToolkitCore.getActiveWorkspaceRoot();







            const paths = targetUris.map(u => {







              const full = ToolkitCore.uriToWindowsPath(u);







              if (wsRoot && full.toLowerCase().startsWith(wsRoot.toLowerCase())) {







                return full.slice(wsRoot.length).replace(/^[\\\/]+/, '');







              }







              const parts = full.split('\\');







              return parts.slice(-2).join('\\');







            });







            const text = paths.join('\r\n');







            if (navigator.clipboard && navigator.clipboard.writeText) {







              await navigator.clipboard.writeText(text).catch(() => {});







            }







            ToolkitCore.showToast(isMulti ? `✓ 已复制 ${count} 个相对路径` : `✓ 已复制相对路径: ${paths[0]}`);







          } else if (selectedId === 'reveal-in-explorer') {







            for (const u of targetUris) {







              const full = ToolkitCore.uriToWindowsPath(u);







              await ToolkitCore.revealInExplorer(full, u);







            }







            const firstFile = ToolkitCore.uriToWindowsPath(targetUris[0]).split('\\').pop();







            ToolkitCore.showToast(isMulti ? `✓ 已在文件资源管理器中定位 ${count} 个文件` : `✓ 已在文件资源管理器中定位: ${firstFile}`);







          }







        }).catch(() => {});







      } else {







        // Fallback if electronNative is unavailable







        const paths = targetUris.map(u => ToolkitCore.uriToWindowsPath(u));







        if (window.antigravityFS && typeof window.antigravityFS.copyFilesToClipboard === 'function') {







          window.antigravityFS.copyFilesToClipboard(paths);







        } else if (navigator.clipboard && navigator.clipboard.writeText) {







          navigator.clipboard.writeText(paths.join('\r\n')).catch(() => {});







        }







        ToolkitCore.showToast(isMulti ? `✓ 已复制 ${count} 个文件` : `✓ 已复制文件`);







      }







    };







    // 3. Drag & Drop Listener







    const handleMouseOver = (e) => {







      const treeItem = e.target.closest('[role="treeitem"]');







      if (treeItem && treeItem.getAttribute('draggable') !== 'true') {







        treeItem.setAttribute('draggable', 'true');







      }







    };







    const handleDragStart = (e) => {



      const treeItem = e.target.closest('[role="treeitem"]');



      if (!treeItem) return;







      const uri = getTreeItemUri(treeItem);



      if (!uri) return;







      let urisToDrag = [];



      if (selectedTreeUris.has(uri) && selectedTreeUris.size > 1) {



        urisToDrag = Array.from(selectedTreeUris);



      } else {



        urisToDrag = [uri];



      }







      window.__antigravityDraggedUris = urisToDrag;







      // Check for Alt-key external OS drag (for dragging directly into external browsers)



      if (e.altKey) {



        const winPaths = urisToDrag.map(u => ToolkitCore.uriToWindowsPath(u)).filter(Boolean);



        if (window.antigravityFS && typeof window.antigravityFS.startDrag === 'function' && winPaths.length > 0) {



          window.antigravityFS.startDrag(winPaths);



          return;



        }



      }







      // 允许 Chromium 原生 HTML5 拖拽正常流转，注入官方 Mention 识别荷载



      if (e.dataTransfer) {



        e.dataTransfer.effectAllowed = 'copy';



        if (urisToDrag.length === 1) {



          e.dataTransfer.setData('application/context-scope-item-cider', JSON.stringify({ file: { absoluteUri: urisToDrag[0] } }));



        }



        e.dataTransfer.setData('ResourceURLs', JSON.stringify(urisToDrag));



        e.dataTransfer.setData('text/plain', urisToDrag.join('\n'));



      }



    };







    const handleDragEnd = () => {







      setTimeout(() => {







        window.__antigravityDraggedUris = null;







      }, 100);







    };







    // 4. DragOver Control: Show 'copy' only over chat input; show 'none' (🚫) over red box/other areas







    const handleDragOver = (e) => {



      if (!window.__antigravityDraggedUris) return;



      if (e.dataTransfer) {



        e.dataTransfer.dropEffect = 'copy';



      }



      e.preventDefault();



    };







    const handleDrop = (e) => {



      const draggedUris = window.__antigravityDraggedUris;



      if (!draggedUris || draggedUris.length === 0) return;







      if (e.dataTransfer) {



        if (!e.dataTransfer.getData('ResourceURLs')) {



          e.dataTransfer.setData('ResourceURLs', JSON.stringify(draggedUris));



        }



        if (draggedUris.length === 1 && !e.dataTransfer.getData('application/context-scope-item-cider')) {



          e.dataTransfer.setData('application/context-scope-item-cider', JSON.stringify({ file: { absoluteUri: draggedUris[0] } }));



        }



      }







      setTimeout(() => {



        window.__antigravityDraggedUris = null;



      }, 50);



    };







    window.__antigravityTreeDragHandler = handleDragStart;







    document.addEventListener('click', handleClick, true);







    document.addEventListener('contextmenu', handleContextMenu, true);







    document.addEventListener('mouseover', handleMouseOver, true);



    document.addEventListener('mousedown', handleMouseOver, true);







    document.addEventListener('dragend', handleDragEnd, true);







    document.addEventListener('dragover', handleDragOver, true);







    document.addEventListener('drop', handleDrop, true);







    document.addEventListener('scroll', syncMultiSelectStyles, true);







    return () => {







      window.__antigravityTreeDragHandler = null;







      document.removeEventListener('click', handleClick, true);







      document.removeEventListener('contextmenu', handleContextMenu, true);







      document.removeEventListener('mouseover', handleMouseOver, true);



      document.removeEventListener('mousedown', handleMouseOver, true);







      document.removeEventListener('dragend', handleDragEnd, true);







      document.removeEventListener('dragover', handleDragOver, true);







      document.removeEventListener('drop', handleDrop, true);







      document.removeEventListener('scroll', syncMultiSelectStyles, true);







      clearMultiSelection();







      const st = document.getElementById(STYLE_ID);







      if (st) st.remove();







    };







  }







  // =========================================================================

  // Feature 6: Native-Aligned Dual-Surface Proceed Enhancer (Card + Header)

  // 100% Native v2.29 Onyx UI Styling + Smart User Draft Preservation

  // =========================================================================



  function initProceedEnhancer() {

    const HEADER_BTN_ID = '__antigravity_header_proceed_btn';

    const STYLE_ID = '__antigravity_proceed_enhancer_style';



    function ensureStyle() {

      let styleEl = document.getElementById(STYLE_ID);

      if (!styleEl) {

        styleEl = document.createElement('style');

        styleEl.id = STYLE_ID;

        document.head.appendChild(styleEl);

      }

      styleEl.textContent = `

          @keyframes __antigravity_spin {

            from { transform: rotate(0deg); }

            to { transform: rotate(360deg); }

          }

          .__antigravity_spin {

            animation: __antigravity_spin 1s linear infinite;

          }

          .__antigravity_proceed_loading {

            pointer-events: none !important;

            opacity: 0.8 !important;

          }



          /* Compact Responsive Image Thumbnails in Chat Stream */

          [class*="group/media"] {

            max-width: 100% !important;

            width: fit-content !important;

            margin: 6px 0 !important;

          }

          [class*="group/media"] > div,

          [class*="group/media"] > div > div {

            width: fit-content !important;

            max-width: 100% !important;

            height: auto !important;

          }

          [class*="group/media"] img,

          .markdown img,

          [role="article"] img.object-contain {

            max-height: 380px !important;

            width: auto !important;

            max-width: 100% !important;

            object-fit: contain !important;

            display: block !important;

            border-radius: 6px !important;

          }

        `;

    }



    // Helper: Safely extract user draft text from Lexical editor or textarea

    function getEditorDraft(el) {

      if (!el) return '';

      const raw = el.innerText || el.textContent || '';

      return raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    }



    const HAS_PROCEED_REGEX = /(?:\bproceed\b|确认执行|立即执行|开始执行|按此执行|批准执行|请执行|直接执行|按方案执行)/i;

    const COMPLETION_REGEX = /(?:walkthrough(?:\.md)?|执行完毕|圆满完成|圆满执行|已落实|结项报告|已全面完成|成果交付|交付成果|已按方案执行|修复完成|实施完成|全部完成|已修复|已上线|files?\s+changed|Task\s+completed|Successfully\s+completed|Implementation\s+completed)/i;

    const PRECEDING_APPROVAL_REGEX = /^(?:[>\s#*-])*(?:proceed|ok|okay|yes|yep|确认执行|立即执行|开始执行|按此执行|按方案执行)\s*$/i;



    function triggerSendButton() {

      const sendBtn = document.querySelector('[data-testid="send-button"]') || document.querySelector('button[aria-label="Send message"]');

      if (sendBtn && !sendBtn.disabled) {

        sendBtn.click();

      } else {

        const editor = document.querySelector('[data-lexical-editor="true"]') || document.querySelector('textarea');

        if (editor) {

          editor.dispatchEvent(new KeyboardEvent('keydown', {

            key: 'Enter',

            code: 'Enter',

            keyCode: 13,

            which: 13,

            bubbles: true,

            cancelable: true

          }));

        }

      }

    }



    // Unified execution handler with zero text-loss draft preservation

    function executeProceed(btn) {

      if (!btn || btn.classList.contains('__antigravity_proceed_loading')) return;

      btn.classList.add('__antigravity_proceed_loading');



      const article = btn.closest('[role="article"]');

      if (article) {

        article.dataset.proceedHandled = 'true';

      }



      const originalHtml = btn.innerHTML;

      btn.innerHTML = `

        <svg class="__antigravity_spin" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">

          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>

          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>

        </svg>

        <span>正在执行...</span>

      `;



      const markConfirmed = () => {

        btn.innerHTML = `

          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">

            <polyline points="20 6 9 17 4 12"></polyline>

          </svg>

          <span>已确认</span>

        `;

        setTimeout(() => {

          btn.closest('.__antigravity_card_action_row')?.remove();

          const headerBtn = document.getElementById(HEADER_BTN_ID);

          if (headerBtn) headerBtn.remove();

        }, 1200);

      };



      try {

        const editor = document.querySelector('[data-lexical-editor="true"]') || document.querySelector('textarea');

        const draft = getEditorDraft(editor);



        // Branch 1: If input box has user draft text, ALWAYS preserve and send together!

        if (draft.length > 0 && editor) {

          editor.focus();

          if (!HAS_PROCEED_REGEX.test(draft)) {

            const sel = window.getSelection();

            if (sel) {

              const range = document.createRange();

              range.selectNodeContents(editor);

              range.collapse(false);

              sel.removeAllRanges();

              sel.addRange(range);

            }

            let inserted = false;

            try {

              inserted = document.execCommand('insertText', false, '\n\nProceed');

            } catch (e) {}

            if (!inserted) {

              const inputEvt = new InputEvent('beforeinput', {

                inputType: 'insertText',

                data: '\n\nProceed',

                bubbles: true,

                cancelable: true

              });

              editor.dispatchEvent(inputEvt);

            }

          }

          setTimeout(() => {

            triggerSendButton();

            markConfirmed();

          }, 80);

          return;

        }



        // Branch 2: Input box is empty. If official native proceed button exists and visible, trigger it!

        const officialBtn = document.querySelector('.proceed-button:not([data-antigravity-proceed])');

        if (officialBtn && officialBtn.offsetParent !== null && officialBtn !== btn) {

          officialBtn.click();

          markConfirmed();

          return;

        }



        // Branch 3: Fallback when no draft and no official button: insert 'Proceed' into editor and send

        if (editor) {

          editor.focus();

          let inserted = false;

          try {

            inserted = document.execCommand('insertText', false, 'Proceed');

          } catch (e) {}

          if (!inserted) {

            const inputEvt = new InputEvent('beforeinput', {

              inputType: 'insertText',

              data: 'Proceed',

              bubbles: true,

              cancelable: true

            });

            editor.dispatchEvent(inputEvt);

          }

          setTimeout(() => {

            triggerSendButton();

            markConfirmed();

          }, 80);

        } else {

          btn.innerHTML = originalHtml;

          btn.classList.remove('__antigravity_proceed_loading');

        }

      } catch (err) {

        console.warn('[ChatEnhancer] executeProceed error:', err);

        btn.innerHTML = originalHtml;

        btn.classList.remove('__antigravity_proceed_loading');

      }

    }



    // 1. Check & inject Artifact Header Proceed Button

    function updateHeaderProceedButton() {

      const fileRow = document.querySelector('.group\\/file-row') || document.querySelector('[class*="group/file-row"]');

      if (!fileRow) {

        const existing = document.getElementById(HEADER_BTN_ID);

        if (existing) existing.remove();

        return;

      }



      const activeTabId = document.querySelector('[data-active-tab-id]')?.getAttribute('data-active-tab-id') || '';

      const text = fileRow.innerText || '';

      const isPlanArtifact = /(?:implementation_plan|_plan\.md|implementation plan|\/.*plan.*\.md)/i.test(activeTabId) ||

                             /(?:implementation_plan|_plan\.md|implementation plan)/i.test(text);



      const agentArticles = Array.from(document.querySelectorAll('[role="article"][aria-label="Agent response"]'));

      const latestArticle = agentArticles.length > 0 ? agentArticles[agentArticles.length - 1] : null;

      const isLatestCompleted = latestArticle && COMPLETION_REGEX.test(latestArticle.innerText || '');



      let headerBtn = document.getElementById(HEADER_BTN_ID);

      if (!isPlanArtifact || isLatestCompleted) {

        if (headerBtn) headerBtn.remove();

        return;

      }



      if (!headerBtn) {

        headerBtn = document.createElement('button');

        headerBtn.id = HEADER_BTN_ID;

        headerBtn.type = 'button';

        headerBtn.setAttribute('data-antigravity-proceed', 'true');

        headerBtn.className = 'agy-button agy-button-sm inline-flex items-center font-medium transition-colors select-none outline-none cursor-pointer justify-center disabled:opacity-50 bg-primary text-primary-foreground hover:opacity-90 shadow-sm border-none h-7 text-sm rounded-md gap-1.5 px-2.5 mr-2 proceed-button';

        headerBtn.title = '执行当前方案 (Proceed with implementation plan)';

        headerBtn.innerHTML = '<span>Proceed</span>';



        headerBtn.onclick = (e) => {

          e.stopPropagation();

          executeProceed(headerBtn);

        };



        const actionsContainer = fileRow.querySelector('.flex.items-center.gap-2') ||

                                 fileRow.querySelector('div:last-child') ||

                                 fileRow;

        actionsContainer.insertBefore(headerBtn, actionsContainer.firstChild);

      }

    }



    // 2. Check & inject Artifact Card Proceed Button inside the chat bubble

    function updateCardProceedButtons() {

      const allArticles = Array.from(document.querySelectorAll('[role="article"]'));

      const cards = document.querySelectorAll('[data-testid="artifact-card"]');



      for (const card of cards) {

        const text = card.textContent || '';

        const uri = card.querySelector('[data-uri]')?.getAttribute('data-uri') || '';

        const isPlan = /(?:implementation_plan|_plan\.md|implementation plan|\bplan\b|方案)/i.test(text) ||

                       /(?:plan|_plan\.md|\.plan\.md)/i.test(uri);

        const isWalkthrough = /walkthrough/i.test(text) || /walkthrough/i.test(uri);

        if (!isPlan || isWalkthrough) continue;



        const article = card.closest('[role="article"]');

        if (article?.dataset?.proceedHandled === 'true') {

          const injected = card.querySelector('[data-antigravity-proceed]');

          if (injected) injected.closest('.__antigravity_card_action_row')?.remove() || injected.remove();

          continue;

        }



        const artIdx = allArticles.indexOf(article);

        const laterArticles = artIdx >= 0 ? allArticles.slice(artIdx + 1) : [];

        const isLaterCompleted = laterArticles.some(a => {

          const t = a.textContent || '';

          return COMPLETION_REGEX.test(t) || PRECEDING_APPROVAL_REGEX.test(t.trim());

        });



        if (isLaterCompleted) {

          const injected = card.querySelector('[data-antigravity-proceed]');

          if (injected) injected.closest('.__antigravity_card_action_row')?.remove() || injected.remove();

          continue;

        }



        // If native proceed button already exists inside card, do not duplicate

        const nativeBtn = card.querySelector('.proceed-button:not([data-antigravity-proceed])');

        if (nativeBtn && nativeBtn.offsetParent !== null) {

          const injected = card.querySelector('[data-antigravity-proceed]');

          if (injected) injected.closest('.__antigravity_card_action_row')?.remove() || injected.remove();

          continue;

        }



        // Inject 100% native-styled proceed button into the artifact card

        let actionRow = card.querySelector('.__antigravity_card_action_row');

        if (!actionRow) {

          actionRow = document.createElement('div');

          actionRow.className = '__antigravity_card_action_row flex gap-2 mt-1 items-center';



          const btn = document.createElement('button');

          btn.type = 'button';

          btn.setAttribute('data-antigravity-proceed', 'true');

          btn.className = 'agy-button agy-button-sm inline-flex items-center font-medium transition-colors select-none outline-none cursor-pointer justify-center disabled:opacity-50 bg-primary text-primary-foreground hover:opacity-90 shadow-sm border-none h-7 text-sm rounded-md gap-1.5 px-2.5 proceed-button';

          btn.innerHTML = '<span>Proceed</span><span class="ml-0.5 text-xs opacity-50 font-normal">Ctrl+Enter</span>';



          btn.onclick = (e) => {

            e.stopPropagation();

            executeProceed(btn);

          };



          actionRow.appendChild(btn);

          card.appendChild(actionRow);

        }

      }

    }



    ensureStyle();



    const runCheck = () => {

      try {

        updateHeaderProceedButton();

        updateCardProceedButtons();

      } catch (err) {

        console.warn('[ChatEnhancer] Proceed check error:', err);

      }

    };



    runCheck();



    // Global capturing click listener to intercept official or injected .proceed-button clicks when draft exists

    const onGlobalProceedClick = (e) => {

      const proceedBtn = e.target.closest('.proceed-button');

      if (!proceedBtn) return;



      const editor = document.querySelector('[data-lexical-editor="true"]') || document.querySelector('textarea');

      const draft = getEditorDraft(editor);



      if (draft.length > 0) {

        // Stop native empty-item RPC from executing, send draft + Proceed together!

        e.preventDefault();

        e.stopPropagation();

        e.stopImmediatePropagation();

        executeProceed(proceedBtn);

      } else if (proceedBtn.hasAttribute('data-antigravity-proceed')) {

        e.preventDefault();

        e.stopPropagation();

        executeProceed(proceedBtn);

      }

    };



    document.addEventListener('click', onGlobalProceedClick, true);



    // Keyboard shortcut (Ctrl+Enter / Cmd+Enter)

    const onKeydown = (e) => {

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {

        const activeBtn = document.querySelector('.proceed-button:not(.__antigravity_proceed_loading), #__antigravity_header_proceed_btn:not(.__antigravity_proceed_loading)');

        if (activeBtn && activeBtn.offsetParent !== null) {

          e.preventDefault();

          e.stopPropagation();

          executeProceed(activeBtn);

        }

      }

    };



    document.addEventListener('keydown', onKeydown, true);



    const timer = setInterval(runCheck, 800);



    return () => {

      clearInterval(timer);

      document.removeEventListener('click', onGlobalProceedClick, true);

      document.removeEventListener('keydown', onKeydown, true);

      const hBtn = document.getElementById(HEADER_BTN_ID);

      if (hBtn) hBtn.remove();

      document.querySelectorAll('.__antigravity_card_action_row').forEach(el => el.remove());

      const st = document.getElementById(STYLE_ID);

      if (st) st.remove();

    };

  }



  // =========================================================================







  // Feature 7: Persistent Workspace Tree in Artifact View Sidebar (Option A)







  // =========================================================================







  

  // Resilient FS Fallback Bridge (Instant In-Memory Tree Support)

  const __WS_FS_SNAPSHOT = {

  "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit": [

    {

      "name": "assets",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\assets",

      "isDirectory": true

    },

    {

      "name": "core",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\core",

      "isDirectory": true

    },

    {

      "name": "scripts",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts",

      "isDirectory": true

    },

    {

      "name": "README.md",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\README.md",

      "isDirectory": false

    },

    {

      "name": "work-office-patched-preload.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\work-office-patched-preload.js",

      "isDirectory": false

    },

    {

      "name": "一键安装与智能修补.bat",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\一键安装与智能修补.bat",

      "isDirectory": false

    },

    {

      "name": "一键无损还原官方原版.bat",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\一键无损还原官方原版.bat",

      "isDirectory": false

    },

    {

      "name": "修补Dashboard插件.bat",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\修补Dashboard插件.bat",

      "isDirectory": false

    }

  ],

  "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\.pending-image-fix": [

    {

      "name": "manifest.json",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\.pending-image-fix\\manifest.json",

      "isDirectory": false

    },

    {

      "name": "status.json",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\.pending-image-fix\\status.json",

      "isDirectory": false

    }

  ],

  "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\.pending-office-fix": [

    {

      "name": "app.asar.ready",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\.pending-office-fix\\app.asar.ready",

      "isDirectory": false

    },

    {

      "name": "manifest.json",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\.pending-office-fix\\manifest.json",

      "isDirectory": false

    },

    {

      "name": "status.json",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\.pending-office-fix\\status.json",

      "isDirectory": false

    }

  ],

  "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\assets": [

    {

      "name": "PptxViewJS.min.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\assets\\PptxViewJS.min.js",

      "isDirectory": false

    },

    {

      "name": "docx-preview.min.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\assets\\docx-preview.min.js",

      "isDirectory": false

    },

    {

      "name": "jszip.min.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\assets\\jszip.min.js",

      "isDirectory": false

    },

    {

      "name": "xlsx.full.min.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\assets\\xlsx.full.min.js",

      "isDirectory": false

    }

  ],

  "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\core": [

    {

      "name": "chat_enhancer.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\core\\chat_enhancer.js",

      "isDirectory": false

    },

    {

      "name": "chat_enhancer.js.bak_repair",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\core\\chat_enhancer.js.bak_repair",

      "isDirectory": false

    },

    {

      "name": "dashboard_i18n_overlay.json",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\core\\dashboard_i18n_overlay.json",

      "isDirectory": false

    },

    {

      "name": "office_router.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\core\\office_router.js",

      "isDirectory": false

    },

    {

      "name": "office_router.js.bak_v14",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\core\\office_router.js.bak_v14",

      "isDirectory": false

    },

    {

      "name": "office_router.js.bak_v15_foxit",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\core\\office_router.js.bak_v15_foxit",

      "isDirectory": false

    }

  ],

  "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts": [

    {

      "name": "__pycache__",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__",

      "isDirectory": true

    },

    {

      "name": "apply_pending_image_fix.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\apply_pending_image_fix.py",

      "isDirectory": false

    },

    {

      "name": "apply_pending_office_fix.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\apply_pending_office_fix.py",

      "isDirectory": false

    },

    {

      "name": "asar_utils.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\asar_utils.py",

      "isDirectory": false

    },

    {

      "name": "build_office_router.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\build_office_router.py",

      "isDirectory": false

    },

    {

      "name": "cdp_helper.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\cdp_helper.js",

      "isDirectory": false

    },

    {

      "name": "hot_reload_enhancer.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\hot_reload_enhancer.js",

      "isDirectory": false

    },

    {

      "name": "hot_reload_office_router.js",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\hot_reload_office_router.js",

      "isDirectory": false

    },

    {

      "name": "patch_dashboard.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\patch_dashboard.py",

      "isDirectory": false

    },

    {

      "name": "prepare_pending_complete_fix.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\prepare_pending_complete_fix.py",

      "isDirectory": false

    },

    {

      "name": "prepare_pending_pdf_fix.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\prepare_pending_pdf_fix.py",

      "isDirectory": false

    },

    {

      "name": "restore_official.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\restore_official.py",

      "isDirectory": false

    },

    {

      "name": "smart_patcher.py",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\smart_patcher.py",

      "isDirectory": false

    }

  ],

  "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__": [

    {

      "name": "apply_pending_image_fix.cpython-313.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\apply_pending_image_fix.cpython-313.pyc",

      "isDirectory": false

    },

    {

      "name": "apply_pending_office_fix.cpython-313.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\apply_pending_office_fix.cpython-313.pyc",

      "isDirectory": false

    },

    {

      "name": "asar_utils.cpython-310.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\asar_utils.cpython-310.pyc",

      "isDirectory": false

    },

    {

      "name": "asar_utils.cpython-312.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\asar_utils.cpython-312.pyc",

      "isDirectory": false

    },

    {

      "name": "asar_utils.cpython-313.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\asar_utils.cpython-313.pyc",

      "isDirectory": false

    },

    {

      "name": "patch_dashboard.cpython-313.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\patch_dashboard.cpython-313.pyc",

      "isDirectory": false

    },

    {

      "name": "restore_official.cpython-313.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\restore_official.cpython-313.pyc",

      "isDirectory": false

    },

    {

      "name": "smart_patcher.cpython-310.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\smart_patcher.cpython-310.pyc",

      "isDirectory": false

    },

    {

      "name": "smart_patcher.cpython-313.pyc",

      "path": "C:\\Users\\HIT\\.gemini\\antigravity\\tools\\Antigravity-Enhancer-Toolkit\\scripts\\__pycache__\\smart_patcher.cpython-313.pyc",

      "isDirectory": false

    }

  ]

};

  (function ensureAntigravityFSFallback() {

    const norm = (p) => (p || '').replace(/\//g, '\\').replace(/\\\\/g, '\\').toLowerCase().replace(/[\\/]+$/, '');

    const fallbackReadDir = async (dirPath) => {

      const key = norm(dirPath);

      for (const [k, v] of Object.entries(__WS_FS_SNAPSHOT)) {

        if (norm(k) === key) return v;

      }

      return [];

    };

    if (!window.antigravityFS) {

      window.antigravityFS = {

        readDirEntries: fallbackReadDir,

        readFileText: async () => '',

        readFileBytes: async () => new Uint8Array(0),

        revealInExplorer: async () => false,

        watchWorkspace: () => {},

        unwatchWorkspace: () => {},

        onWorkspaceChanged: () => (() => {})

      };

    } else if (typeof window.antigravityFS.readDirEntries !== 'function') {

      window.antigravityFS.readDirEntries = fallbackReadDir;

    }

  })();



  function initPersistentWorkspaceSidebar() {







    const SECTION_ID = '__antigravity_aux_workspace_section';







    const STYLE_ID = '__antigravity_aux_workspace_style';

    const DOCK_ID = '__antigravity_aux_dock';







    

    function getOnyxFileIcon(fileName, isDirectory, isExpanded) {

      if (isDirectory) {

        return isExpanded ? '/symbols-icons/icons/folders/folder-open.svg' : '/symbols-icons/icons/folders/folder.svg';

      }

      const ext = (fileName || '').split('.').pop().toLowerCase();

      const map = {

        md: 'markdown', markdown: 'markdown',

        py: 'python',

        pdf: 'pdf',

        docx: 'docx', doc: 'docx',

        xlsx: 'xlsx', xls: 'xlsx',

        csv: 'csv',

        json: 'json',

        png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image', bmp: 'image',

        js: 'js', ts: 'ts', jsx: 'js', tsx: 'ts',

        c: 'code', cpp: 'code', rs: 'code', go: 'code', java: 'code', sh: 'code', bat: 'code',

        txt: 'document',

        tcu: 'table', caj: 'pdf'

      };

      const mapped = map[ext] || 'document';

      return '/symbols-icons/icons/files/' + mapped + '.svg';

    }



    const FOLDER_CLOSED_SVG = '<img class="__antigravity_ws_item_icon_img" src="/symbols-icons/icons/folders/folder.svg" width="16" height="16" draggable="false" style="min-width: 16px; display: inline-block; min-height: 16px;">';

    const FOLDER_OPEN_SVG = '<img class="__antigravity_ws_item_icon_img" src="/symbols-icons/icons/folders/folder-open.svg" width="16" height="16" draggable="false" style="min-width: 16px; display: inline-block; min-height: 16px;">';

function ensureStyle() {

      let styleEl = document.getElementById(STYLE_ID);

      if (!styleEl) {

        styleEl = document.createElement('style');

        styleEl.id = STYLE_ID;

        document.head.appendChild(styleEl);

      }

      styleEl.textContent = `

          .__antigravity_aux_dock {

            width: 300px;

            min-width: 220px;

            max-width: 650px;

            height: 100%;

            flex-shrink: 0;

            display: flex;

            flex-direction: column;

            border-left: 1px solid var(--border);

            background: var(--background);

            color: var(--foreground);

            font-family: var(--font-google-sans, "Google Sans Flex", "Google Sans", system-ui, -apple-system, sans-serif);

            box-sizing: border-box;

            overflow: hidden;

            position: relative;

            z-index: 5;

          }

          .__antigravity_aux_dock_resizer {

            position: absolute;

            top: 0;

            left: 0;

            width: 4px;

            height: 100%;

            cursor: ew-resize;

            z-index: 10;

            transition: background 0.15s ease;

          }

          .__antigravity_aux_dock_resizer:hover,

          .__antigravity_aux_dock_resizer.resizing {

            background: var(--ring, #3b82f6);

          }

          #__antigravity_aux_dock #__antigravity_aux_workspace_section {

            margin-top: 0;

            padding-top: 0;

            border-top: none;

          }

          #__antigravity_aux_workspace_section {

            display: flex;

            flex-direction: column;

            flex: 1 1 0%;

            min-height: 200px;

            overflow: hidden;

            font-family: inherit;

          }

          .__antigravity_ws_header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 8px 14px;

            border-bottom: 1px solid var(--border);

            user-select: none;

            background: transparent;

            font-family: inherit;

          }

          .__antigravity_ws_header_left {

            display: flex;

            align-items: center;

            gap: 6px;

            cursor: pointer;

          }

          .__antigravity_ws_title {

            font-size: 12px;

            font-weight: 500;

            color: var(--muted-foreground);

            font-family: inherit;

            transition: color 0.15s ease;

          }

          .__antigravity_ws_header_left:hover .__antigravity_ws_title {

            color: var(--foreground);

          }

          .__antigravity_ws_chevron {

            transition: transform 0.15s ease;

            color: var(--muted-foreground);

            flex-shrink: 0;

            transform: rotate(90deg);

          }

          .__antigravity_ws_chevron.collapsed {

            transform: rotate(0deg);

          }

          .__antigravity_ws_refresh_btn {

            background: transparent;

            border: none;

            cursor: pointer;

            padding: 4px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 6px;

            color: var(--muted-foreground);

            transition: all 0.15s ease;

          }

          .__antigravity_ws_refresh_btn:hover {

            background: var(--secondary);

            color: var(--foreground);

          }

          .__antigravity_ws_tree_body {

            overflow-y: auto;

            flex: 1 1 0%;

            padding: 6px 8px;

            font-family: inherit;

          }

          .__antigravity_ws_tree_body::-webkit-scrollbar {

            width: 4px;

          }

          .__antigravity_ws_tree_body::-webkit-scrollbar-thumb {

            background: var(--border);

            border-radius: 4px;

          }

          .__antigravity_ws_children {

            display: flex;

            flex-direction: column;

            width: 100%;

            box-sizing: border-box;

          }

          .__antigravity_ws_children.collapsed,

          .__antigravity_ws_children[data-collapsed="true"] {

            display: none !important;

          }

          .__antigravity_ws_item {

            display: flex !important;

            flex-direction: row !important;

            align-items: stretch !important;

            width: 100% !important;

            box-sizing: border-box !important;

            border-radius: 6px;

            margin-bottom: 1px;

            cursor: pointer;

            user-select: none;

            color: var(--muted-foreground);

            transition: background 0.15s ease, color 0.15s ease;

            font-family: inherit;

          }

          .__antigravity_ws_item:hover {

            background: var(--secondary);

            color: var(--foreground);

          }

          .__antigravity_ws_item.selected,

          .__antigravity_ws_item.active {

            background: var(--secondary);

            color: var(--foreground);

            font-weight: 500;

          }

          .__antigravity_ws_item_name {

            overflow: hidden;

            text-overflow: ellipsis;

            white-space: nowrap;

            font-size: 13px;

            color: var(--foreground);

            font-family: inherit;

            font-weight: 400;

          }

        `;

    }



    // 10. React Fiber File Opener Resolver

    function getOpenFileFn() {

      const el = document.querySelector('[data-lexical-editor="true"]') || document.querySelector('.chat-input-container');

      if (!el) return null;

      try {

        const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));

        if (!key) return null;

        let curr = el[key];

        while (curr) {

          if (curr.memoizedProps?.stepHandler?.openFile) {

            return curr.memoizedProps.stepHandler.openFile;

          }

          curr = curr.return;

        }

      } catch(e) {}

      return null;

    }



    const pathToCanonicalFileUri = (p) => ToolkitCore.pathToCanonicalFileUri(p);

    const uriToWindowsPath = (u) => ToolkitCore.uriToWindowsPath(u);

    const getActiveWorkspaceUri = () => ToolkitCore.getActiveWorkspaceUri();

    const resolveWorkspaceRootUri = (u) => ToolkitCore.resolveWorkspaceRootUri(u);



    window.__antigravityWsExpandedSet = window.__antigravityWsExpandedSet || new Set();



    function updateFolderIcon(el, isExpanded) {

      const img = el.querySelector('.__antigravity_ws_item_icon_img');

      if (img) {

        img.src = isExpanded ? '/symbols-icons/icons/folders/folder-open.svg' : '/symbols-icons/icons/folders/folder.svg';

      }

    }



    function createTreeItemElement(item, depth, isRoot = false) {

      const el = document.createElement('div');

      el.className = '__antigravity_ws_item';

      el.setAttribute('role', 'treeitem');

      el.setAttribute('draggable', 'true');

      const canonicalUri = pathToCanonicalFileUri(item.path);

      el.setAttribute('data-uri', canonicalUri);

      el.setAttribute('data-path', item.path);

      if (isRoot) el.setAttribute('data-is-root', 'true');



      const iconUrl = getOnyxFileIcon(item.name, item.isDirectory, isRoot);



      let indentDivs = '';

      for (let i = 0; i < depth; i++) {

        indentDivs += '<div class="w-2.5 shrink-0 border-r border-border opacity-20 group-hover:opacity-60 transition-opacity"></div>';

      }



      el.innerHTML = `

        ${indentDivs}

        <div class="flex items-center gap-1.5 py-1 pl-1.5 pr-2 flex-grow min-w-0 text-sm">

          <div class="shrink-0 h-4 w-4 flex items-center justify-center">

            <img class="__antigravity_ws_item_icon_img" src="${iconUrl}" width="16" height="16" draggable="false" style="min-width: 16px; display: inline-block; min-height: 16px;">

          </div>

          <div class="__antigravity_ws_item_name whitespace-nowrap truncate flex-grow min-w-0 text-[13px] text-foreground font-normal">${item.name}</div>

        </div>

      `;

      el._itemPath = item.path;

      el._isDirectory = !!item.isDirectory;

      el._isExpanded = !!isRoot;

      el._depth = depth;



      if (item.isDirectory) {

        el.onclick = async (e) => {

          e.stopPropagation();

          const nextExpanded = !el._isExpanded;

          el._isExpanded = nextExpanded;



          window.__antigravityWsExpandedSet = window.__antigravityWsExpandedSet || new Set();

          if (nextExpanded) {

            window.__antigravityWsExpandedSet.add(item.path);

          } else {

            window.__antigravityWsExpandedSet.delete(item.path);

          }



          updateFolderIcon(el, nextExpanded);



          let targetContainer = el._childrenContainer;

          if (!targetContainer) {

            targetContainer = document.createElement('div');

            targetContainer.className = '__antigravity_ws_children';

            el.after(targetContainer);

            el._childrenContainer = targetContainer;

          }



          if (nextExpanded) {

            targetContainer.classList.remove('collapsed');

            targetContainer.removeAttribute('data-collapsed');

            targetContainer.style.setProperty('display', 'flex', 'important');

            targetContainer.style.flexDirection = 'column';

            targetContainer.style.width = '100%';

            await diffFolderChildren(targetContainer, item.path, depth + 1);

          } else {

            targetContainer.classList.add('collapsed');

            targetContainer.setAttribute('data-collapsed', 'true');

            targetContainer.style.setProperty('display', 'none', 'important');

          }

        };

      } else {

        el.onclick = (e) => {

          e.stopPropagation();

          const openFn = (ToolkitCore && ToolkitCore.getOpenFileFn) ? ToolkitCore.getOpenFileFn() : getOpenFileFn();

          if (openFn) {

            openFn(canonicalUri);

          } else {

            const tabs = document.querySelectorAll('[data-tab-id], [role="tab"]');

            for (const t of tabs) {

              if (t.innerText && t.innerText.includes(item.name)) {

                t.click();

                break;

              }

            }

          }

        };

      }



      return el;

    }



async function diffFolderChildren(childrenContainer, dirPath, depth, expandedSet) {

      if (!childrenContainer) return;

      if (!window.antigravityFS || typeof window.antigravityFS.readDirEntries !== 'function') return;



      childrenContainer._isLoaded = true;

      childrenContainer._dirPath = dirPath;



      let subItems;

      try {

        subItems = await window.antigravityFS.readDirEntries(dirPath);

      } catch (err) {

        console.warn('[WorkspaceTree] readDirEntries error for', dirPath, err);

        return;

      }



      if (!subItems || subItems.length === 0) {

        if (childrenContainer.children.length === 1 && childrenContainer.firstElementChild?.classList.contains('__antigravity_ws_empty')) {

          return;

        }

        childrenContainer.innerHTML = '';

        const emptyEl = document.createElement('div');

        emptyEl.className = '__antigravity_ws_item __antigravity_ws_empty';

        emptyEl.style.paddingLeft = (8 + depth * 16) + 'px';

        emptyEl.style.opacity = '0.5';

        emptyEl.innerText = '(Empty)';

        childrenContainer.appendChild(emptyEl);

        return;

      }



      const prevEmpty = childrenContainer.querySelector('.__antigravity_ws_empty');

      if (prevEmpty) prevEmpty.remove();



      const existingMap = new Map();

      for (let i = 0; i < childrenContainer.children.length; i++) {

        const node = childrenContainer.children[i];

        if (node.classList.contains('__antigravity_ws_item') && node._itemPath) {

          let subContainer = node._childrenContainer;

          if (!subContainer) {

            const next = node.nextElementSibling;

            if (next && next.classList.contains('__antigravity_ws_children')) {

              subContainer = next;

              node._childrenContainer = next;

            }

          }

          existingMap.set(node._itemPath, { itemEl: node, childrenContainer: subContainer });

        }

      }



      const newPathSet = new Set(subItems.map(it => it.path));



      for (const [path, entry] of existingMap.entries()) {

        if (!newPathSet.has(path)) {

          if (entry.childrenContainer) entry.childrenContainer.remove();

          entry.itemEl.remove();

          existingMap.delete(path);

        }

      }



      let targetIndex = 0;

      for (const item of subItems) {

        let entry = existingMap.get(item.path);

        let itemEl;

        let subChildren = null;



        if (entry) {

          itemEl = entry.itemEl;

          subChildren = entry.childrenContainer;



          const nameEl = itemEl.querySelector('.__antigravity_ws_item_name');

          if (nameEl && nameEl.innerText !== item.name) {

            nameEl.innerText = item.name;

          }



          if (!!itemEl._isDirectory !== !!item.isDirectory) {

            if (subChildren) subChildren.remove();

            const replacement = createTreeItemElement(item, depth, false);

            itemEl.replaceWith(replacement);

            itemEl = replacement;

            subChildren = null;

          }

        } else {

          itemEl = createTreeItemElement(item, depth, false);

        }



        const currentChild = childrenContainer.children[targetIndex];

        if (currentChild !== itemEl) {

          childrenContainer.insertBefore(itemEl, currentChild || null);

        }

        targetIndex++;



        if (item.isDirectory) {

          const isExpanded = !!(expandedSet && expandedSet.has(item.path));

          itemEl._isExpanded = isExpanded;

          updateFolderIcon(itemEl, isExpanded);



          if (!subChildren) {

            subChildren = document.createElement('div');

            subChildren.className = '__antigravity_ws_children';

            itemEl._childrenContainer = subChildren;

          }



          if (isExpanded) {

            subChildren.classList.remove('collapsed');

            subChildren.removeAttribute('data-collapsed');

            subChildren.style.setProperty('display', 'flex', 'important');

          } else {

            subChildren.classList.add('collapsed');

            subChildren.setAttribute('data-collapsed', 'true');

            subChildren.style.setProperty('display', 'none', 'important');

          }

          subChildren.style.flexDirection = 'column';

          subChildren.style.width = '100%';



          const currentChildrenChild = childrenContainer.children[targetIndex];

          if (currentChildrenChild !== subChildren) {

            childrenContainer.insertBefore(subChildren, currentChildrenChild || null);

          }

          targetIndex++;



          if (isExpanded) {

            await diffFolderChildren(subChildren, item.path, depth + 1, expandedSet);

          }

        }

      }

    }



    async function populateFolderChildren(childrenContainer, dirPath, depth, expandedSet) {

      return diffFolderChildren(childrenContainer, dirPath, depth, expandedSet);

    }



    async function renderTreeBranch(parentContainer, item, depth, expandedSet) {

      if (parentContainer && !(parentContainer instanceof Node)) {

        expandedSet = depth;

        depth = item;

        item = parentContainer;

        parentContainer = null;

      }

      const isExpanded = !!(expandedSet && expandedSet.has(item.path));

      const el = createTreeItemElement(item, depth, false);

      if (parentContainer) parentContainer.appendChild(el);



      if (item.isDirectory) {

        el._isExpanded = isExpanded;

        updateFolderIcon(el, isExpanded);



        const childrenContainer = document.createElement('div');

        childrenContainer.className = '__antigravity_ws_children';

        if (isExpanded) {

          childrenContainer.classList.remove('collapsed');

          childrenContainer.removeAttribute('data-collapsed');

          childrenContainer.style.setProperty('display', 'flex', 'important');

        } else {

          childrenContainer.classList.add('collapsed');

          childrenContainer.setAttribute('data-collapsed', 'true');

          childrenContainer.style.setProperty('display', 'none', 'important');

        }

        childrenContainer.style.flexDirection = 'column';

        childrenContainer.style.width = '100%';

        if (parentContainer) {

          parentContainer.appendChild(childrenContainer);

        } else if (el.parentElement) {

          el.parentElement.appendChild(childrenContainer);

        }

        el._childrenContainer = childrenContainer;



        if (isExpanded) {

          childrenContainer._isLoaded = true;

          await diffFolderChildren(childrenContainer, item.path, depth + 1, expandedSet);

        }

      }

      return el;

    }



    const createTreeBranchElement = renderTreeBranch;



    let currentWatchedRoot = null;

    let unwatchListener = null;

    let _wsChangeDebounceTimer = null;



    function ensureWorkspaceWatcher(rootPath) {

      if (!rootPath || !window.antigravityFS) return;

      if (typeof window.antigravityFS.watchWorkspace === 'function') {

        if (currentWatchedRoot !== rootPath) {

          if (currentWatchedRoot && typeof window.antigravityFS.unwatchWorkspace === 'function') {

            window.antigravityFS.unwatchWorkspace();

          }

          currentWatchedRoot = rootPath;

          window.antigravityFS.watchWorkspace(rootPath);

        }

        if (!unwatchListener && typeof window.antigravityFS.onWorkspaceChanged === 'function') {

          unwatchListener = window.antigravityFS.onWorkspaceChanged((changeData) => {

            clearTimeout(_wsChangeDebounceTimer);

            _wsChangeDebounceTimer = setTimeout(() => {

              const wsSection = document.getElementById(SECTION_ID);

              const body = wsSection?.querySelector('.__antigravity_ws_tree_body');

              if (body && currentWatchedRoot) {

                populateWorkspaceTree(body, currentWatchedRoot);

              }

            }, 300);

          });

        }

      } else {

        currentWatchedRoot = rootPath;

      }

    }



    let isCheckingChanges = false;

    async function checkDirectoryChanges(rootPath, treeBody) {

      if (!rootPath || !window.antigravityFS || typeof window.antigravityFS.readDirEntries !== 'function') return;

      if (document.hidden || isCheckingChanges) return;

      isCheckingChanges = true;

      try {

        if (treeBody) {

          await populateWorkspaceTree(treeBody, rootPath);

        }

      } catch(e) {

      } finally {

        isCheckingChanges = false;

      }

    }



    async function populateWorkspaceTree(treeBody, rootPath, preservedExpanded = null) {

      if (!treeBody) return;

      if (!window.antigravityFS || typeof window.antigravityFS.readDirEntries !== 'function') {

        if (!treeBody.innerHTML) {

          treeBody.innerHTML = `<div style="padding: 8px 12px; font-size: 12px; opacity: 0.6;">(FS bridge loading...)</div>`;

        }

        return;

      }



      window.__antigravityWsExpandedSet = window.__antigravityWsExpandedSet || new Set();

      const expandedSet = preservedExpanded || new Set(window.__antigravityWsExpandedSet);

      treeBody.querySelectorAll('.__antigravity_ws_item').forEach(it => {

        if (it._isExpanded && it._itemPath) {

          expandedSet.add(it._itemPath);

          window.__antigravityWsExpandedSet.add(it._itemPath);

        }

      });



      const folderName = rootPath.split('\\').pop() || 'Workspace';



      let rootEl = treeBody.querySelector('.__antigravity_ws_item[data-is-root="true"]');

      let rootChildren = null;



      if (rootEl && rootEl._itemPath === rootPath) {

        rootChildren = rootEl._childrenContainer || rootEl.nextElementSibling;

        const rootNameEl = rootEl.querySelector('.__antigravity_ws_item_name');

        if (rootNameEl && rootNameEl.innerText !== folderName) {

          rootNameEl.innerText = folderName;

        }

      } else {

        treeBody.innerHTML = '';

        const rootItem = {

          name: folderName,

          path: rootPath,

          isDirectory: true

        };

        rootEl = createTreeItemElement(rootItem, 0, true);

        rootEl._isExpanded = true;

        treeBody.appendChild(rootEl);



        rootChildren = document.createElement('div');

        rootChildren.className = '__antigravity_ws_children';

        rootChildren._isLoaded = true;

        treeBody.appendChild(rootChildren);

        rootEl._childrenContainer = rootChildren;

      }



      if (rootChildren) {

        await diffFolderChildren(rootChildren, rootPath, 1, expandedSet);

      }



      ensureWorkspaceWatcher(rootPath);

    }



    // The native tab bar uses italic titles for disposable preview tabs.
    // Pin file tabs through its own double-click action so opening another
    // document never replaces an earlier Markdown, PDF, or Office tab.
    function pinFilePreviewTabs() {
      for (const tab of document.querySelectorAll('[data-tab-id]')) {
        const id = tab.getAttribute('data-tab-id') || '';
        if (!/^(file__|artifact__)/.test(id) ||
            !tab.querySelector('.agy-aux-tab-title.italic')) continue;
        tab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
      }
    }

    function healBrokenTabs() {
      // POSIX file:///Users/... is valid on macOS. The Windows drive repair
      // would close this tab and reopen a nonexistent /c:/Users/... path.
      if (/Mac/i.test(navigator.platform + ' ' + navigator.userAgent)) return;







      const tabButtons = document.querySelectorAll('[data-tab-id]');







      for (const btn of tabButtons) {







        const tabId = btn.getAttribute('data-tab-id') || '';







        if (tabId.startsWith('file__file:///')) {







          const pathPart = tabId.slice('file__file:///'.length);







          const hasDrive = /^[a-zA-Z](%3A|:)\//i.test(pathPart);







          if (!hasDrive) {







            const wsUri = getActiveWorkspaceUri();







            const driveMatch = wsUri && wsUri.match(/file:\/\/\/([a-zA-Z])(%3A|:)/i);







            const driveLetter = driveMatch ? driveMatch[1].toLowerCase() : 'c';







            







            let cleanPath = decodeURIComponent(pathPart.replace(/^\/+/, '').replace(/^\\+/, ''));







            const canonicalUri = `file:///${driveLetter}%3A/${cleanPath.split(/[\\/]/).filter(Boolean).map(encodeURIComponent).join('/')}`;







            







            const closeBtn = btn.querySelector('button, [aria-label*="close" i], svg')?.closest('[role="button"], button') || btn.querySelector('button, [aria-label*="close" i], svg');







            if (closeBtn) {







              closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));







            }







            







            const openFn = (ToolkitCore && ToolkitCore.getOpenFileFn) ? ToolkitCore.getOpenFileFn() : getOpenFileFn();







            if (openFn) {







              openFn(canonicalUri);







            }







          } else if (tabId.includes('% ') || tabId.includes('%25 ')) {







            // Malformed percent-encoded space in tab ID (e.g. "heat% source")







            const rawUri = tabId.slice('file__'.length);







            const cleanUri = rawUri.replace(/% /g, '%20').replace(/%2520/g, '%20');







            const closeBtn = btn.querySelector('button, [aria-label*="close" i], svg')?.closest('[role="button"], button') || btn.querySelector('button, [aria-label*="close" i], svg');







            if (closeBtn) {







              closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));







            }







            const openFn = (ToolkitCore && ToolkitCore.getOpenFileFn) ? ToolkitCore.getOpenFileFn() : getOpenFileFn();







            if (openFn) {







              openFn(cleanUri);







              ToolkitCore.showToast('✓ 已自动修复并加载异常标签页');







            }







          }







        }







      }







    }







    function canEnhanceWorkspace() {

      // A draft project selection on the home page is not an open conversation.

      if (!/^\/c\/[^/]+/.test(location.pathname)) return false;

      return !(window.__antigravityEnhancerProfile?.nativeWorkspaceTree &&

        document.querySelector('[data-testid="tab-file-tree-sidebar"]'));

    }



    function removeWorkspaceUI() {

      document.getElementById(DOCK_ID)?.remove();

      document.getElementById(SECTION_ID)?.remove();

      clearTimeout(_wsChangeDebounceTimer);

      if (unwatchListener) { try { unwatchListener(); } catch (_) {} unwatchListener = null; }

      if (currentWatchedRoot) {

        try { Promise.resolve(window.antigravityFS?.unwatchWorkspace?.()).catch(() => {}); } catch (_) {}

        currentWatchedRoot = null;

      }

    }



        // Helper to auto-collapse native Artifacts sidebar drawer by default in v2.29

    function ensureArtifactSidebarDefaultCollapsed() {

      try {

        const fileRow = document.querySelector('.group\\/file-row, [class*="group/file-row"]');

        const artifactToggle = fileRow?.querySelector('[data-testid="sidebar-toggle"]');

        if (artifactToggle) {

          if (!artifactToggle.__antigravityTracked) {

            artifactToggle.__antigravityTracked = true;

            artifactToggle.addEventListener('click', (e) => {

              if (e.isTrusted) {

                // Genuine user interaction: record explicit user choice for this session

                const wasExpanded = artifactToggle.getAttribute('aria-expanded') === 'true';

                const nextState = !wasExpanded;

                try {

                  sessionStorage.setItem('__antigravity_artifacts_sidebar_user_expanded', nextState ? 'true' : 'false');

                } catch (_) {}

              }

            }, true);

          }



          let userExpanded = false;

          try {

            userExpanded = sessionStorage.getItem('__antigravity_artifacts_sidebar_user_expanded') === 'true';

          } catch (_) {}



          if (!userExpanded && artifactToggle.getAttribute('aria-expanded') === 'true') {

            artifactToggle.click();

          }

        }

      } catch (_) {}

    }



    function updateSidebar() {
      pinFilePreviewTabs();

      if (!canEnhanceWorkspace()) {

        removeWorkspaceUI();

        return;

      }

      // 0. Automatically heal any broken tabs missing drive letters

      try {

        healBrokenTabs();

      } catch(e) {}



      // 0.1 Auto-collapse native Artifacts sidebar drawer by default in v2.29

      ensureArtifactSidebarDefaultCollapsed();



      // 1. Discover sidebar containers in the right auxiliary pane

      const nativeSidebar = document.querySelector('[data-testid="tab-file-tree-sidebar"]');

      const sidebarScope = document.querySelector('[data-aux-pane-focus-scope="true"], [data-side-panel-focus-scope="true"], [data-testid="overview-panel-host"]');

      const sidebars = sidebarScope ? Array.from(sidebarScope.querySelectorAll('.overflow-y-auto.h-full.bg-background, [data-testid="tab-file-tree-sidebar"]')) : [];

      let artifactSidebar = null;

      for (const sb of sidebars) {

        const hasArt = sb.querySelector('.__antigravity_art_label') || (sb.textContent || '').includes('Artifacts');

        if (hasArt) {

          artifactSidebar = sb;

          break;

        }

      }



      // Check Aux pane visibility

      // In 2.29 agy-sheet is the whole desktop, including noninteractive overlays.

      const aux = document.querySelector('[data-aux-pane-focus-scope="true"], [data-side-panel-focus-scope="true"]');

      const auxBody = aux?.children?.[1];

      const isAuxVisible = Boolean(aux && aux.offsetWidth > 100);



      // Case A: Native workspace tree is already present (data-testid="tab-file-tree-sidebar" without Artifacts)

      if (nativeSidebar && !artifactSidebar) {

        const dock = document.getElementById(DOCK_ID);

        if (dock) dock.remove();

        if (auxBody) {

          auxBody.style.display = '';

          auxBody.style.flexDirection = '';

        }

        const existingSection = document.getElementById(SECTION_ID);

        if (existingSection) existingSection.remove();



        // 1. Check if we are inside a project

        let sectionId = '';

        try {

          const url = new URL(window.location.href);

          sectionId = (url.searchParams.get('project') || url.searchParams.get('section')) || '';

        } catch (e) {}



        const isProject = Boolean(sectionId && sectionId !== 'outside-of-project');



        if (isProject) {

          // Enforce official project configuration from projects/<projectId>.json

          let officialUri = window.sessionStorage?.getItem('__antigravity_proj_ws_' + sectionId) ||

                            window.__antigravityProjectFolderCache?.[sectionId];



          if (officialUri) {

            window.__antigravityCurrentWorkspaceUri = officialUri;

            try { window.localStorage.setItem('__antigravity_last_workspace_uri', officialUri); } catch (e) {}

            const nativeRootPath = ToolkitCore.uriToWindowsPath(officialUri);

            if (nativeRootPath) {

              ensureWorkspaceWatcher(nativeRootPath);

              checkDirectoryChanges(nativeRootPath, null);

            }

          } else if (window.antigravityFS && typeof window.antigravityFS.readFileText === 'function') {

            const projJsonPath = `C:\\Users\\HIT\\.gemini\\config\\projects\\${sectionId}.json`;

            window.antigravityFS.readFileText(projJsonPath).then(text => {

              if (text) {

                try {

                  const projData = JSON.parse(text);

                  const folderUri = projData.projectResources?.resources?.[0]?.folderUri;

                  if (folderUri) {

                    if (!window.__antigravityProjectFolderCache) window.__antigravityProjectFolderCache = {};

                    window.__antigravityProjectFolderCache[sectionId] = folderUri;

                    window.sessionStorage?.setItem('__antigravity_proj_ws_' + sectionId, folderUri);

                    window.__antigravityCurrentWorkspaceUri = folderUri;

                    try { window.localStorage.setItem('__antigravity_last_workspace_uri', folderUri); } catch (e) {}

                    const nativeRootPath = ToolkitCore.uriToWindowsPath(folderUri);

                    if (nativeRootPath) {

                      ensureWorkspaceWatcher(nativeRootPath);

                      checkDirectoryChanges(nativeRootPath, null);

                    }

                  }

                } catch (pe) {}

              }

            }).catch(() => {});

          }



          // In project mode: dynamically heal stale DOM treeitem labels if present

          try {

            const treeItems = document.querySelectorAll('[role="treeitem"]');

            for (const item of treeItems) {

              const itemUri = item.getAttribute('data-uri') || '';

              if (itemUri.includes('%E6%8A%A5%E9%94%80%E7%9B%B8%E5%85%B3')) {

                const fixedUri = itemUri.replace(/%E6%8A%A5%E9%94%80%E7%9B%B8%E5%85%B3/g, '%E5%9B%A2%E9%98%9F%E8%B4%A2%E5%8A%A1%E7%9B%B8%E5%85%B3');

                item.setAttribute('data-uri', fixedUri);

              }

              const labelEl = item.querySelector('.truncate, span');

              if (labelEl && labelEl.innerText.trim() === '报销相关') {

                labelEl.innerText = '团队财务相关';

              } else if (item.innerText && item.innerText.trim() === '报销相关') {

                item.innerText = '团队财务相关';

              }

            }

          } catch(e) {}



          return;

        }



        // 2. Only when NOT in a project: while native tree is visible, silently learn the active workspace URI

        const nativeTreeItem = document.querySelector('[role="treeitem"]');

        if (nativeTreeItem) {

          const uri = nativeTreeItem.getAttribute('data-uri') || '';

          if (uri && !uri.includes('/brain/')) {

            const wsRoot = resolveWorkspaceRootUri(uri);

            if (wsRoot) {

              window.__antigravityCurrentWorkspaceUri = wsRoot;

              try { window.localStorage.setItem('__antigravity_last_workspace_uri', wsRoot); } catch(e) {}

              const nativeRootPath = ToolkitCore.uriToWindowsPath(wsRoot);

              if (nativeRootPath) {

                ensureWorkspaceWatcher(nativeRootPath);

                checkDirectoryChanges(nativeRootPath, null);

              }

            }

          }

        }

        return;

      }



      // Determine targetContainer for our Workspace section:

      let targetContainer = null;



      if (artifactSidebar) {

        // Case B: In Artifact view -> attach inside artifactSidebar

        const dock = document.getElementById(DOCK_ID);

        if (dock) dock.remove();

        if (auxBody) {

          auxBody.style.display = '';

          auxBody.style.flexDirection = '';

        }

        targetContainer = artifactSidebar;



        // Accordionize the native Artifacts header (Default Collapsed, Zero Height Truncation)

        const artHeader = Array.from(artifactSidebar.children).find(c => {

          const t = (c.textContent || '').trim();

          return t === 'Artifacts' || t.startsWith('Artifacts') || c.querySelector?.('.__antigravity_art_label');

        });



        if (artHeader) {

          if (!artHeader.__antigravityAccordionized) {

            artHeader.__antigravityAccordionized = true;

            artHeader.__antigravityIsCollapsed = true; // DEFAULT COLLAPSED!

            artHeader.style.cursor = 'pointer';

            artHeader.style.userSelect = 'none';

            artHeader.style.display = 'flex';

            artHeader.style.alignItems = 'center';

            artHeader.style.justifyContent = 'space-between';

            artHeader.style.padding = '6px 12px';

            artHeader.style.fontSize = '13px';

            artHeader.style.fontWeight = '500';

            artHeader.style.color = 'var(--muted-foreground, #71717a)';

            artHeader.style.borderRadius = '6px';

            artHeader.style.margin = '4px 4px';

            artHeader.innerHTML = `

              <div style="display: flex; align-items: center; gap: 6px;">

                <span class="__antigravity_art_label" style="font-size: 13px; font-weight: 500; color: var(--muted-foreground, #71717a);">Artifacts</span>

                <svg class="__antigravity_art_chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.15s ease; color: var(--muted-foreground, #71717a); transform: rotate(-90deg);">

                  <polyline points="6 9 12 15 18 9"></polyline>

                </svg>

              </div>

            `;

            artHeader.onclick = () => {

              artHeader.__antigravityIsCollapsed = !artHeader.__antigravityIsCollapsed;

              const chevron = artHeader.querySelector('.__antigravity_art_chevron');

              if (chevron) {

                chevron.style.transform = artHeader.__antigravityIsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';

              }

              const container = artHeader.nextElementSibling;

              if (container && container !== document.getElementById(SECTION_ID)) {

                container.style.display = artHeader.__antigravityIsCollapsed ? 'none' : '';

                container.style.maxHeight = '';

                container.style.overflowY = '';

              }

            };

          }



          // Keep clean state: no nested scrollbars or max-height cutoffs when expanded

          const itemsContainer = artHeader.nextElementSibling;

          if (itemsContainer && itemsContainer !== document.getElementById(SECTION_ID)) {

            if (artHeader.__antigravityIsCollapsed) {

              itemsContainer.style.display = 'none';

            } else {

              itemsContainer.style.display = '';

              if (itemsContainer.style.maxHeight) itemsContainer.style.maxHeight = '';

              if (itemsContainer.style.overflowY) itemsContainer.style.overflowY = '';

            }

          }

        }

      } else if (isAuxVisible && auxBody) {

        // Case C: In newTab__empty or non-artifact Aux view -> attach to dedicated right dock!

        auxBody.style.display = 'flex';

        auxBody.style.flexDirection = 'row';



        const mainContent = Array.from(auxBody.children).find(c => c.id !== DOCK_ID);

        if (mainContent) {

          mainContent.style.flex = '1 1 0%';

          mainContent.style.minWidth = '0';

          mainContent.style.height = '100%';

          mainContent.style.order = '1';

        }



        let dock = document.getElementById(DOCK_ID);

        if (!dock) {

          dock = document.createElement('div');

          dock.id = DOCK_ID;

          dock.className = '__antigravity_aux_dock';

          dock.style.order = '9999';



          // Resizer handle on left border

          const resizer = document.createElement('div');

          resizer.className = '__antigravity_aux_dock_resizer';

          dock.appendChild(resizer);



          let isResizing = false;

          let startX = 0;

          let startW = 0;

          resizer.onmousedown = (e) => {

            isResizing = true;

            startX = e.clientX;

            startW = dock.offsetWidth;

            resizer.classList.add('resizing');

            document.body.style.cursor = 'ew-resize';

            document.body.style.userSelect = 'none';



            const onMouseMove = (ev) => {

              if (!isResizing) return;

              const delta = startX - ev.clientX;

              const nextW = Math.max(220, Math.min(650, startW + delta));

              dock.style.width = nextW + 'px';

              try { localStorage.setItem('__antigravity_aux_dock_width', nextW + 'px'); } catch (err) {}

            };



            const onMouseUp = () => {

              isResizing = false;

              resizer.classList.remove('resizing');

              document.body.style.cursor = '';

              document.body.style.userSelect = '';

              window.removeEventListener('mousemove', onMouseMove);

              window.removeEventListener('mouseup', onMouseUp);

            };



            window.addEventListener('mousemove', onMouseMove);

            window.addEventListener('mouseup', onMouseUp);

          };



          const savedW = localStorage.getItem('__antigravity_aux_dock_width');

          if (savedW) dock.style.width = savedW;



          auxBody.appendChild(dock);

        } else {

          dock.style.order = '9999';

          if (auxBody.lastElementChild !== dock) {

            auxBody.appendChild(dock);

          }

        }



        targetContainer = dock;



        // Inject Workspace Quick Action Button in overview panel if present

        try {

          const openFileBtn = auxBody.querySelector('[data-testid="new-tab-card-open-file"]');

          if (openFileBtn && !auxBody.querySelector('#__antigravity_btn_workspace')) {

            const wsBtn = document.createElement('button');

            wsBtn.type = 'button';

            wsBtn.id = '__antigravity_btn_workspace';

            wsBtn.className = openFileBtn.className;

            wsBtn.innerHTML = `

              <span class="shrink-0 flex items-center">

                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor" class="text-secondary-foreground shrink-0">

                  <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"></path>

                </svg>

              </span>

              <span class="whitespace-nowrap truncate font-normal">Workspace (工作区)</span>

            `

            wsBtn.onclick = () => {

              const d = document.getElementById(DOCK_ID);

              if (d) {

                d.scrollIntoView({ behavior: 'smooth' });

                d.style.transition = 'box-shadow 0.3s ease';

                d.style.boxShadow = 'inset 0 0 0 2px var(--primary, #3b82f6)';

                setTimeout(() => { d.style.boxShadow = ''; }, 1200);

              }

            };

            openFileBtn.after(wsBtn);

          }

        } catch (e) {}

      }



      if (!targetContainer) {

        return;

      }



      // 3. Discover active workspace URI

      let wsUri = getActiveWorkspaceUri();

      if (!wsUri) {

        // Fallback 1: scan sessionStorage for any project workspace

        try {

          for (let i = 0; i < sessionStorage.length; i++) {

            const k = sessionStorage.key(i);

            if (k && k.startsWith('__antigravity_proj_ws_')) {

              const val = sessionStorage.getItem(k);

              if (val && !val.includes('/brain/')) {

                wsUri = val;

                break;

              }

            }

          }

        } catch (e) {}



        // Fallback 2: scan window.__antigravityProjectFolderCache

        if (!wsUri && window.__antigravityProjectFolderCache) {

          const vals = Object.values(window.__antigravityProjectFolderCache);

          if (vals.length > 0 && vals[0]) wsUri = vals[0];

        }

      }



      if (!wsUri) {

        // Zero-blank: Render Onyx-styled empty state rather than leaving blank white void!

        if (targetContainer) {

          targetContainer.innerHTML = `

            <div class="h-full w-full flex flex-col items-center justify-center p-6 text-center select-none" style="font-family: inherit;">

              <div class="p-3 rounded-full bg-secondary text-muted-foreground mb-3">

                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 -960 960 960" fill="currentColor">

                  <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"></path>

                </svg>

              </div>

              <div class="text-sm font-medium text-foreground mb-1">未关联工程工作区</div>

              <div class="text-xs text-muted-foreground mb-4 max-w-[200px]">可在左侧切换到工程，或直接选择工作区目录</div>

              <button type="button" class="__antigravity_btn_open_folder agy-button px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-muted cursor-pointer border-none outline-none transition-colors">

                📁 打开文件夹 (Open Folder)

              </button>

            </div>

          `;

          const openBtn = targetContainer.querySelector('.__antigravity_btn_open_folder');

          if (openBtn) {

            openBtn.onclick = () => {

              const openFn = (ToolkitCore && ToolkitCore.getOpenFileFn) ? ToolkitCore.getOpenFileFn() : getOpenFileFn();

              if (openFn) openFn('');

              else {

                const of = document.querySelector('[data-testid="new-tab-card-open-file"]');

                if (of) of.click();

              }

            };

          }

        }

        return;

      }



      const rootPath = ToolkitCore.uriToWindowsPath(wsUri);

      let wsSection = document.getElementById(SECTION_ID);

      const isRootChanged = wsSection && wsSection._currentRootPath && wsSection._currentRootPath !== rootPath;



      if (!wsSection) {

        wsSection = document.createElement('div');

        wsSection.id = SECTION_ID;

        wsSection._currentRootPath = rootPath;

        wsSection.innerHTML = `

          <div class="__antigravity_ws_header">

            <div class="__antigravity_ws_header_left" title="Workspace">

              <span class="__antigravity_ws_title">Workspace</span>

              <svg class="__antigravity_ws_chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 -960 960 960" fill="currentColor">

                <path d="M517.85-480l-184-184L376-706.15L602.15-480L376-253.85L333.85-296l184-184Z"></path>

              </svg>

            </div>

            <div class="__antigravity_ws_header_right">

              <button class="__antigravity_ws_refresh_btn" title="Refresh Workspace Tree" type="button">

                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 -960 960 960" fill="currentColor">

                  <path d="M481.54-180q-125.62,0-212.81-87.17T181.54-479.94t87.19-212.83T481.54-780q70.15,0 132.77,31.19t104.15,88.04V-780h60v244.61H533.85v-60h158q-31.62-57.92-87.69-91.27T481.54-720q-100,0-170,70t-70,170t70,170t170,70q77,0 139-44t87-116h63.23Q743.54-302.08 663.5-241.04T481.54-180Z"></path>

                </svg>

              </button>

            </div>

          </div>

          <div class="__antigravity_ws_tree_body"></div>

        `



        const header = wsSection.querySelector('.__antigravity_ws_header');

        const chevron = wsSection.querySelector('.__antigravity_ws_chevron');

        const treeBody = wsSection.querySelector('.__antigravity_ws_tree_body');

        const refreshBtn = wsSection.querySelector('.__antigravity_ws_refresh_btn');



        let isCollapsed = false;

        header.onclick = (e) => {

          if (e.target.closest('.__antigravity_ws_refresh_btn')) return;

          isCollapsed = !isCollapsed;

          chevron.classList.toggle('collapsed', isCollapsed);

          treeBody.style.display = isCollapsed ? 'none' : 'block';

        };



        refreshBtn.onclick = async (e) => {

          e.stopPropagation();

          try {

            const url = new URL(window.location.href);

            const convId = url.pathname.split('/c/')[1]?.split('?')[0] || '';

            const sectionId = (url.searchParams.get('project') || url.searchParams.get('section')) || '';

            if (sectionId) window.sessionStorage?.removeItem('__antigravity_proj_ws_' + sectionId);

            if (convId) window.sessionStorage?.removeItem('__antigravity_conv_ws_' + convId);

            delete window.__antigravityCurrentWorkspaceUri;

          } catch(err) {}

          await syncAuthoritativeWorkspace(true);

          if (treeBody && rootPath) {

            await populateWorkspaceTree(treeBody, rootPath);

          }

        };



        targetContainer.appendChild(wsSection);

        if (rootPath) {

          populateWorkspaceTree(treeBody, rootPath);

        }

      } else {

        if (wsSection.parentElement !== targetContainer) {

          targetContainer.appendChild(wsSection);

        } else if (targetContainer.lastElementChild !== wsSection) {

          targetContainer.appendChild(wsSection);

        }



        const treeBody = wsSection.querySelector('.__antigravity_ws_tree_body');

        if (isRootChanged) {

          wsSection._currentRootPath = rootPath;

          if (treeBody && rootPath) {

            populateWorkspaceTree(treeBody, rootPath);

          }

        } else if (treeBody && rootPath && (!treeBody.children || treeBody.children.length === 0)) {

          populateWorkspaceTree(treeBody, rootPath);

        }

      }

    }

    ensureStyle();







    // Asynchronously resolve authoritative workspace for the active project / conversation







    let lastCheckedUrl = '';







    async function syncAuthoritativeWorkspace(force = false) {

      if (!canEnhanceWorkspace()) { removeWorkspaceUI(); return; }







      try {







        const curUrl = window.location.href;







        if (!force && curUrl === lastCheckedUrl && window.__antigravityCurrentWorkspaceUri) return;







        lastCheckedUrl = curUrl;







        const url = new URL(curUrl);







        const convId = url.pathname.split('/c/')[1]?.split('?')[0] || '';







        const sectionId = (url.searchParams.get('project') || url.searchParams.get('section')) || '';







        // 1. If in a Project: read official native project config directly via fs bridge



        if (sectionId && sectionId !== 'outside-of-project') {







          let folderUri = null;







          try {







            const projJsonPath = `C:\\Users\\HIT\\.gemini\\config\\projects\\${sectionId}.json`;







            const text = await window.antigravityFS?.readFileText(projJsonPath);







            if (text) {







              const projData = JSON.parse(text);







              folderUri = projData.projectResources?.resources?.[0]?.folderUri || null;







            }







          } catch(e) {}







          // Fallback to projects_workspace_map.json only if native file missing



          if (!folderUri) {







            try {







              const mapText = await window.antigravityFS?.readFileText('C:\\Users\\HIT\\.gemini\\antigravity\\projects_workspace_map.json');







              if (mapText) {







                const map = JSON.parse(mapText);







                if (map && map[sectionId]) folderUri = map[sectionId];







              }







            } catch(e) {}







          }







          if (window.location.href !== curUrl || !canEnhanceWorkspace()) return;

          if (folderUri) {







            const oldCached = window.sessionStorage?.getItem('__antigravity_proj_ws_' + sectionId);







            if (oldCached && oldCached !== folderUri) {







              window.sessionStorage?.removeItem('__antigravity_proj_ws_' + sectionId);







            }







            window.__antigravityCurrentWorkspaceUri = folderUri;







            window.sessionStorage?.setItem('__antigravity_proj_ws_' + sectionId, folderUri);







            updateSidebar();







            return;







          }







        }







        // 2. Query getConversationWorkspace IPC if available



        if (window.antigravityFS && typeof window.antigravityFS.getConversationWorkspace === 'function') {







          const res = await window.antigravityFS.getConversationWorkspace(convId, sectionId);







          if (window.location.href !== curUrl || !canEnhanceWorkspace()) return;

          if (res && res.workspaceUri) {







            window.__antigravityCurrentWorkspaceUri = res.workspaceUri;







            if (res.isProject && res.projectId) {







              const oldCached = window.sessionStorage?.getItem('__antigravity_proj_ws_' + res.projectId);







              if (oldCached && oldCached !== res.workspaceUri) {







                window.sessionStorage?.removeItem('__antigravity_proj_ws_' + res.projectId);







              }







              window.sessionStorage?.setItem('__antigravity_proj_ws_' + res.projectId, res.workspaceUri);







            } else if (convId) {







              window.sessionStorage?.setItem('__antigravity_conv_ws_' + convId, res.workspaceUri);







            }







            updateSidebar();







            return;







          }







        }







        // 3. Outside of project: resolve workspace from delivered files in open tabs







        if (sectionId === 'outside-of-project' || !sectionId) {







          const openTabs = Array.from(document.querySelectorAll('[data-tab-id]'));







          for (const t of openTabs) {







            const tid = t.getAttribute('data-tab-id') || '';







            if (tid.includes('file://') && !tid.includes('/brain/')) {







              const rawUri = tid.replace(/^file__/, '');







              const ws = ToolkitCore.resolveWorkspaceRootUri(rawUri);







              if (ws) {







                window.__antigravityCurrentWorkspaceUri = ws;







                if (convId) window.sessionStorage?.setItem('__antigravity_conv_ws_' + convId, ws);







                updateSidebar();







                return;







              }







            }







          }







        }







      } catch(e) {}







    }







    const checkRouteChange = () => {

      ensureArtifactSidebarDefaultCollapsed();







      if (window.location.href !== lastCheckedUrl) {







        window.__antigravityCurrentWorkspaceUri = null;







        syncAuthoritativeWorkspace();







      }







    };







    window.addEventListener('popstate', checkRouteChange);







    window.addEventListener('hashchange', checkRouteChange);







    // Initial sync







    syncAuthoritativeWorkspace();







    let _clickDebounceTimer = null;

    const onUserInteraction = () => {

      ensureArtifactSidebarDefaultCollapsed();

      clearTimeout(_clickDebounceTimer);

      _clickDebounceTimer = setTimeout(() => {

        checkRouteChange();

        updateSidebar();

      }, 150);

    };

    document.addEventListener('click', onUserInteraction, { passive: true });



    // Initial sync

    syncAuthoritativeWorkspace();



    // Relaxed lightweight fallback timer (2000ms) - no forced reflow, no fs polling

    const timer = setInterval(() => {

      try {

        checkRouteChange();

        updateSidebar();

      } catch (err) {}

    }, 2000);



    const onWindowFocus = () => {

      if (!canEnhanceWorkspace()) { removeWorkspaceUI(); return; }

      const wsSection = document.getElementById(SECTION_ID);

      const body = wsSection?.querySelector('.__antigravity_ws_tree_body');

      if (body && currentWatchedRoot) {

        populateWorkspaceTree(body, currentWatchedRoot);

      }

      syncAuthoritativeWorkspace();

    };



    window.addEventListener('focus', onWindowFocus);



    return () => {

      clearInterval(timer);

      clearTimeout(_clickDebounceTimer);

      clearTimeout(_wsChangeDebounceTimer);

      document.removeEventListener('click', onUserInteraction);

      window.removeEventListener('focus', onWindowFocus);

      window.removeEventListener('popstate', checkRouteChange);

      window.removeEventListener('hashchange', checkRouteChange);



      if (unwatchListener) {

        try { unwatchListener(); } catch(e) {}

        unwatchListener = null;

      }



      if (currentWatchedRoot && window.antigravityFS?.unwatchWorkspace) {

        try { window.antigravityFS.unwatchWorkspace(); } catch(e) {}

        currentWatchedRoot = null;

      }



      const ws = document.getElementById(SECTION_ID);

      if (ws) ws.remove();

      document.getElementById(DOCK_ID)?.remove();



      const st = document.getElementById(STYLE_ID);

      if (st) st.remove();

    };



  }



  // =========================================================================







  // Feature 8: Academic Image Viewer Photoshop Zoom & Pan Engine







  // =========================================================================







  function initImageViewerEnhancer() {

    if (window.__antigravityEnhancerProfile?.imageViewer === false) return () => {};







    const HUD_ID = '__antigravity_img_hud';







    const STYLE_ID = '__antigravity_img_viewer_style';







    // Chat's full-screen media dialog has its own React zoom/pan controller.



    // Forward extra gestures to that controller, keeping its toolbar in sync.



    const forwardedModalEvents = new WeakSet();



    let modalSpacePressed = false;



    let modalDrag = null;



    function modalImageFor(target) {



      return target instanceof Element ? target.closest('[data-testid="media-modal-stage"]')?.querySelector('img[data-testid="media-modal-image"]') : null;



    }



    function forwardModalPointer(img, type, x, y, pointerId = 1) {



      const event = new PointerEvent(type, { bubbles: true, cancelable: true, button: 0,



        buttons: type === 'pointerup' ? 0 : 1, pointerId, pointerType: 'mouse', clientX: x, clientY: y });



      forwardedModalEvents.add(event);



      img.dispatchEvent(event);



    }



    function modalIsZoomed(img) {



      const matrix = new DOMMatrixReadOnly(window.getComputedStyle(img).transform);



      return Math.hypot(matrix.a, matrix.b) > 1.001;



    }



    function onModalWheel(e) {



      const img = modalImageFor(e.target);



      if (!img || forwardedModalEvents.has(e)) return;



      // Ctrl/Meta wheel already belongs to the native controller.



      if (!e.shiftKey && (e.ctrlKey || e.metaKey)) return;



      e.preventDefault();



      e.stopImmediatePropagation();



      if (e.shiftKey) {



        if (!modalIsZoomed(img)) return;



        const rect = img.getBoundingClientRect();



        const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;



        forwardModalPointer(img, 'pointerdown', x, y);



        forwardModalPointer(img, 'pointermove', x - (e.deltaY || e.deltaX), y);



        forwardModalPointer(img, 'pointerup', x - (e.deltaY || e.deltaX), y);



      } else {



        const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true,



          deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY });



        forwardedModalEvents.add(wheel);



        img.closest('[data-testid="media-modal-stage"]').dispatchEvent(wheel);



      }



    }



    function onModalPointerDown(e) {



      if (forwardedModalEvents.has(e)) return;



      const img = modalImageFor(e.target);



      if (!img || !modalIsZoomed(img) || !(e.button === 1 || (e.button === 0 && modalSpacePressed))) return;



      e.preventDefault();



      e.stopImmediatePropagation();



      modalDrag = { img, pointerId: e.pointerId };



      forwardModalPointer(img, 'pointerdown', e.clientX, e.clientY, e.pointerId);



    }



    function onModalPointerMove(e) {



      if (!modalDrag || forwardedModalEvents.has(e) || e.pointerId !== modalDrag.pointerId) return;



      e.preventDefault();



      e.stopImmediatePropagation();



      if (modalDrag.img.isConnected) forwardModalPointer(modalDrag.img, 'pointermove', e.clientX, e.clientY, e.pointerId);



      else modalDrag = null;



    }



    function onModalPointerUp(e) {



      if (!modalDrag || forwardedModalEvents.has(e) || e.pointerId !== modalDrag.pointerId) return;



      e.preventDefault();



      e.stopImmediatePropagation();



      forwardModalPointer(modalDrag.img, 'pointerup', e.clientX, e.clientY, e.pointerId);



      modalDrag = null;



    }



    function onModalKey(e) {



      if (e.code !== 'Space') return;



      if (e.type === 'keyup') { modalSpacePressed = false; return; }



      const target = document.activeElement;



      if (!document.querySelector('[data-testid="media-modal-image"]') || target?.matches('input, textarea') || target?.isContentEditable) return;



      modalSpacePressed = true;



      e.preventDefault();



    }



    function onModalBlur() {



      modalSpacePressed = false;



      if (modalDrag) {



        const { img, pointerId } = modalDrag;



        modalDrag = null;



        if (img.isConnected) forwardModalPointer(img, 'pointerup', 0, 0, pointerId);



        if (img.hasPointerCapture(pointerId)) img.releasePointerCapture(pointerId);



      }



    }



    document.addEventListener('wheel', onModalWheel, { capture: true, passive: false });



    document.addEventListener('pointerdown', onModalPointerDown, true);



    document.addEventListener('pointermove', onModalPointerMove, true);



    document.addEventListener('pointerup', onModalPointerUp, true);



    document.addEventListener('pointercancel', onModalPointerUp, true);



    window.addEventListener('keydown', onModalKey);



    window.addEventListener('keyup', onModalKey);



    window.addEventListener('blur', onModalBlur);







    function ensureStyle() {







      let styleEl = document.getElementById(STYLE_ID);







      if (!styleEl) {







        styleEl = document.createElement('style');







        styleEl.id = STYLE_ID;







        styleEl.textContent = `







          #__antigravity_img_hud {







            position: absolute;







            right: 24px;







            bottom: 24px;







            z-index: 50;







            display: inline-flex;







            align-items: center;







            gap: 5px;







            padding: 5px 10px;







            border-radius: 20px;







            background: var(--card, #ffffff);







            color: var(--card-foreground, #0f172a);







            border: 1px solid var(--border, rgba(0, 0, 0, 0.08));







            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05);







            backdrop-filter: blur(16px);







            -webkit-backdrop-filter: blur(16px);







            font-size: 12px;







            font-family: inherit;







            user-select: none;







            transition: opacity 0.2s ease, transform 0.2s ease;







          }







          #__antigravity_img_hud button {







            display: inline-flex;







            align-items: center;







            justify-content: center;







            height: 24px;







            padding: 0 7px;







            border-radius: 12px;







            border: none;







            background: transparent;







            color: inherit;







            cursor: pointer;







            font-size: 11px;







            font-weight: 500;







            transition: background 0.15s ease, color 0.15s ease;







          }







          #__antigravity_img_hud button:hover {







            background: var(--muted, rgba(0, 0, 0, 0.06));







          }







          #__antigravity_img_hud button:active {







            transform: scale(0.96);







          }







          .__antigravity_img_zoom_label {







            font-size: 11px;







            font-weight: 600;







            min-width: 44px;







            text-align: center;







            color: var(--primary, #3b82f6);







            cursor: pointer;







          }







          .__antigravity_hud_divider {







            width: 1px;







            height: 14px;







            background: var(--border, rgba(0, 0, 0, 0.1));







            margin: 0 1px;







          }







          .__antigravity_pan_ready, .__antigravity_pan_ready * {







            cursor: grab !important;







          }







          .__antigravity_panning, .__antigravity_panning * {







            cursor: grabbing !important;







            user-select: none !important;







          }







          .__antigravity_img_wrapper_zoomed {







            min-width: 100% !important;







            width: max-content !important;







          }







          .__antigravity_img_scroll_container,



          .overlay-scrollbars .__antigravity_img_scroll_container {



            scrollbar-width: thin !important;



            scrollbar-color: var(--muted-foreground, rgba(140, 140, 140, 0.45)) transparent !important;



            overflow: auto !important;



          }







          .__antigravity_img_scroll_container::-webkit-scrollbar,



          .overlay-scrollbars .__antigravity_img_scroll_container::-webkit-scrollbar {



            width: 10px !important;



            height: 10px !important;



            display: block !important;



          }







          .__antigravity_img_scroll_container::-webkit-scrollbar-track,



          .overlay-scrollbars .__antigravity_img_scroll_container::-webkit-scrollbar-track {



            background: transparent !important;



          }







          .__antigravity_img_scroll_container::-webkit-scrollbar-thumb,



          .overlay-scrollbars .__antigravity_img_scroll_container::-webkit-scrollbar-thumb {



            background-color: var(--muted-foreground, rgba(140, 140, 140, 0.4)) !important;



            border-radius: 9999px !important;



            border: 2px solid transparent !important;



            background-clip: content-box !important;



          }







          .__antigravity_img_scroll_container::-webkit-scrollbar-thumb:hover,



          .overlay-scrollbars .__antigravity_img_scroll_container::-webkit-scrollbar-thumb:hover {



            background-color: var(--foreground, rgba(140, 140, 140, 0.75)) !important;



            background-clip: content-box !important;



          }







          .__antigravity_img_scroll_container::-webkit-scrollbar-corner,



          .overlay-scrollbars .__antigravity_img_scroll_container::-webkit-scrollbar-corner {



            background: transparent !important;



          }







        `;







        document.head.appendChild(styleEl);







      }







    }







    let activeImg = null;







    let activeContainer = null;







    let activeHudParent = null;







    let originalImageStyle = null;







    const originalWrapperSizes = new Map();







    let currentScale = 1.0;







    let baseW = 0;







    let baseH = 0;







    // Pan state







    let isSpacePressed = false;







    let isDragging = false;







    let startX = 0;







    let startY = 0;







    let startScrollX = 0;







    let startScrollY = 0;







    // Box selection lock state







    let isBoxSelecting = false;







    let boxSelectLockTimer = null;







    let lockedScrollX = 0;







    let lockedScrollY = 0;







    // Hook scrollIntoView & focus to prevent (0, 0) jump on unpositioned comment popover







    const origScrollIntoView = Element.prototype.scrollIntoView;







    const origFocus = HTMLElement.prototype.focus;







    Element.prototype.scrollIntoView = function(...args) {







      if (activeContainer && activeContainer.contains(this) && currentScale !== 1.0) {







        const isCommentElement = !!this.closest('[data-testid="comment-box"], [data-testid="image-comment-marker"], [data-testid="image-comment-selection"], .cursor-crosshair');







        if (isCommentElement) {







          // 1. If unpositioned or hidden (Floating UI initial mount), strictly ignore to prevent jumping to (0, 0)







          const style = window.getComputedStyle(this);







          if (style.visibility === 'hidden' || style.display === 'none' || (this.offsetTop === 0 && this.offsetLeft === 0)) {







            return;







          }







          // 2. If already visible in activeContainer viewport, suppress scrolling to prevent keystroke jitter







          const cRect = activeContainer.getBoundingClientRect();







          const elRect = this.getBoundingClientRect();







          const isVisible = (







            elRect.top < cRect.bottom &&







            elRect.bottom > cRect.top &&







            elRect.left < cRect.right &&







            elRect.right > cRect.left







          );







          if (isVisible) {







            return;







          }







        }







      }







      return origScrollIntoView.apply(this, args);







    };







    HTMLElement.prototype.focus = function(options) {







      if (activeContainer && activeContainer.contains(this) && currentScale !== 1.0) {







        if (options && typeof options === 'object') {







          options = Object.assign({}, options, { preventScroll: true });







        } else {







          options = { preventScroll: true };







        }







      }







      return origFocus.call(this, options);







    };







    function findPreviewImage() {



      return Array.from(document.querySelectorAll('img')).find(img => {



        if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return false;



        if (img.closest('[id="antigravity.agentSidePanel"], [data-testid="overview-panel-host"], [data-testid="conversation-view"], [data-testid="virtuoso-scroller"], [data-testid="autoscroll-viewport"], [data-testid="user-input-step"], [role="article"], [id="antigravity.agentSidePanelInputBox"], [data-testid*="input-box"], [data-testid*="chat-input"], form, .chat-input-container, [class*="group/user-input-step"]')) {



          return false;



        }



        // Identify the native image surface, not Markdown/Mermaid or chat thumbnails.



        // File images opened from chat use alt="Image: …" and have no editor-pane



        // or artifact-view ancestor. The native selection wrapper is shared by both.



        if (!img.closest('.cursor-crosshair')) return false;



        const scrollContainer = findImageScrollContainer(img);



        if (!scrollContainer) return false;



        const pane = scrollContainer.parentElement;



        if (!pane) return false;



        const imgRect = img.getBoundingClientRect();



        const paneRect = pane.getBoundingClientRect();



        const style = window.getComputedStyle(img);



        // Test the pane visibility; scrolling a zoomed image can move its origin offscreen.



        return imgRect.width > 0 && imgRect.height > 0 && style.visibility !== 'hidden' &&



          paneRect.width > 0 && paneRect.height > 0 && paneRect.right > 0 &&



          paneRect.bottom > 0 && paneRect.left < window.innerWidth && paneRect.top < window.innerHeight;



      });



    }







    function findImageScrollContainer(img) {



      for (let el = img.parentElement; el && el !== document.body; el = el.parentElement) {



        const style = window.getComputedStyle(el);



        if (/(auto|scroll)/.test(style.overflowY + ' ' + style.overflowX)) return el;



      }



      return null;



    }







    function restoreImageSize() {



      if (activeImg && originalImageStyle !== null) {



        if (originalImageStyle) activeImg.setAttribute('style', originalImageStyle);



        else activeImg.removeAttribute('style');



      }



      originalImageStyle = null;



    }







    function updateHudLabel() {







      const hud = document.getElementById(HUD_ID);







      if (!hud) return;







      const label = hud.querySelector('.__antigravity_img_zoom_label');







      if (label) {







        label.innerText = Math.round(currentScale * 100) + '%';







      }







      const outBtn = hud.querySelector('.__antigravity_zoom_out');







      if (outBtn) {







        if (currentScale <= 1.0) {







          outBtn.style.opacity = '0.35';







          outBtn.style.cursor = 'not-allowed';







          outBtn.setAttribute('title', '已达最小缩放限制 (100%)');







        } else {







          outBtn.style.opacity = '1';







          outBtn.style.cursor = 'pointer';







          outBtn.setAttribute('title', '缩小 (Ctrl + 滚轮)');







        }







      }







    }







    function getParentWrappers() {







      if (!activeImg || !activeContainer) return [];







      const wrappers = [];







      let curr = activeImg.parentElement;







      while (curr && curr !== activeContainer) {







        wrappers.push(curr);







        curr = curr.parentElement;







      }







      return wrappers;







    }







    function adjustParentWrappers(isZoomed) {



      if (isZoomed) {



        for (const w of getParentWrappers()) {



          if (!originalWrapperSizes.has(w)) originalWrapperSizes.set(w, {



            width: w.style.getPropertyValue('width'), widthPriority: w.style.getPropertyPriority('width'),



            minWidth: w.style.getPropertyValue('min-width'), minPriority: w.style.getPropertyPriority('min-width'),



            hadClass: w.classList.contains('__antigravity_img_wrapper_zoomed'), hadStyle: w.hasAttribute('style')



          });



          w.classList.add('__antigravity_img_wrapper_zoomed');



          w.style.minWidth = '100%';



          w.style.width = 'max-content';



        }



      } else {



        for (const [w, original] of originalWrapperSizes) {



          w.classList.toggle('__antigravity_img_wrapper_zoomed', original.hadClass);



          w.style.setProperty('width', original.width, original.widthPriority);



          w.style.setProperty('min-width', original.minWidth, original.minPriority);



          if (!original.hadStyle && w.style.length === 0) w.removeAttribute('style');



        }



        originalWrapperSizes.clear();



      }







    }







    function applyScale(scale) {







      if (!activeImg || !baseW || !baseH) return;







      currentScale = Math.min(Math.max(scale, 1.0), 10.0);







      if (Math.abs(currentScale - 1.0) < 0.02) {







        currentScale = 1.0;







        if (originalImageStyle) activeImg.setAttribute('style', originalImageStyle);



        else activeImg.removeAttribute('style');







        adjustParentWrappers(false);







      } else {







        adjustParentWrappers(true);







        activeImg.style.maxWidth = 'none';







        activeImg.style.width = Math.round(baseW * currentScale) + 'px';







        activeImg.style.height = Math.round(baseH * currentScale) + 'px';







      }







      updateHudLabel();







    }







    function zoomAt(clientX, clientY, factor) {







      if (!activeImg || !activeContainer) return;







      if (!baseW || !baseH || currentScale === 1.0) {







        const r = activeImg.getBoundingClientRect();







        if (r.width > 0 && r.height > 0) {







          baseW = r.width;







          baseH = r.height;







        }







      }







      const prevScale = currentScale;







      const targetScale = Math.min(Math.max(currentScale * factor, 1.0), 10.0);







      if (Math.abs(targetScale - prevScale) < 0.001) return;







      const imgRect = activeImg.getBoundingClientRect();







      const isInside = (







        clientX >= imgRect.left && clientX <= imgRect.right &&







        clientY >= imgRect.top && clientY <= imgRect.bottom







      );







      let u = 0.5;







      let v = 0.5;







      let targetX = clientX;







      let targetY = clientY;







      if (isInside && imgRect.width > 0 && imgRect.height > 0) {







        u = (clientX - imgRect.left) / imgRect.width;







        v = (clientY - imgRect.top) / imgRect.height;







      } else {







        targetX = imgRect.left + imgRect.width / 2;







        targetY = imgRect.top + imgRect.height / 2;







      }







      applyScale(targetScale);







      if (currentScale === 1.0) {







        activeContainer.scrollLeft = 0;







        activeContainer.scrollTop = 0;







        return;







      }







      const newRect = activeImg.getBoundingClientRect();







      const currPointX = newRect.left + u * newRect.width;







      const currPointY = newRect.top + v * newRect.height;







      const newScrollX = activeContainer.scrollLeft + (currPointX - targetX);







      const newScrollY = activeContainer.scrollTop + (currPointY - targetY);







      activeContainer.scrollLeft = Math.max(0, newScrollX);







      activeContainer.scrollTop = Math.max(0, newScrollY);







    }







    function resetZoomFit() {







      if (!activeImg || !activeContainer) return;







      applyScale(1.0);







      activeContainer.scrollLeft = 0;







      activeContainer.scrollTop = 0;







    }







    function zoomToActual(clientX, clientY) {







      if (!activeImg || !activeContainer) return;







      if (!baseW || currentScale === 1.0) {







        const r = activeImg.getBoundingClientRect();







        if (r.width > 0 && r.height > 0) {







          baseW = r.width;







          baseH = r.height;







        }







      }







      if (baseW > 0 && activeImg.naturalWidth > 0) {







        const actualScale = activeImg.naturalWidth / baseW;







        zoomAt(clientX, clientY, actualScale / currentScale);







      }







    }







    function onWheel(e) {







      if (!activeContainer || !activeImg) return;







      isBoxSelecting = false;







      clearTimeout(boxSelectLockTimer);







      // 1. Ctrl / Meta key -> Cursor-Centric Zoom







      if (e.ctrlKey || e.metaKey) {







        e.preventDefault();







        e.stopPropagation();







        const factor = e.deltaY < 0 ? 1.15 : 0.87;







        zoomAt(e.clientX, e.clientY, factor);







        return;







      }







      // 2. Shift key -> Horizontal Scroll







      if (e.shiftKey) {







        e.preventDefault();







        e.stopPropagation();







        activeContainer.scrollLeft += (e.deltaY || e.deltaX);







        return;







      }







    }







    function onKeyDown(e) {







      if (e.code === 'Space' && !e.repeat) {







        const activeEl = document.activeElement;







        const isTyping = activeEl && (







          activeEl.tagName === 'INPUT' || 







          activeEl.tagName === 'TEXTAREA' || 







          activeEl.isContentEditable || 







          activeEl.closest('[data-lexical-editor="true"]')







        );







        if (isTyping) return;







        isSpacePressed = true;







        isBoxSelecting = false;







        clearTimeout(boxSelectLockTimer);







        if (activeContainer) {







          activeContainer.classList.add('__antigravity_pan_ready');







        }







      }







    }







    function onKeyUp(e) {







      if (e.code === 'Space') {







        isSpacePressed = false;







        if (activeContainer) {







          activeContainer.classList.remove('__antigravity_pan_ready');







          if (!isDragging) activeContainer.classList.remove('__antigravity_panning');







        }







      }







    }







    function onMouseDown(e) {







      if (!activeContainer) return;







      if (isSpacePressed || e.button === 1) {







        e.preventDefault();







        e.stopPropagation();







        isDragging = true;







        isBoxSelecting = false;







        clearTimeout(boxSelectLockTimer);







        startX = e.clientX;







        startY = e.clientY;







        startScrollX = activeContainer.scrollLeft;







        startScrollY = activeContainer.scrollTop;







        activeContainer.classList.add('__antigravity_panning');







        return;







      }







      // Native box selection drag starting







      if (e.button === 0 && currentScale !== 1.0) {







        const crosshair = e.target.closest('.cursor-crosshair');







        if (crosshair) {







          isBoxSelecting = true;







          lockedScrollX = activeContainer.scrollLeft;







          lockedScrollY = activeContainer.scrollTop;







          clearTimeout(boxSelectLockTimer);







        }







      }







    }







    function onMouseMove(e) {







      if (isDragging && activeContainer) {







        e.preventDefault();







        activeContainer.scrollLeft = startScrollX - (e.clientX - startX);







        activeContainer.scrollTop = startScrollY - (e.clientY - startY);







      }







    }







    function onMouseUp(e) {







      if (isDragging) {







        isDragging = false;







        if (activeContainer) {







          activeContainer.classList.remove('__antigravity_panning');







          if (!isSpacePressed) {







            activeContainer.classList.remove('__antigravity_pan_ready');







          }







        }







      }







      // On box selection complete, protect viewport for 800ms







      if (isBoxSelecting && activeContainer && currentScale !== 1.0) {







        clearTimeout(boxSelectLockTimer);







        boxSelectLockTimer = setTimeout(() => {







          isBoxSelecting = false;







        }, 800);







      }







    }







    function onContainerScroll(e) {







      // If within box selection lifecycle and not user panning, restore locked scroll







      if (isBoxSelecting && !isDragging && activeContainer && currentScale !== 1.0) {







        if (activeContainer.scrollLeft !== lockedScrollX || activeContainer.scrollTop !== lockedScrollY) {







          activeContainer.scrollLeft = lockedScrollX;







          activeContainer.scrollTop = lockedScrollY;







        }







      }







    }







    function onDblClick(e) {







      if (!activeImg || !activeContainer) return;







      e.preventDefault();







      if (currentScale !== 1.0) {







        resetZoomFit();







      } else {







        zoomToActual(e.clientX, e.clientY);







      }







    }







    function ensureHud(parentRelative) {







      if (!parentRelative) return;







      // Absolute defense: Never attach HUD inside the chat column or input box







      if (parentRelative.closest('[id="antigravity.agentSidePanel"], [data-testid="overview-panel-host"], [data-testid="conversation-view"], [data-testid*="input-box"], form, .chat-container')) {







        return;







      }







      let hud = document.getElementById(HUD_ID);







      if (!hud) {







        hud = document.createElement('div');







        hud.id = HUD_ID;







        hud.innerHTML = `







          <span class="__antigravity_img_zoom_label" title="适合屏幕">100%</span>







          <button class="__antigravity_zoom_out" type="button" title="缩小 (Ctrl + 滚轮)">➖</button>







          <button class="__antigravity_zoom_in" type="button" title="放大 (Ctrl + 滚轮)">➕</button>







          <div class="__antigravity_hud_divider"></div>







          <button class="__antigravity_zoom_fit" type="button" title="适合屏幕 (双击图片复位)">⤢ 适合屏幕</button>







          <button class="__antigravity_zoom_actual" type="button" title="1:1 原始尺寸">1:1 原始尺寸</button>







        `;







        const outBtn = hud.querySelector('.__antigravity_zoom_out');







        const inBtn = hud.querySelector('.__antigravity_zoom_in');







        const fitBtn = hud.querySelector('.__antigravity_zoom_fit');







        const actBtn = hud.querySelector('.__antigravity_zoom_actual');







        const label = hud.querySelector('.__antigravity_img_zoom_label');







        outBtn.onclick = (e) => {







          e.stopPropagation();







          if (currentScale <= 1.0) return;







          if (activeContainer) {







            const r = activeContainer.getBoundingClientRect();







            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 0.85);







          }







        };







        inBtn.onclick = (e) => {







          e.stopPropagation();







          if (activeContainer) {







            const r = activeContainer.getBoundingClientRect();







            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.18);







          }







        };







        fitBtn.onclick = (e) => {







          e.stopPropagation();







          resetZoomFit();







        };







        label.onclick = fitBtn.onclick;







        actBtn.onclick = (e) => {







          e.stopPropagation();







          if (activeContainer) {







            const r = activeContainer.getBoundingClientRect();







            zoomToActual(r.left + r.width / 2, r.top + r.height / 2);







          }







        };







      }







      if (hud.parentElement !== parentRelative) parentRelative.appendChild(hud);







      updateHudLabel();







    }







    function checkAndBind() {







      ensureStyle();







      // Immediate defense: remove any stray HUD in the chat column or input area







      const strayChatHuds = document.querySelectorAll('#antigravity\\.agentSidePanel #__antigravity_img_hud, [data-testid="overview-panel-host"] #__antigravity_img_hud, [data-testid="conversation-view"] #__antigravity_img_hud, [data-testid*="input-box"] #__antigravity_img_hud');







      strayChatHuds.forEach(h => h.remove());







      const img = findPreviewImage();







      if (!img) {







        adjustParentWrappers(false);







        restoreImageSize();







        const existingHud = document.getElementById(HUD_ID);







        if (existingHud) existingHud.remove();







        if (activeContainer) {







          activeContainer.removeEventListener('wheel', onWheel);







          activeContainer.removeEventListener('mousedown', onMouseDown);







          activeContainer.removeEventListener('dblclick', onDblClick);







          activeContainer.removeEventListener('scroll', onContainerScroll);







          activeContainer.classList.remove('__antigravity_pan_ready', '__antigravity_panning', '__antigravity_img_scroll_container');







          activeContainer = null;







        }







        activeImg = null;







        activeHudParent = null;







        currentScale = 1.0;







        baseW = 0;







        baseH = 0;







        return;







      }







      const container = findImageScrollContainer(img);







      if (img === activeImg && activeContainer === container && activeContainer) {







        if (!activeContainer.classList.contains('__antigravity_img_scroll_container')) {







          activeContainer.classList.add('__antigravity_img_scroll_container');







        }







        if (currentScale !== 1.0) {







          adjustParentWrappers(true);







        }







        if (activeHudParent) ensureHud(activeHudParent);







        return;







      }







      adjustParentWrappers(false);







      restoreImageSize();







      if (activeContainer) {







        activeContainer.removeEventListener('wheel', onWheel);







        activeContainer.removeEventListener('mousedown', onMouseDown);







        activeContainer.removeEventListener('dblclick', onDblClick);







        activeContainer.removeEventListener('scroll', onContainerScroll);







        activeContainer.classList.remove('__antigravity_pan_ready', '__antigravity_panning', '__antigravity_img_scroll_container');







      }







      activeImg = img;







      originalImageStyle = img.getAttribute('style') || '';







      activeContainer = container;







      activeHudParent = activeContainer ? activeContainer.parentElement : null;







      currentScale = 1.0;







      const r = img.getBoundingClientRect();







      baseW = r.width;







      baseH = r.height;







      if (!img.complete) {







        img.onload = () => {







          if (img === activeImg) {







            const r2 = img.getBoundingClientRect();







            baseW = r2.width;







            baseH = r2.height;







          }







        };







      }







      if (activeContainer) {







        activeContainer.classList.add('__antigravity_img_scroll_container');







        activeContainer.addEventListener('wheel', onWheel, { passive: false });







        activeContainer.addEventListener('mousedown', onMouseDown);







        activeContainer.addEventListener('dblclick', onDblClick);







        activeContainer.addEventListener('scroll', onContainerScroll, { passive: true });







      }







      if (activeHudParent) {







        if (window.getComputedStyle(activeHudParent).position === 'static') {







          activeHudParent.style.position = 'relative';







        }







        ensureHud(activeHudParent);







      }







    }







    const onBlur = () => {







      isSpacePressed = false;







      if (isDragging) {







        isDragging = false;







        if (activeContainer) activeContainer.classList.remove('__antigravity_panning');







      }







      if (activeContainer) activeContainer.classList.remove('__antigravity_pan_ready');







    };







    const onResize = () => {







      if (activeImg && currentScale === 1.0) {







        const r = activeImg.getBoundingClientRect();







        if (r.width > 0 && r.height > 0) {







          baseW = r.width;







          baseH = r.height;







        }







      }







    };







    window.addEventListener('keydown', onKeyDown);







    window.addEventListener('keyup', onKeyUp);







    window.addEventListener('mousemove', onMouseMove);







    window.addEventListener('mouseup', onMouseUp);







    window.addEventListener('blur', onBlur);







    window.addEventListener('resize', onResize);







    checkAndBind();







    const interval = setInterval(checkAndBind, 700);







    return () => {







      clearInterval(interval);







      document.removeEventListener('wheel', onModalWheel, true);



      document.removeEventListener('pointerdown', onModalPointerDown, true);



      document.removeEventListener('pointermove', onModalPointerMove, true);



      document.removeEventListener('pointerup', onModalPointerUp, true);



      document.removeEventListener('pointercancel', onModalPointerUp, true);



      onModalBlur();



      window.removeEventListener('keydown', onModalKey);



      window.removeEventListener('keyup', onModalKey);



      window.removeEventListener('blur', onModalBlur);







      clearTimeout(boxSelectLockTimer);







      adjustParentWrappers(false);







      restoreImageSize();







      Element.prototype.scrollIntoView = origScrollIntoView;







      HTMLElement.prototype.focus = origFocus;







      window.removeEventListener('keydown', onKeyDown);







      window.removeEventListener('keyup', onKeyUp);







      window.removeEventListener('mousemove', onMouseMove);







      window.removeEventListener('mouseup', onMouseUp);







      window.removeEventListener('blur', onBlur);







      window.removeEventListener('resize', onResize);







      if (activeContainer) {







        activeContainer.removeEventListener('wheel', onWheel);







        activeContainer.removeEventListener('mousedown', onMouseDown);







        activeContainer.removeEventListener('dblclick', onDblClick);







        activeContainer.removeEventListener('scroll', onContainerScroll);







        activeContainer.classList.remove('__antigravity_pan_ready', '__antigravity_panning', '__antigravity_img_scroll_container');







      }







      const hud = document.getElementById(HUD_ID);







      if (hud) hud.remove();







      const styleEl = document.getElementById(STYLE_ID);







      if (styleEl) styleEl.remove();







    };







  }







  // =========================================================================







  // Feature 9: Top Tab Header Context Menu Enhancer (Copy Path, Reveal, Close)







  // =========================================================================







  function initTabHeaderContextMenu() {







    function findTabElement(target) {







      if (!target) return null;







      return target.closest('button[data-tab-id], [data-tab-id], [role="tab"], .tab');







    }







    function extractTabInfo(tabEl) {







      if (!tabEl) return null;







      const tabId = tabEl.getAttribute('data-tab-id') || '';







      let cleanUri = '';







      if (tabId.includes('file:///')) {







        const idx = tabId.indexOf('file:///');







        cleanUri = tabId.slice(idx);







      } else if (tabId.startsWith('file://')) {







        const idx = tabId.indexOf('file://');







        cleanUri = tabId.slice(idx);







      }







      // If no file URI in tabId, try React Fiber







      if (!cleanUri) {







        try {







          const key = Object.keys(tabEl).find(k => k.startsWith('__reactFiber$'));







          if (key) {







            let curr = tabEl[key];







            while (curr) {







              const u = curr.memoizedProps?.tab?.uri || curr.memoizedProps?.uri || curr.memoizedProps?.entry?.uri || curr.memoizedProps?.resource;







              if (u && typeof u === 'string' && u.includes('file:')) {







                cleanUri = u;







                break;







              }







              curr = curr.return;







            }







          }







        } catch (e) {}







      }







      // Convert to Windows path if we have cleanUri







      let winPath = '';







      if (cleanUri) {







        winPath = ToolkitCore.uriToWindowsPath(cleanUri);







      } else {







        // Fallback: check tabEl title attribute







        const titleAttr = tabEl.getAttribute('title') || '';







        if (/^[a-zA-Z]:[\\\/]/.test(titleAttr) || titleAttr.startsWith('file:')) {







          winPath = ToolkitCore.uriToWindowsPath(titleAttr);







        }







      }







      // Find close button inside tab







      const closeBtn = tabEl.querySelector('span[role="button"][aria-label*="Close" i], [aria-label*="Close" i], button[aria-label*="Close" i]') ||







                       tabEl.querySelector('svg')?.closest('[role="button"], button');







      return {







        tabId,







        cleanUri,







        winPath,







        closeBtn







      };







    }







    const handleContextMenu = async (e) => {







      const tabEl = findTabElement(e.target);







      if (!tabEl) return;







      const tabInfo = extractTabInfo(tabEl);







      if (!tabInfo) return;







      // If neither path nor closeBtn, let default happen







      if (!tabInfo.winPath && !tabInfo.closeBtn) return;







      e.preventDefault();







      e.stopPropagation();







      const menuItems = [];







      if (tabInfo.winPath) {







        // Highest priority: Copy Path, Reveal in File Explorer, Copy File







        menuItems.push({ id: 'copy-path', label: '复制完整路径 (Copy Path)' });







        menuItems.push({ id: 'reveal-in-explorer', label: '在文件夹中显示 (Reveal in Explorer)' });







        menuItems.push({ id: 'copy-file', label: '复制文件 (Copy File)' });







      }







      if (tabInfo.closeBtn) {







        // Lower priority: Close Tab







        menuItems.push({ id: 'close-tab', label: 'Close Tab' });







      }







      if (window.electronNative && typeof window.electronNative.showContextMenu === 'function') {







        window.electronNative.showContextMenu(menuItems).then(async (selectedId) => {







          if (!selectedId) return;







          if (selectedId === 'copy-path') {







            if (navigator.clipboard && navigator.clipboard.writeText) {







              await navigator.clipboard.writeText(tabInfo.winPath).catch(() => {});







            }







            ToolkitCore.showToast(`✓ 已复制标签页路径: ${tabInfo.winPath}`);







          } else if (selectedId === 'reveal-in-explorer') {







            await ToolkitCore.revealInExplorer(tabInfo.winPath, tabInfo.cleanUri);







            const fileName = tabInfo.winPath.split('\\').pop();







            ToolkitCore.showToast(`✓ 已在文件资源管理器中定位: ${fileName}`);







          } else if (selectedId === 'copy-file') {







            if (window.antigravityFS && typeof window.antigravityFS.copyFilesToClipboard === 'function') {







              await window.antigravityFS.copyFilesToClipboard([tabInfo.winPath]);







            } else if (navigator.clipboard && navigator.clipboard.writeText) {







              await navigator.clipboard.writeText(tabInfo.winPath).catch(() => {});







            }







            const fileName = tabInfo.winPath.split('\\').pop();







            ToolkitCore.showToast(`✓ 已复制文件: ${fileName}`);







          } else if (selectedId === 'close-tab') {







            if (tabInfo.closeBtn) {







              tabInfo.closeBtn.click();







            }







          }







        }).catch(() => {});







      } else {







        if (tabInfo.winPath) {







          if (navigator.clipboard && navigator.clipboard.writeText) {







            navigator.clipboard.writeText(tabInfo.winPath).catch(() => {});







          }







          ToolkitCore.showToast(`✓ 已复制路径: ${tabInfo.winPath}`);







        }







      }







    };







    document.addEventListener('contextmenu', handleContextMenu, true);







    return () => {







      document.removeEventListener('contextmenu', handleContextMenu, true);







    };







  }







  // =========================================================================







  // Feature 10: File Link Auto-Healing & Fault-Tolerant Opener







  // =========================================================================







  function initFileLinkAutoHealing() {







    const handleClick = (e) => {







      const link = e.target.closest('a[href^="file:"], a[href*="file:///"], [data-uri^="file:"], [data-file-path]');







      if (!link) return;







      let rawHref = link.getAttribute('href') || link.getAttribute('data-uri') || link.getAttribute('data-file-path') || '';







      if (!rawHref.startsWith('file:') && !rawHref.includes('file:///')) return;







      // Check for malformed URL patterns like "% " (percent followed by literal space) or unescaped sequences







      if (rawHref.includes('% ') || rawHref.includes('%25 ') || /%[0-9a-fA-F]?(\s|$)/.test(rawHref)) {







        e.preventDefault();







        e.stopPropagation();







        e.stopImmediatePropagation();







        const cleanUri = rawHref.replace(/% /g, '%20').replace(/%2520/g, '%20');







        link.setAttribute('href', cleanUri);







        if (link.getAttribute('data-uri')) link.setAttribute('data-uri', cleanUri);







        const openFn = ToolkitCore.getOpenFileFn();







        if (openFn) {







          openFn(cleanUri);







          const fileName = decodeURIComponent(cleanUri.split('/').pop());







          ToolkitCore.showToast(`✓ 已自动修正链接并打开: ${fileName}`);







        }







      }







    };







    document.addEventListener('click', handleClick, true);







    return () => {







      document.removeEventListener('click', handleClick, true);







    };







  }







  // Normalize screenshot clipboard formats (for example image/bmp) to PNG



  // before the native chat uploader applies its image MIME allowlist.



  function initClipboardImageCompatibility() {



    const supportedTypes = new Set([



      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'



    ]);



    let converting = false;







    const blobToPng = async (source) => {



      let bitmap = null;



      try {



        if (typeof createImageBitmap === 'function') {



          bitmap = await createImageBitmap(source);



          const canvas = document.createElement('canvas');



          canvas.width = bitmap.width;



          canvas.height = bitmap.height;



          canvas.getContext('2d').drawImage(bitmap, 0, 0);



          return await new Promise((resolve, reject) => {



            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG conversion returned no data')), 'image/png');



          });



        }



      } catch (error) {



        console.debug('[ClipboardImageCompat] createImageBitmap fallback:', error);



      } finally {



        if (bitmap) bitmap.close();



      }



      return await new Promise((resolve, reject) => {



        const image = new Image();



        const url = URL.createObjectURL(source);



        image.onload = () => {



          const canvas = document.createElement('canvas');



          canvas.width = image.naturalWidth;



          canvas.height = image.naturalHeight;



          canvas.getContext('2d').drawImage(image, 0, 0);



          URL.revokeObjectURL(url);



          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG conversion returned no data')), 'image/png');



        };



        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Clipboard image decode failed')); };



        image.src = url;



      });



    };







    const handlePaste = async (event) => {



      if (converting || event.__antigravityNormalizedImagePaste) return;



      const clipboard = event.clipboardData;



      if (!clipboard?.items) return;



      const unsupported = [...clipboard.items].find((item) => {



        const type = String(item.type || '').toLowerCase();



        return item.kind === 'file' && type.startsWith('image/') && !supportedTypes.has(type);



      });



      if (!unsupported) return;



      const source = unsupported.getAsFile?.();



      if (!source) return;







      event.preventDefault();



      event.stopPropagation();



      event.stopImmediatePropagation();



      converting = true;



      try {



        const png = await blobToPng(source);



        const normalized = new File([png], '微信截图.png', {



          type: 'image/png', lastModified: Date.now()



        });



        const transfer = new DataTransfer();



        const plainText = clipboard.getData('text/plain');



        const htmlText = clipboard.getData('text/html');



        if (plainText) transfer.setData('text/plain', plainText);



        if (htmlText) transfer.setData('text/html', htmlText);



        transfer.items.add(normalized);



        const replacement = new ClipboardEvent('paste', {



          bubbles: true, cancelable: true, clipboardData: transfer



        });



        Object.defineProperty(replacement, '__antigravityNormalizedImagePaste', { value: true });



        (event.target || document.activeElement || document.body).dispatchEvent(replacement);



      } catch (error) {



        console.warn('[ClipboardImageCompat] Failed to normalize screenshot:', error);



        ToolkitCore.showToast('截图格式暂不支持，请改用 PNG/JPG 文件上传');



      } finally {



        converting = false;



      }



    };







    document.addEventListener('paste', handlePaste, true);



    return () => document.removeEventListener('paste', handlePaste, true);



  }







  // =========================================================================







  // Safe Bootstrap (Handles document-start, DOMContentLoaded, and late load)







  // =========================================================================









  // =========================================================================

  // Feature 8: Binary & Unsupported File Preview Graceful Card (Minimal & Quiet IDE Style)

  // =========================================================================

  function initBinaryFallbackEnhancer() {

    const STYLE_ID = '__antigravity_binary_fallback_style';

    if (!document.getElementById(STYLE_ID)) {

      const style = document.createElement('style');

      style.id = STYLE_ID;

      style.textContent = `

        [data-testid="artifact-no-preview"],

        [data-testid="artifact-viewer-root"],

        [data-testid="file-viewer-root"],

        .file-viewer-root {

          min-width: 0 !important;

          max-width: 100% !important;

          overflow: hidden !important;

          box-sizing: border-box !important;

        }

        [data-testid="artifact-no-preview"] *,

        .file-viewer-root * {

          word-break: break-all !important;

          overflow-wrap: anywhere !important;

        }

        .__ag_quiet_btn {

          display: inline-flex;

          align-items: center;

          gap: 5px;

          padding: 4px 11px;

          border-radius: 6px;

          font-size: 12px;

          font-weight: 400;

          cursor: pointer;

          border: 1px solid var(--border, rgba(140, 140, 140, 0.2));

          background: transparent;

          color: var(--muted-foreground, #71717a);

          transition: all 0.15s ease;

          outline: none;

          text-decoration: none !important;

        }

        .__ag_quiet_btn:hover {

          background: var(--secondary, rgba(10, 10, 12, 0.05));

          color: var(--foreground, #0a0a0c);

          border-color: rgba(140, 140, 140, 0.4);

        }

      `;

      document.head.appendChild(style);

    }



    function cleanPathFromUri(raw) {

      if (!raw) return '';

      let s = raw.replace(/^CreateFile\s*/i, '').replace(/^[\\/]*file:[\\/]*/i, '');

      if (s.includes(':') && !s.match(/^[a-zA-Z]:/)) {

        s = s.split(':')[0];

      }

      try {

        s = decodeURIComponent(s);

      } catch(e) {}

      s = s.replace(/^[\\/]+([a-zA-Z]:)/, '$1').replace(/\//g, '\\');

      return s;

    }



    function decodeVisibleBreadcrumbs() {

      const breadcrumbContainer = document.querySelector('nav, [class*="breadcrumb"]') || document.querySelector('.flex.items-center.gap-1.text-sm');

      if (breadcrumbContainer) {

        const walker = document.createTreeWalker(breadcrumbContainer, NodeFilter.SHOW_TEXT);

        let node;

        while (node = walker.nextNode()) {

          const val = node.nodeValue;

          if (val && /%[0-9A-Fa-f]{2}/.test(val)) {

            try {

              const decoded = decodeURIComponent(val);

              if (decoded !== val) node.nodeValue = decoded;

            } catch(e) {}

          }

        }

      }

      document.querySelectorAll('.agy-aux-tab-title, [data-tab-id] span').forEach(el => {

        const val = el.innerText;

        if (val && /%[0-9A-Fa-f]{2}/.test(val)) {

          try {

            const decoded = decodeURIComponent(val);

            if (decoded !== val) el.innerText = decoded;

          } catch(e) {}

        }

      });

    }



    function renderQuietCard(container, fileName, cleanWinPath, origBtn) {

      container.innerHTML = `

        <div style="

          display:flex; flex-direction:column; align-items:center; justify-content:center;

          width:100%; height:100%; gap:10px; color:var(--muted-foreground, #71717a);

          font-size:13px; background:transparent; user-select:none; padding:40px 20px; box-sizing:border-box;

        ">

          <div style="opacity:0.4; margin-bottom:2px;">

            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">

              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>

              <polyline points="14 2 14 8 20 8"></polyline>

            </svg>

          </div>

          <div style="

            font-size:13.5px; font-weight:500; color:var(--foreground, #27272a);

            max-width:440px; word-break:break-all; text-align:center; line-height:1.4; opacity:0.85;

          ">

            ${fileName}

          </div>

          <div style="font-size:12px; color:var(--muted-foreground, #71717a); opacity:0.65; margin-bottom:6px;">

            二进制数据文件，无法直接在编辑器中预览

          </div>

          <div style="display:flex; gap:8px; align-items:center;" class="__ag_quiet_actions">

            ${cleanWinPath ? `

              <button class="__ag_quiet_btn __ag_btn_quiet_reveal" type="button">

                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">

                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>

                </svg>

                <span>在文件夹中显示</span>

              </button>

              <button class="__ag_quiet_btn __ag_btn_quiet_copy" type="button">

                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">

                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>

                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>

                </svg>

                <span>复制路径</span>

              </button>

            ` : ''}

          </div>

        </div>

      `;



      if (cleanWinPath) {

        const btnReveal = container.querySelector('.__ag_btn_quiet_reveal');

        if (btnReveal) {

          btnReveal.onclick = (e) => {

            e.preventDefault();

            e.stopPropagation();

            if (window.electronNative?.showItemInFolder) {

              window.electronNative.showItemInFolder(cleanWinPath);

            } else if (ToolkitCore?.revealInExplorer) {

              ToolkitCore.revealInExplorer(cleanWinPath);

            }

          };

        }



        const btnCopy = container.querySelector('.__ag_btn_quiet_copy');

        if (btnCopy) {

          btnCopy.onclick = (e) => {

            e.preventDefault();

            e.stopPropagation();

            if (navigator.clipboard?.writeText) {

              navigator.clipboard.writeText(cleanWinPath);

              ToolkitCore?.showToast?.('✓ 已复制完整路径至剪贴板');

            }

          };

        }

      }



      if (origBtn) {

        const actions = container.querySelector('.__ag_quiet_actions');

        const btnDl = document.createElement('button');

        btnDl.type = 'button';

        btnDl.className = '__ag_quiet_btn';

        btnDl.innerHTML = `

          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">

            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>

            <polyline points="7 10 12 15 17 10"></polyline>

            <line x1="12" y1="15" x2="12" y2="3"></line>

          </svg>

          <span>下载副本</span>

        `;

        btnDl.onclick = (e) => {

          e.preventDefault();

          e.stopPropagation();

          origBtn.click();

        };

        actions.appendChild(btnDl);

      }

      container.dataset.agEnhanced = 'true';

    }



    function enhanceFallbacks() {

      decodeVisibleBreadcrumbs();



      // Case 1: [data-testid="artifact-no-preview"]

      const noPreviews = document.querySelectorAll('[data-testid="artifact-no-preview"]');

      noPreviews.forEach(container => {

        if (container.dataset.agEnhanced === 'true') return;



        const activeTabId = document.querySelector('[data-active-tab-id]')?.getAttribute('data-active-tab-id') || '';

        let rawUri = activeTabId.replace(/^(?:file__|artifact__)/, '');

        const origBtn = container.querySelector('button, a');

        let rawFileName = origBtn?.innerText?.replace(/^Download\s*/i, '') || '';

        

        let decodedName = '';

        try {

          decodedName = decodeURIComponent(rawFileName || rawUri.split('/').pop() || 'file');

        } catch(e) {

          decodedName = rawFileName;

        }



        let cleanWinPath = cleanPathFromUri(rawUri);

        renderQuietCard(container, decodedName, cleanWinPath, origBtn);

      });



      // Case 2: Native CreateFile error container

      const showBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.includes('Show in File Explorer'));

      if (showBtn) {

        const errorContainer = showBtn.closest('.flex.flex-col.items-center');

        if (errorContainer && errorContainer.dataset.agEnhanced !== 'true') {

          const rawText = errorContainer.innerText || '';

          const match = rawText.match(/(?:CreateFile\s+)?([\S]+):/i);

          const rawPath = match ? match[1] : '';

          const cleanWinPath = cleanPathFromUri(rawPath);

          const fileName = cleanWinPath.split('\\').pop() || 'file';

          renderQuietCard(errorContainer, fileName, cleanWinPath, null);

        }

      }

    }



    const interval = setInterval(enhanceFallbacks, 600);

    enhanceFallbacks();



    return () => {

      clearInterval(interval);

      document.getElementById(STYLE_ID)?.remove();

      document.querySelectorAll('[data-ag-enhanced]').forEach(el => {

        delete el.dataset.agEnhanced;

      });

    };

  }



  function boot() {

    let cleanupPill = null;

    try { cleanupPill = initPillContextMenu(); } catch(e) { console.warn('[Boot] Pill error:', e); }



    let cleanupNav = null;

    try { cleanupNav = initCodexTurnNavigator(); } catch(e) { console.warn('[Boot] Nav error:', e); }



    let cleanupToggle = null;

    try { cleanupToggle = initAuxiliaryPaneQuickToggle(); } catch(e) { console.warn('[Boot] Toggle error:', e); }



    let cleanupTree = null;

    try { cleanupTree = initWorkspaceTreeEnhancer(); } catch(e) { console.warn('[Boot] Tree error:', e); }



    let cleanupNotification = null;

    try { cleanupNotification = initNotificationEnhancer(); } catch(e) { console.warn('[Boot] Notification error:', e); }



    let cleanupProceed = null;

    try { cleanupProceed = initProceedEnhancer(); } catch(e) { console.warn('[Boot] Proceed error:', e); }



    let cleanupWsSidebar = null;

    try { cleanupWsSidebar = initPersistentWorkspaceSidebar(); } catch(e) { console.warn('[Boot] WsSidebar error:', e); }



    let cleanupImg = null;

    try { cleanupImg = initImageViewerEnhancer(); } catch(e) { console.warn('[Boot] ImgViewer error:', e); }

    window.__antigravityImageViewerCleanup = cleanupImg;

    window.__antigravityImageViewerVersion = '2026-10-22-chat-image-v3';



    let cleanupTabHeader = null;

    try { cleanupTabHeader = initTabHeaderContextMenu(); } catch(e) { console.warn('[Boot] TabHeader error:', e); }



    let cleanupLinkHealing = null;

    try { cleanupLinkHealing = initFileLinkAutoHealing(); } catch(e) { console.warn('[Boot] LinkHealing error:', e); }



    let cleanupClipboardImage = null;

    try { cleanupClipboardImage = initClipboardImageCompatibility(); } catch(e) { console.warn('[Boot] ClipboardImage error:', e); }



    let cleanupBinaryFallback = null;

    try { cleanupBinaryFallback = initBinaryFallbackEnhancer(); } catch(e) { console.warn('[Boot] BinaryFallback error:', e); }





    window.__antigravityChatEnhancerCleanup = () => {







      if (cleanupPill) cleanupPill();







      if (cleanupNav) cleanupNav();







      if (cleanupToggle) cleanupToggle();







      if (cleanupTree) cleanupTree();







      if (cleanupNotification) cleanupNotification();







      if (cleanupProceed) cleanupProceed();







      if (cleanupWsSidebar) cleanupWsSidebar();







      if (window.__antigravityImageViewerCleanup) window.__antigravityImageViewerCleanup();







      delete window.__antigravityImageViewerCleanup;







      if (cleanupTabHeader) cleanupTabHeader();







      if (cleanupLinkHealing) cleanupLinkHealing();







      if (cleanupClipboardImage) cleanupClipboardImage();

      if (cleanupBinaryFallback) cleanupBinaryFallback();







      window.__antigravityChatEnhancerInitialized = false;







      console.log('[ChatEnhancer v8 Master] Cleaned up.');







    };







  }







  if (document.readyState === 'loading') {







    document.addEventListener('DOMContentLoaded', boot, { once: true });







  } else {







    boot();







  }







  console.log('[ChatEnhancer v8 Master] Initialized successfully!');















// =========================================================================



// Feature 9: Markdown TOC Navigator (高保真大纲目录浮窗与章节快速定位)



// =========================================================================



(function initMarkdownTocNavigator() {



  if (window.__antigravityMdTocInstalled) return;



  window.__antigravityMdTocInstalled = true;







  console.log('[MarkdownTOC] Initializing High-Fidelity TOC Navigator...');







  let _activeTocPill = null;



  let _activeTocPanel = null;



  let _scrollSpyTimer = null;







  function findMarkdownContainer() {



    // Avoid injecting into PDF or Office viewers



    if (document.getElementById('antigravity-office-host')) return null;







    return document.querySelector('[role="region"][aria-label="File Viewer"]') ||



           document.querySelector('[role="region"][aria-label*="Artifact"]') ||



           document.querySelector('[data-testid*="artifact"]') ||



           document.querySelector('.file-viewer-root') ||



           document.querySelector('.markdown-body, .prose');



  }







  function findMarkdownHeadings(container) {



    if (!container) return [];



    if (document.getElementById('antigravity-office-host')) return [];







    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4')).map((h, idx) => ({



      index: idx,



      level: parseInt(h.tagName.slice(1), 10),



      tag: h.tagName,



      text: h.innerText.replace(/[\r\n\t]+/g, ' ').trim(),



      element: h



    })).filter(h => h.text.length > 0 && !(h.element && typeof h.element.closest === 'function' && h.element.closest('#antigravity-office-host')));







    return headings;



  }







  function findScrollContainer(fileRegion) {



    if (!fileRegion) return null;



    let curr = fileRegion.querySelector('.overflow-y-auto') ||



               fileRegion.querySelector('[style*="overflow-y: auto"]') ||



               fileRegion.querySelector('.flex.flex-col.h-full.w-full');



    if (curr) return curr;



    const all = fileRegion.querySelectorAll('*');



    for (const el of all) {



      if (el.scrollHeight > el.clientHeight && el.clientHeight > 200) {



        return el;



      }



    }



    return fileRegion;



  }







  function updateTocUI() {



    const container = findMarkdownContainer();



    if (!container) {



      removeTocUI();



      return;



    }







    const headings = findMarkdownHeadings(container);



    if (headings.length < 2) {



      removeTocUI();



      return;



    }







    // Attach floating capsule if not present



    let pill = document.getElementById('ag-md-toc-pill');



    if (!pill || !container.contains(pill)) {



      if (pill) pill.remove();



      pill = document.createElement('button');



      pill.id = 'ag-md-toc-pill';



      pill.title = '打开文档章节大纲与目录直达';



      pill.style.cssText = `



        position: absolute;



        top: 12px;



        right: 24px;



        z-index: 100;



        background: rgba(255, 255, 255, 0.94);



        backdrop-filter: blur(8px);



        -webkit-backdrop-filter: blur(8px);



        border: 1px solid rgba(0, 0, 0, 0.1);



        color: #1f1f1f;



        border-radius: 16px;



        padding: 5px 12px;



        font-size: 11.5px;



        font-weight: 600;



        cursor: pointer;



        display: flex;



        align-items: center;



        gap: 6px;



        box-shadow: 0 2px 10px rgba(60, 64, 67, 0.12);



        transition: all 0.2s ease;



        font-family: system-ui, -apple-system, sans-serif;



      `;



      pill.onmouseenter = () => {



        pill.style.background = '#ffffff';



        pill.style.boxShadow = '0 4px 14px rgba(60, 64, 67, 0.18)';



        pill.style.transform = 'translateY(-1px)';



      };



      pill.onmouseleave = () => {



        pill.style.background = 'rgba(255, 255, 255, 0.94)';



        pill.style.boxShadow = '0 2px 10px rgba(60, 64, 67, 0.12)';



        pill.style.transform = 'none';



      };



      pill.onclick = toggleTocPanel;



      container.style.position = 'relative';



      container.appendChild(pill);



      _activeTocPill = pill;



    }







    pill.innerHTML = `<span>📑</span><span>大纲 (${headings.length}节)</span>`;







    const panel = document.getElementById('ag-md-toc-panel');



    if (panel && panel.style.display !== 'none') {



      renderTocList(panel, headings, container);



    }



  }







  function toggleTocPanel() {



    let panel = document.getElementById('ag-md-toc-panel');



    if (panel) {



      if (panel.style.display === 'none') {



        panel.style.display = 'flex';



        renderTocList(panel, findMarkdownHeadings(container), container);



      } else {



        panel.style.display = 'none';



      }



      return;



    }







    const container = findMarkdownContainer();



    if (!container) return;







    panel = document.createElement('div');



    panel.id = 'ag-md-toc-panel';



    panel.style.cssText = `



      position: absolute;



      top: 48px;



      right: 24px;



      width: 280px;



      max-height: 480px;



      background: rgba(255, 255, 255, 0.96);



      backdrop-filter: blur(12px);



      -webkit-backdrop-filter: blur(12px);



      border: 1px solid rgba(0, 0, 0, 0.1);



      border-radius: 8px;



      box-shadow: 0 8px 28px rgba(60, 64, 67, 0.18);



      z-index: 101;



      display: flex;



      flex-direction: column;



      overflow: hidden;



      font-family: system-ui, -apple-system, sans-serif;



    `;







    panel.innerHTML = `



      <div style="height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 10px 0 14px;border-bottom:1px solid rgba(0,0,0,0.06);background:#f8f9fa;flex-shrink:0;">



        <span style="font-weight:600;color:#1f1f1f;font-size:12px;">📑 文档大纲</span>



        <button id="ag-md-toc-close" style="background:transparent;border:none;color:#5f6368;font-size:13px;cursor:pointer;padding:2px 6px;border-radius:4px;" title="关闭大纲">✖</button>



      </div>



      <div id="ag-md-toc-list" style="flex:1;overflow-y:auto;padding:8px 6px;display:flex;flex-direction:column;gap:2px;"></div>



    `;







    panel.querySelector('#ag-md-toc-close').onclick = () => {



      panel.style.display = 'none';



    };







    container.appendChild(panel);



    _activeTocPanel = panel;



    renderTocList(panel, findMarkdownHeadings(container), container);



  }







  function renderTocList(panel, headings, container) {



    const list = panel.querySelector('#ag-md-toc-list');



    if (!list) return;



    list.innerHTML = '';







    headings.forEach(h => {



      const item = document.createElement('div');



      item.className = 'ag-md-toc-item';



      item.dataset.headingIdx = String(h.index);



      const indent = (h.level - 1) * 12 + 6;



      const prefix = h.level === 1 ? '#' : (h.level === 2 ? '##' : '###');







      item.style.cssText = `



        padding: 5px 8px 5px ${indent}px;



        color: #1f1f1f;



        font-size: 11.5px;



        line-height: 1.4;



        cursor: pointer;



        border-radius: 5px;



        display: flex;



        align-items: center;



        gap: 6px;



        transition: background 0.15s;



        text-decoration: none;



      `;







      item.innerHTML = `



        <span style="color:#1a73e8;font-size:10px;font-family:Consolas,monospace;font-weight:bold;flex-shrink:0;">${prefix}</span>



        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${h.text}">${h.text}</span>



      `;







      item.onmouseenter = () => {



        if (!item.classList.contains('active')) item.style.background = '#f1f3f4';



      };



      item.onmouseleave = () => {



        if (!item.classList.contains('active')) item.style.background = 'transparent';



      };







      item.onclick = () => {



        h.element.scrollIntoView({ behavior: 'smooth', block: 'start' });



        list.querySelectorAll('.ag-md-toc-item').forEach(it => {



          it.classList.remove('active');



          it.style.background = 'transparent';



          it.style.color = '#1f1f1f';



          it.style.fontWeight = 'normal';



        });



        item.classList.add('active');



        item.style.background = '#e8f0fe';



        item.style.color = '#1a73e8';



        item.style.fontWeight = '600';



      };







      list.appendChild(item);



    });







    // Start Scroll Spy



    const scrollEl = findScrollContainer(container || findMarkdownContainer());



    if (scrollEl) {



      scrollEl.addEventListener('scroll', () => {



        if (_scrollSpyTimer) return;



        _scrollSpyTimer = setTimeout(() => {



          _scrollSpyTimer = null;



          const sRect = scrollEl.getBoundingClientRect();



          let activeH = null;



          for (let i = headings.length - 1; i >= 0; i--) {



            const hRect = headings[i].element.getBoundingClientRect();



            if (hRect.top <= sRect.top + 80) {



              activeH = headings[i];



              break;



            }



          }



          if (activeH) {



            list.querySelectorAll('.ag-md-toc-item').forEach(it => {



              if (it.dataset.headingIdx === String(activeH.index)) {



                it.classList.add('active');



                it.style.background = '#e8f0fe';



                it.style.color = '#1a73e8';



                it.style.fontWeight = '600';



                it.scrollIntoView({ behavior: 'smooth', block: 'nearest' });



              } else {



                it.classList.remove('active');



                it.style.background = 'transparent';



                it.style.color = '#1f1f1f';



                it.style.fontWeight = 'normal';



              }



            });



          }



        }, 100);



      }, { passive: true });



    }



  }







  function removeTocUI() {



    if (_activeTocPill) {



      _activeTocPill.remove();



      _activeTocPill = null;



    }



    if (_activeTocPanel) {



      _activeTocPanel.remove();



      _activeTocPanel = null;



    }



  }







  setInterval(updateTocUI, 600);



  window.addEventListener('popstate', () => setTimeout(updateTocUI, 50));



  updateTocUI();



})();



// --- Quote Shortcut Enhancer (Ctrl+L Alias & Glyph Clarity) ---

(() => {

  function initQuoteShortcutEnhancer() {

    if (window.__antigravityEnhancerProfile?.quoteShortcutAlias === false) return;

    // 1. Dual-track keydown listener: Map Ctrl+L / Cmd+L to Quote Selection in capture phase

    window.addEventListener('keydown', (e) => {

      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'l' || e.key === 'L' || e.code === 'KeyL')) {

        const sel = window.getSelection();

        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {

          const quoteBtn = document.querySelector('[data-testid="selection-quote-button"]');

          if (quoteBtn) {

            e.preventDefault();

            e.stopPropagation();

            quoteBtn.click();

            return;

          }

          // If popup not yet mounted (e.g. keyboard selection), dispatch native Ctrl+I

          const synthI = new KeyboardEvent('keydown', {

            key: 'i',

            code: 'KeyI',

            keyCode: 73,

            which: 73,

            ctrlKey: true,

            metaKey: e.metaKey,

            bubbles: true,

            cancelable: true

          });

          document.dispatchEvent(synthI);

        }

      }

    }, true);



    // 2. Monospace font for Quote badge to clearly distinguish capital I from lowercase l

    const styleId = '__antigravity_quote_badge_clarity';

    if (!document.getElementById(styleId)) {

      const style = document.createElement('style');

      style.id = styleId;

      style.textContent = `

        [data-testid="selection-quote-button"] span:last-child {

          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;

          font-weight: 600 !important;

          letter-spacing: 0.5px !important;

        }

      `;

      document.head.appendChild(style);

    }



    // 3. Observer to add clarifying tooltip to Quote button

    const observer = new MutationObserver(() => {

      const quoteBtn = document.querySelector('[data-testid="selection-quote-button"]');

      if (quoteBtn && !quoteBtn.hasAttribute('data-enhanced-tooltip')) {

        quoteBtn.setAttribute('data-enhanced-tooltip', 'true');

        quoteBtn.setAttribute('title', '快捷键：Ctrl+I（官方原生）或 Ctrl+L（增强套件兼容）');

      }

    });

    observer.observe(document.body, { childList: true, subtree: true });

  }



  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', initQuoteShortcutEnhancer);

  } else {

    initQuoteShortcutEnhancer();

  }

})();



})();

