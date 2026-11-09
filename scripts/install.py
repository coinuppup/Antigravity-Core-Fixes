"""
Antigravity 核心修复套件 (Antigravity Core Fixes Kit) - 一键安装器

专为 Windows Antigravity 客户端打造，覆盖三大类核心体验修复：
1. PDF 文献阅读器（跨页高亮几何对其、多栏防串选、选词锚点对齐、居中平滑缩放、超链接与回退胶囊、框选提问与原生主题浮层）
2. 工作区与界面交互（目录树折叠同步、周配额格式直观化、方案 Proceed 草稿合并、聊天大图 380px 约束、图片高对比度细轨滚动条）
3. Office 三件套与数据表格离线高保真浅色预览（PPTX JSZip 依赖修复、Excel/CSV 浅色无撕裂表格、Word 纸张排版）

纯 Python 标准库编写，零 pip 依赖，零 npm 依赖。
"""

import argparse
import copy
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import asar_utils
from asar_utils import repack
from asar_snippets import IPC_HANDLERS_SNIPPET, PRELOAD_BRIDGE_SNIPPET

DEFAULT_ASAR = Path(os.environ.get('LOCALAPPDATA', '')) / 'Programs/antigravity/resources/app.asar'
PERMANENT_DIR = Path.home() / '.gemini/antigravity/tools/Antigravity-Core-Fixes'
MARKER = '// ANTIGRAVITY_DESKTOP_FIXES'
ASSETS = ('xlsx.full.min.js', 'jszip.min.js', 'docx-preview.min.js', 'PptxViewJS.min.js')
MODULES = (
    'desktop_compat.js',
    'office_router.js',
    'chat_enhancer.js',
)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def check_js(name, data):
    node = shutil.which('node') or os.environ.get('ANTIGRAVITY_NODE', 'node')
    try:
        result = subprocess.run([node, '--check'], input=data, capture_output=True)
        if result.returncode != 0:
            print(f"[警告] JS 语法检查未通过 ({name}): {result.stderr.decode('utf-8', errors='replace').strip()}")
    except Exception:
        pass


def is_antigravity_running():
    try:
        query = "Get-CimInstance Win32_Process -Filter \"Name='Antigravity.exe'\" | Select-Object -ExpandProperty ProcessId"
        res = subprocess.run(['powershell', '-NoProfile', '-Command', query], capture_output=True, text=True)
        return bool(res.stdout.strip())
    except Exception:
        return False


def close_antigravity():
    print("正在尝试关闭 Antigravity 进程...")
    try:
        subprocess.run(['powershell', '-NoProfile', '-Command', "Stop-Process -Name 'Antigravity' -Force -ErrorAction SilentlyContinue"], capture_output=True)
        time.sleep(1.5)
    except Exception:
        pass


def once(text, anchor, replacement):
    if text.count(anchor) != 1:
        raise RuntimeError(f"锚点匹配失败 (匹配到 {text.count(anchor)} 处): {anchor[:80]}")
    return text.replace(anchor, replacement, 1)


def add_entry(header, name, data):
    node = header['files']
    parts = name.split('/')
    for part in parts[:-1]:
        node = node.setdefault(part, {'files': {}})['files']
    if parts[-1] in node:
        return
    node[parts[-1]] = {'size': len(data), 'offset': '0'}


def sync_to_permanent_store():
    PERMANENT_DIR.mkdir(parents=True, exist_ok=True)
    (PERMANENT_DIR / 'core').mkdir(parents=True, exist_ok=True)
    (PERMANENT_DIR / 'assets').mkdir(parents=True, exist_ok=True)

    for m in MODULES:
        shutil.copy2(ROOT / 'core' / m, PERMANENT_DIR / 'core' / m)
    recovery = ROOT / 'core' / 'startup_recovery.cjs'
    if recovery.exists():
        shutil.copy2(recovery, PERMANENT_DIR / 'core' / 'startup_recovery.cjs')

    for a in ASSETS:
        src = ROOT / 'assets' / a
        if src.exists():
            shutil.copy2(src, PERMANENT_DIR / 'assets' / a)
    return PERMANENT_DIR


