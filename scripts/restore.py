"""
Antigravity 核心修复套件 - 一键官方原版还原脚本
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
import install

if __name__ == '__main__':
    install.restore(install.DEFAULT_ASAR)
