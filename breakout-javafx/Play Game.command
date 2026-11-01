#!/bin/zsh
# Double-click this file to play Neon Breakout.
# It starts the game from its own folder, wherever this file is.
HERE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

if [ ! -x "$HERE/run.sh" ]; then
    echo "Neon Breakout: could not find run.sh next to this launcher."
    echo "Expected it in: $HERE"
    echo
    echo "Keep this file inside the breakout-javafx folder,"
    echo "or use the shortcut on the Desktop instead."
    echo
    read -k1 "?Press any key to close…"
    exit 1
fi

cd "$HERE" || exit 1
exec ./run.sh