def build_enhanced_asar(target_asar):
    store_dir = sync_to_permanent_store()
    original_bytes = target_asar.read_bytes()
    header, baseline = asar_utils.read_asar(original_bytes)

    if any(MARKER.encode() in baseline[key] for key in ('dist/preload.js', 'dist/ipcHandlers.js')):
        print("[提示] 检测到当前 ASAR 已包含增强标记，将基于备份或当前状态更新...")

    files = dict(baseline)
    header = copy.deepcopy(header)

    # 1. 注入离线 Office 解析库资产
    for asset in ASSETS:
        key = 'dist/office_viewer/' + asset
        asset_file = store_dir / 'assets' / asset
        if not asset_file.exists():
            asset_file = ROOT / 'assets' / asset
        data = asset_file.read_bytes()
        files[key] = data
        add_entry(header, key, data)

    # 2. 注入 IPC 处理程序
    ipc = files['dist/ipcHandlers.js'].decode('utf-8', errors='replace')
    if MARKER not in ipc:
        snippet = IPC_HANDLERS_SNIPPET.replace('electron_1.BrowserWindow.getAllWindows()', '(0, utils_1.getHubWindows)()')
        snippet = once(snippet, '            const buf = await fs.readFile(target);', """            const officeLimit = 100 * 1024 * 1024;
            const isOffice = /\\.(docx|xlsx|xls|pptx)$/i.test(target);
            let buf;
            if (isOffice) {
                const handle = await fs.open(target, 'r');
                try {
                    const info = await handle.stat();
                    if (info.size > officeLimit) return {__agFileError:'OFFICE_PREVIEW_TOO_LARGE', size:info.size, maxBytes:officeLimit};
                    buf = await handle.readFile();
                    if (buf.byteLength > officeLimit) return {__agFileError:'OFFICE_PREVIEW_TOO_LARGE', size:buf.byteLength, maxBytes:officeLimit};
                } finally { await handle.close(); }
            } else { buf = await fs.readFile(target); }""")

        a = snippet.index("    electron_1.ipcMain.handle('antigravity:read-file-text'")
        b = snippet.index("    electron_1.ipcMain.handle('antigravity:get-office-asset'", a)
        snippet = snippet[:a] + """    electron_1.ipcMain.handle('antigravity:read-file-text', async (_event, filePath) => {
        try {
            const cleanPath = __toCleanLocalPath(filePath);
            if (!cleanPath) return null;
            return await fs.readFile(cleanPath, 'utf8');
        } catch (_) { return null; }
    });
""" + snippet[b:]

        snippet = snippet.replace("['-NoProfile', '-NonInteractive', '-Sta', '-EncodedCommand', encoded], (err)", "['-NoProfile', '-NonInteractive', '-Sta', '-EncodedCommand', encoded], {windowsHide:true}, (err)")
        snippet = snippet.replace("['-c', pyCode], (err, stdout)", "['-c', pyCode], {windowsHide:true}, (err, stdout)")

        ipc = once(ipc, 'function registerIpcHandlers(storageManager) {',
                   'function registerIpcHandlers(storageManager) {\n    ' + MARKER + '\n' + snippet)

        ipc = once(ipc, 'electron_1.shell.showItemInFolder((0, url_1.fileURLToPath)(path));',
                   "electron_1.shell.showItemInFolder(typeof path === 'string' && /^[A-Za-z]:[\\\\/]/.test(path) ? require('path').normalize(path) : (0, url_1.fileURLToPath)(path));")
        files['dist/ipcHandlers.js'] = ipc.encode('utf-8')

    # 3. 注入 Preload 运行时加载器
    preload = files['dist/preload.js'].decode('utf-8', errors='replace')
    if MARKER not in preload:
        module_paths = [str(store_dir / 'core' / m).replace('\\', '/') for m in MODULES]
        loader = f"""
{MARKER}
(() => {{
    let started = false;
    async function startEnhancer() {{
        if (started || location.protocol !== 'https:' || location.hostname !== '127.0.0.1') return;
        started = true;
        const modulePaths = {json.dumps(module_paths)};
        for (const modulePath of modulePaths) {{
            try {{
                const source = await electron_1.ipcRenderer.invoke('antigravity:read-file-text', modulePath);
                if (!source) throw new Error('Enhancer module unavailable: ' + modulePath);
                await electron_1.webFrame.executeJavaScript(source);
            }} catch (error) {{ console.error('[AntigravityFixes]', error); }}
        }}
    }}
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startEnhancer, {{once:true}});
    else void startEnhancer();
}})();
"""
        preload += '\n' + PRELOAD_BRIDGE_SNIPPET + '\n' + loader
        files['dist/preload.js'] = preload.encode('utf-8')

    # 4. 注入启动防假死容错守护
    utils = files['dist/utils.js'].decode('utf-8', errors='replace')
    if 'ANTIGRAVITY_STARTUP_RECOVERY' not in utils:
        recovery_path = str(store_dir / 'core' / 'startup_recovery.cjs').replace('\\', '/')
        utils = once(utils, '    void win.loadURL(url);',
                     '    // ANTIGRAVITY_STARTUP_RECOVERY\n'
                     '    try { require(' + json.dumps(recovery_path) + ').attach(win); } catch (error) { console.warn("[StartupRecovery]", error.message); }\n'
                     '    win.loadURL(url).catch(error => console.warn("[StartupRecovery] Initial local load failed:", error.code || error.message));')
        files['dist/utils.js'] = utils.encode('utf-8')

    for name in ('dist/preload.js', 'dist/ipcHandlers.js', 'dist/utils.js'):
        check_js(name, files[name])

    packed = repack(header, files)
    return packed


