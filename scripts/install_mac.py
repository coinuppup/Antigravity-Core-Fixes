#!/usr/bin/env python3
"""Build an isolated macOS copy of Antigravity with Core Fixes installed.

The official /Applications/Antigravity.app remains untouched and can continue
to receive normal Google updates. Run this script again after an official
update to refresh the isolated copy.
"""
import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import asar_utils
import install

OFFICIAL_APP = Path('/Applications/Antigravity.app')
DEST_APP = ROOT / 'Antigravity Core Fixes.app'
BUILD_APP = ROOT / '.Antigravity Core Fixes.build.app'
OLD_APP = ROOT / '.Antigravity Core Fixes.old.app'
ENTITLEMENTS = ROOT / 'scripts/Antigravity.entitlements'
ASAR_REL = Path('Contents/Resources/app.asar')
BACKUP_REL = Path('Contents/Resources/app.asar.original_backup')


def run(cmd, **kwargs):
    print('$', ' '.join(str(x) for x in cmd))
    return subprocess.run(cmd, **kwargs)


def destination_pids():
    exe = DEST_APP / 'Contents/MacOS/Antigravity'
    if not exe.exists():
        return []
    try:
        res = run(['pgrep', '-f', str(exe)], capture_output=True, text=True, check=False)
        return [int(x) for x in res.stdout.split() if x.isdigit()]
    except Exception:
        return []


def wait_for_destination_exit():
    import signal
    pids = destination_pids()
    if not pids:
        return
    print('请保存工作：正在退出已打开的 Antigravity Core Fixes...')
    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
    for _ in range(80):
        if not destination_pids():
            return
        time.sleep(0.25)
    raise RuntimeError('旧副本仍在运行，请手动退出后重试。')


def remove_path(path):
    if path.is_symlink() or path.is_file():
        path.unlink()
    elif path.exists():
        shutil.rmtree(path)


def build():
    if not OFFICIAL_APP.exists():
        raise RuntimeError(f'未找到官方客户端: {OFFICIAL_APP}')
    wait_for_destination_exit()
    remove_path(BUILD_APP)
    remove_path(OLD_APP)

    print(f'正在从官方 {OFFICIAL_APP} 创建独立副本...')
    run(['ditto', str(OFFICIAL_APP), str(BUILD_APP)], check=True)

    info = BUILD_APP / 'Contents/Info.plist'
    run(['/usr/libexec/PlistBuddy', '-c', 'Set :CFBundleDisplayName Antigravity Core Fixes', str(info)], check=False)

    target = BUILD_APP / ASAR_REL
    backup = BUILD_APP / BACKUP_REL
    if not backup.exists():
        shutil.copy2(target, backup)

    print('正在注入核心修复（始终基于当前官方版本构建，避免叠加补丁）...')
    packed = install.build_enhanced_asar(target)
    target.write_bytes(packed)

    _, files = asar_utils.read_asar(target.read_bytes())
    if install.MARKER.encode() not in files.get('dist/preload.js', b''):
        raise RuntimeError('生成的 ASAR 未包含修复标记，已中止安装。')
    import json
    version = json.loads(files.get('package.json', b'{}')).get('version', 'unknown')
    print(f'当前适配的官方版本: {version}')

    run(['codesign', '--force', '--deep', '--sign', '-', '--entitlements', str(ENTITLEMENTS), '--options', 'runtime', str(BUILD_APP)], check=True)
    verify = run(['codesign', '--verify', '--deep', '--strict', '--verbose=2', str(BUILD_APP)], capture_output=True, text=True)
    if verify.returncode != 0:
        raise RuntimeError('代码签名校验失败:\n' + verify.stdout + verify.stderr)

    if DEST_APP.exists():
        os.replace(DEST_APP, OLD_APP)
    try:
        os.replace(BUILD_APP, DEST_APP)
    except Exception:
        if OLD_APP.exists() and not DEST_APP.exists():
            os.replace(OLD_APP, DEST_APP)
        raise
    remove_path(OLD_APP)
    try:
        run(['xattr', '-dr', 'com.apple.quarantine', str(DEST_APP)], check=False, capture_output=True)
    except Exception:
        pass

    print()
    print('=' * 64)
    print('安装完成：Antigravity Core Fixes（独立副本）')
    print(f'位置: {DEST_APP}')
    print('官方原版未被修改:')
    print(f'  {OFFICIAL_APP}')
    print('官方客户端更新后，重新运行本命令即可自动适配新版本。')
    print('=' * 64)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--launch', action='store_true', help='构建完成后启动独立副本')
    args = parser.parse_args()
    build()
    if args.launch:
        run(['open', '-n', str(DEST_APP)], check=True)


if __name__ == '__main__':
    main()
