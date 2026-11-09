@echo off
chcp 65001 >nul
title Antigravity 核心修复套件 - 一键安装程序

echo ====================================================================
echo                 Antigravity 核心修复套件一键安装器
echo ====================================================================
echo.
echo 包含三大核心体验修复：
echo   1. PDF 文献阅读器（几何0漂移搜索高亮、多栏防串选、平滑居中缩放、超链接回退、原生评论卡片）
echo   2. 工作区与界面交互（目录树折叠同步、周配额倒计时直观化、方案草稿合并、聊天大图防刷屏）
echo   3. Office 三件套与表格（PPTX依赖修复、Excel/CSV 浅色极简对齐、Word 高保真排版）
echo.
echo ====================================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 系统中未找到 Python，请先安装 Python 3.8+ 后重试。
    pause
    exit /b 1
)

python "%~dp0scripts\install.py" %*

echo.
echo 请按任意键退出...
pause >nul