def check_status(target_asar):
    print("=" * 60)
    print("        Antigravity 核心修复套件 - 状态诊断")
    print("=" * 60)
    print(f"目标 ASAR 路径: {target_asar}")
    if not target_asar.exists():
        print("[状态] ✗ 找不到目标 app.asar，请确认 Antigravity 是否已正确安装。")
        return False

    backup_path = target_asar.with_name('app.asar.original_backup')
    has_backup = backup_path.exists()
    print(f"官方原版备份: {'✓ 已存在 (' + str(backup_path) + ')' if has_backup else '○ 尚未备份 (安装时将自动创建)'}")

    running = is_antigravity_running()
    print(f"客户端进程: {'● 正在运行 (安装需退出应用)' if running else '○ 已退出 (可直接执行安装)'}")

    try:
        _, baseline = asar_utils.read_asar(target_asar.read_bytes())
        pkg_version = json.loads(baseline.get('package.json', b'{}')).get('version', '未知')
        is_patched = MARKER.encode() in baseline.get('dist/preload.js', b'')
        print(f"客户端版本: {pkg_version}")
        print(f"修复套件状态: {'✓ [已安装且生效中]' if is_patched else '○ [未安装官方原版]'}")
    except Exception as e:
        print(f"[错误] 读取 ASAR 失败: {e}")
        return False

    print("=" * 60)
    return True


