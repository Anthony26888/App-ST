#!/bin/bash
# Khởi động backend TEST an toàn (DB copy + port 3001, localhost only).
set -u
cd "$(dirname "$0")" || exit 1
mkdir -p logs

if [ ! -f "./database.test.db" ]; then
  echo "Chưa có database.test.db - snapshot từ DB chính..."
  cp ./database.db ./database.test.db
fi

HOLDER=$(lsof -ti :3001 -sTCP:LISTEN 2>/dev/null | head -1)
if [ -n "${HOLDER:-}" ]; then
  echo "Port 3001 đang được PID $HOLDER giữ - dùng lại instance đang chạy."
  exit 0
fi

echo "Khởi động backend test..."
DB_PATH=./database.test.db PORT=3001 nohup node server.js > logs/backend-test.log 2>&1 &
echo "Started pid $! (log: logs/backend-test.log, DB: database.test.db)"
