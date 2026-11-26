#!/usr/bin/env python3
"""Install the update-safe Antigravity Core Fixes user plugin and launcher."""
import argparse
import os
import plistlib
import shutil
import stat
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OFFICIAL_APP = Path('/Applications/Antigravity.app')
PLUGIN_SOURCE = ROOT / 'plugin'
PLUGIN_DEST = Path.home() / '.gemini/config/plugins/antigravity-core-fixes'
LAUNCHER_APP = ROOT / 'Antigravity Core Fixes.app'
BUILD_APP = ROOT / '.Antigravity Core Fixes.build.app'
OLD_APP = ROOT / '.Antigravity Core Fixes.old.app'
CORE_FILES = ('desktop_compat.js', 'office_router.js', 'chat_enhancer.js', 'startup_recovery.cjs')
ASSET_FILES = ('xlsx.full.min.js', 'jszip.min.js', 'docx-preview.min.js', 'PptxViewJS.min.js')


def remove_path(target):
    if target.is_symlink() or target.is_file(): target.unlink()
    elif target.exists(): shutil.rmtree(target)


def official_version():
    try:
        with (OFFICIAL_APP / 'Contents/Info.plist').open('rb') as stream:
            return plistlib.load(stream).get('CFBundleShortVersionString', 'unknown')
    except Exception: return 'unknown'


def install_plugin():
    staging = PLUGIN_DEST.with_name(PLUGIN_DEST.name + '.installing')
    old = PLUGIN_DEST.with_name(PLUGIN_DEST.name + '.old')
    remove_path(staging); remove_path(old)
    shutil.copytree(PLUGIN_SOURCE, staging)
    (staging / 'core').mkdir(); (staging / 'assets').mkdir()
    for name in CORE_FILES: shutil.copy2(ROOT / 'core' / name, staging / 'core' / name)
    for name in ASSET_FILES: shutil.copy2(ROOT / 'assets' / name, staging / 'assets' / name)
    PLUGIN_DEST.parent.mkdir(parents=True, exist_ok=True)
    if PLUGIN_DEST.exists(): os.replace(PLUGIN_DEST, old)
    try: os.replace(staging, PLUGIN_DEST)
    except Exception:
        if old.exists() and not PLUGIN_DEST.exists(): os.replace(old, PLUGIN_DEST)
        raise
    remove_path(old)


def sync_support_scripts():
    target = PLUGIN_DEST / 'scripts'; target.mkdir(exist_ok=True)
    for name in ('launch_mac.py', 'inspector_client.py'): shutil.copy2(ROOT / 'scripts' / name, target / name)


def build_launcher():
    remove_path(BUILD_APP); remove_path(OLD_APP)
    macos = BUILD_APP / 'Contents/MacOS'; resources = BUILD_APP / 'Contents/Resources'
    macos.mkdir(parents=True); resources.mkdir(parents=True)
    executable = macos / 'Antigravity Core Fixes'
    executable.write_text('#!/bin/zsh\nexec /usr/bin/python3 ' + repr(str(PLUGIN_DEST / 'scripts/launch_mac.py')) + ' "$@"\n', encoding='utf8')
    executable.chmod(executable.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    info = {
        'CFBundleName': 'Antigravity Core Fixes', 'CFBundleDisplayName': 'Antigravity Core Fixes',
        'CFBundleIdentifier': 'local.antigravity.core-fixes', 'CFBundleVersion': '2.0.0',
        'CFBundleShortVersionString': '2.0.0', 'CFBundlePackageType': 'APPL',
        'CFBundleExecutable': executable.name, 'NSHighResolutionCapable': True,
    }
    icons = list((OFFICIAL_APP / 'Contents/Resources').glob('*.icns'))
    if icons:
        shutil.copy2(icons[0], resources / 'AppIcon.icns'); info['CFBundleIconFile'] = 'AppIcon.icns'
    with (BUILD_APP / 'Contents/Info.plist').open('wb') as stream: plistlib.dump(info, stream)
    subprocess.run(['codesign', '--force', '--deep', '--sign', '-', str(BUILD_APP)], check=True, capture_output=True)
    if LAUNCHER_APP.exists(): os.replace(LAUNCHER_APP, OLD_APP)
    try: os.replace(BUILD_APP, LAUNCHER_APP)
    except Exception:
        if OLD_APP.exists() and not LAUNCHER_APP.exists(): os.replace(OLD_APP, LAUNCHER_APP)
        raise
    remove_path(OLD_APP)


def check():
    print(f'官方 Antigravity: {official_version()} ({OFFICIAL_APP})')
    print(f'用户插件: {"已安装" if (PLUGIN_DEST / "runtime/main.cjs").exists() else "未安装"} ({PLUGIN_DEST})')
    print(f'稳定启动器: {"已安装" if LAUNCHER_APP.exists() else "未安装"} ({LAUNCHER_APP})')
    print('官方 app.asar: 不修改')


def install(launch=False):
    if not OFFICIAL_APP.exists(): raise RuntimeError(f'未找到官方客户端：{OFFICIAL_APP}')
    install_plugin(); sync_support_scripts(); build_launcher()
    print('安装完成：用户级插件与稳定启动器已更新。')
    print(f'插件：{PLUGIN_DEST}')
    print(f'启动器：{LAUNCHER_APP}')
    print('今后官方 Antigravity 更新不会覆盖插件；请始终从该启动器打开。')
    if launch: subprocess.run(['open', '-n', str(LAUNCHER_APP)], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true'); parser.add_argument('--launch', action='store_true')
    args = parser.parse_args()
    if args.check: check()
    else: install(args.launch)


if __name__ == '__main__':
    try: main()
    except Exception as error:
        print(f'[错误] {error}', file=sys.stderr); raise SystemExit(1)
