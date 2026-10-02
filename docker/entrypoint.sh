#!/bin/sh
set -eu

# Linux dependencies live in a Docker volume, separate from macOS node_modules.
expected=$(cat /opt/stardust/dependencies/.stardust-lock)
actual=$(sha256sum /workspace/pnpm-lock.yaml | cut -d ' ' -f 1)
if [ "$actual" != "$expected" ]; then
  echo '依赖锁文件已变化，请运行 docker compose up -d --build。' >&2
  exit 1
fi
installed=$(cat /workspace/node_modules/.stardust-lock 2>/dev/null || true)
if [ "$installed" != "$expected" ]; then
  mkdir -p /workspace/node_modules
  cp -a /opt/stardust/dependencies/. /workspace/node_modules/
fi
pnpm exec tsx scripts/local/boot.ts

if [ -n "${GH_TOKEN:-}" ]; then
  gh auth setup-git --hostname github.com >/dev/null 2>&1 || {
    echo 'GitHub 凭据配置失败，请检查 GH_TOKEN。' >&2
    exit 1
  }
  export STARDUST_GITHUB_CREDENTIAL=1
fi

nginx -t
nginx -g 'daemon off;' &
nginx_pid=$!
"$@" &
app_pid=$!

cleanup() {
  kill "$nginx_pid" "$app_pid" 2>/dev/null || true
  wait "$nginx_pid" "$app_pid" 2>/dev/null || true
}
trap 'cleanup; exit 143' INT TERM

while kill -0 "$nginx_pid" 2>/dev/null && kill -0 "$app_pid" 2>/dev/null; do
  sleep 1
done

set +e
if kill -0 "$app_pid" 2>/dev/null; then
  wait "$nginx_pid"
  status=$?
else
  wait "$app_pid"
  status=$?
fi
cleanup
exit "$status"