def install(target_asar, force_close=False):
    if not target_asar.exists():
        print(f"[错误] 目标 ASAR 不存在: {target_asar}")
        sys.exit(1)

    backup_path = target_asar.with_name('app.asar.original_backup')
    if not backup_path.exists():
        print("首次安装，正在备份官方原版 app.asar ...")
        shutil.copy2(target_asar, backup_path)
        print(f"✓ 官方原版已安全备份至: {backup_path}")

    # 优先从原版备份构建，避免重复修补
    source_asar = backup_path if backup_path.exists() else target_asar

    print("正在编译核心修复套件 (PDF文献增强 / 界面交互修复 / Office离线预览) ...")
    packed_bytes = build_enhanced_asar(source_asar)
    print(f"✓ 新 ASAR 镜像已构建完成 (体积: {len(packed_bytes)} 字节)")

    if is_antigravity_running():
        if force_close:
            close_antigravity()
        else:
            print("\n[提示] 检测到 Antigravity 正在运行中。")
            print("请保存好正在进行的工作，并在键盘上按回车键关闭客户端完成最后一步替换：")
            input("按回车继续...")
            close_antigravity()

    # 替换目标 ASAR
    try:
        temp_target = target_asar.with_suffix('.asar.new')
        temp_target.write_bytes(packed_bytes)
        # Windows 文件原子重命名/替换
        temp_target.replace(target_asar)
        print("\n" + "=" * 60)
        print("🎉 Antigravity 核心修复套件安装成功！")
        print("三大核心功能已全部注入生效：")
        print("  1. PDF 文献阅读器（几何0漂移搜索高亮、多栏防串选、平滑居中缩放、超链接回退、原生评论卡片）")
        print("  2. 工作区与界面交互（目录树折叠同步、周配额倒计时直观化、方案草稿合并、聊天大图防刷屏）")
        print("  3. Office 三件套与表格（PPTX依赖修复、Excel/CSV 浅色极简对齐、Word 高保真排版）")
        print("现在您可以重新打开 Antigravity 客户端尽情体验了！")
        print("=" * 60 + "\n")
    except Exception as e:
        print(f"\n[错误] 替换 app.asar 失败 (文件可能被占用): {e}")
        print("请确保任务管理器中所有 Antigravity 进程已退出后重试。")
        sys.exit(1)


def restore(target_asar):
    backup_path = target_asar.with_name('app.asar.original_backup')
    if not backup_path.exists():
        print(f"[提示] 未找到官方备份文件 ({backup_path})，当前可能已是原版。")
        return

    if is_antigravity_running():
        print("\n[提示] 还原需要退出客户端，请保存好工作。")
        input("按回车退出客户端并还原官方原版...")
        close_antigravity()

    try:
        shutil.copy2(backup_path, target_asar)
        print("\n" + "=" * 60)
        print("✓ 已成功还原为 100% 纯净官方原版 app.asar！")
        print("所有增强逻辑已完全卸载移除。")
        print("=" * 60 + "\n")
    except Exception as e:
        print(f"[错误] 还原失败: {e}")


def main():
    parser = argparse.ArgumentParser(description="Antigravity 核心修复套件安装管理程序")
    parser.add_argument('--check', action='store_true', help='检查当前客户端与修复套件安装状态')
    parser.add_argument('--install', action='store_true', help='执行一键修复安装')
    parser.add_argument('--restore', action='store_true', help='一键还原至官方纯净原版')
    parser.add_argument('--force-close', action='store_true', help='安装时自动强制关闭 Antigravity 进程')
    parser.add_argument('--asar', type=Path, default=DEFAULT_ASAR, help='指定自定义的 app.asar 路径')
    args = parser.parse_args()

    target_asar = args.asar.resolve()

    if args.restore:
        restore(target_asar)
    elif args.install:
        install(target_asar, force_close=args.force_close)
    elif args.check:
        check_status(target_asar)
    else:
        # 默认无参数时：先检查，若未安装则提供交互菜单
        check_status(target_asar)
        print("\n请选择您要执行的操作:")
        print("  [1] 安装 / 修复 Antigravity 核心增强")
        print("  [2] 还原官方原版")
        print("  [0] 退出")
        choice = input("\n请输入数字 [1/2/0] (默认 1): ").strip()
        if choice in ('1', ''):
            install(target_asar, force_close=False)
        elif choice == '2':
            restore(target_asar)


if __name__ == '__main__':
    main()
