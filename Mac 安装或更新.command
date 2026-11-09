#!/bin/bash
cd "$(dirname "$0")" || exit 1
/usr/bin/env python3 scripts/install_mac.py "$@"
printf '\n按回车退出...'
read -r _
