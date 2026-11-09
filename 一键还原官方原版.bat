@echo off
chcp 65001 >nul
title Antigravity 核心修复套件 - 一键官方原版还原

echo ====================================================================
echo                 Antigravity 核心修复套件 - 还原官方原版
echo ====================================================================
echo.

python "%~dp0scripts\install.py" --restore

echo.
echo 请按任意键退出...
pause >nul
