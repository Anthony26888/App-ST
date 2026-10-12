#!/bin/bash
# Khởi động backend CHÍNH an toàn: kiểm tra port trước, không chạy trùng process.
# - Luôn chạy từ thư mục backend/ để trúng database.db full (không dính file rỗng ở root).
# - Log ra logs/backend-prod.log (không mất khi restart máy như /tmp).
set -u
cd "$(dirname "$0")" || exit 1
mkdir -p logs
PORT_TO_USE="${PORT:-8080}"

HOLDER=$(lsof -ti :"$PORT_TO_USE" -sTCP:LISTEN 2>/dev/null | head -1)
if [ -n "${HOLDER:-}" ]; then
  echo "Port $PORT_TO_USE đang được PID $HOLDER giữ:"
  ps -o pid,etime,args -p "$HOLDER" 2>/dev/null || true
  echo "Dùng lại instance đang chạy (không start thêm để tránh EADDRINUSE)."
  echo "Muốn restart: kill $HOLDER && ./start-prod.sh"
  exit 0
fi

echo "Port $PORT_TO_USE trống - khởi động backend..."
PORT="$PORT_TO_USE" nohup node server.js > logs/backend-prod.log 2>&1 &
echo "Started pid $! (log: logs/backend-prod.log)"
