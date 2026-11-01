#!/bin/zsh
# Launches the JavaFX game. Safe to double-click in Finder? No — run it from Terminal:
#   ./run.sh
set -e
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$HOME/tools/apache-maven-3.9.16/bin:$PATH"
cd "$(dirname "$0")"
exec mvn -q javafx:run
