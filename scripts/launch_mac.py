#!/usr/bin/env python3
"""Launch the current official Antigravity app with the persistent user plugin."""
import re
import json
import subprocess
import sys
import threading
import time
from pathlib import Path

from inspector_client import InspectorError, load_runtime

OFFICIAL_BINARY = Path('/Applications/Antigravity.app/Contents/MacOS/Antigravity')
PLUGIN_ROOT = Path.home() / '.gemini/config/plugins/antigravity-core-fixes'
RUNTIME = PLUGIN_ROOT / 'runtime/main.cjs'
LOG_DIR = Path.home() / 'Library/Logs/Antigravity Core Fixes'
INSPECTOR_RE = re.compile(r'Debugger listening on (ws://127\.0\.0\.1:\d+/[^\s]+)')


def plugin_enabled():
    config = Path.home() / '.gemini/config/config.json'
    try:
        state = json.loads(config.read_text(encoding='utf8')).get('plugins', {}).get('antigravity-core-fixes', {})
        return state.get('enabled', True) is not False
    except (OSError, ValueError, TypeError):
        return True


def official_pids():
    result = subprocess.run(['pgrep', '-f', r'^/Applications/Antigravity\.app/Contents/MacOS/Antigravity([[:space:]]|$)'], capture_output=True, text=True)
    return [int(value) for value in result.stdout.split() if value.isdigit()]


def ask_to_restart():
    script = 'display dialog "官方 Antigravity 已经在运行。请先保存工作；插件需要重启客户端才能挂载。" buttons {"取消", "退出并启用插件"} default button "退出并启用插件" cancel button "取消" with title "Antigravity Core Fixes"'
    if subprocess.run(['osascript', '-e', script], capture_output=True).returncode != 0: return False
    subprocess.run(['osascript', '-e', 'tell application id "com.google.antigravity" to quit'], capture_output=True)
    for _ in range(80):
        if not official_pids(): return True
        time.sleep(0.25)
    return False


def main():
    if not OFFICIAL_BINARY.exists(): raise SystemExit(f'未找到官方 Antigravity：{OFFICIAL_BINARY}')
    if not RUNTIME.exists(): raise SystemExit(f'插件运行时未安装：{RUNTIME}')
    if not plugin_enabled():
        passthrough = [arg for arg in sys.argv[1:] if not arg.startswith('-psn_') and arg != '--allow-secondary']
        return subprocess.call([str(OFFICIAL_BINARY), *passthrough])
    if official_pids() and '--allow-secondary' not in sys.argv and not ask_to_restart(): return 1
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / 'launcher.log'
    passthrough = [arg for arg in sys.argv[1:] if not arg.startswith('-psn_') and arg != '--allow-secondary']
    command = [str(OFFICIAL_BINARY), '--inspect-brk=0', *passthrough]
    with log_path.open('a', encoding='utf8') as log:
        log.write(f'\n[{time.strftime("%Y-%m-%d %H:%M:%S")}] launching {command!r}\n'); log.flush()
        process = subprocess.Popen(command, stdout=log, stderr=subprocess.PIPE, text=True, bufsize=1)
        inspector_url = None
        for line in process.stderr:
            log.write(line); log.flush()
            match = INSPECTOR_RE.search(line)
            if match:
                inspector_url = match.group(1); break
        if not inspector_url:
            process.terminate(); raise SystemExit('未能取得 Inspector 入口，插件未加载。请查看 launcher.log。')
        try:
            load_runtime(inspector_url, RUNTIME)
            log.write('[CoreFixes] persistent plugin injected; application resumed\n'); log.flush()
        except InspectorError as error:
            process.terminate(); raise SystemExit(f'插件挂载失败：{error}')

        def drain():
            for line in process.stderr: log.write(line); log.flush()
        threading.Thread(target=drain, daemon=True).start()
        return process.wait()


if __name__ == '__main__': raise SystemExit(main())
