#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Shravya AI Lite — startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Check Ollama
if ! command -v ollama &>/dev/null; then
  echo "[ERROR] Ollama not found. Install it: https://ollama.com/download"
  exit 1
fi

# Start Ollama in background if not already running
if ! curl -s http://localhost:11434 &>/dev/null; then
  echo "[INFO] Starting Ollama…"
  ollama serve &>/tmp/ollama.log &
  sleep 2
fi

# Pull model if not present
echo "[INFO] Pulling qwen2.5:1.5b (skipped if already downloaded)…"
ollama pull qwen2.5:1.5b

# 2. Start backend
echo "[INFO] Starting FastAPI backend on http://localhost:8000"
cd "$ROOT/backend"
venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 3. Start frontend
echo "[INFO] Starting React frontend on http://localhost:3000"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  App ready at → http://localhost:3000"
echo "  API ready at → http://localhost:8000"
echo "  Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait and clean up on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait
