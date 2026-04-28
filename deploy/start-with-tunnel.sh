#!/usr/bin/env bash
# ============================================================
#  Start Shravya AI Lite with Cloudflare Tunnel
#  Runs on YOUR MACHINE — no VPS needed
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Shravya AI Lite — Local + Cloudflare"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Start Ollama if not running
if ! curl -s http://localhost:11434 &>/dev/null; then
  echo "[INFO] Starting Ollama…"
  ollama serve &>/tmp/ollama.log &
  sleep 3
fi

# 2. Start FastAPI backend
echo "[INFO] Starting FastAPI backend on :8000"
cd "$ROOT/backend"
ALLOWED_ORIGINS="http://localhost:3000,https://shravya.pihudrive.lol" \
  venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 3. Start Cloudflare Tunnel (exposes :8000 as api.pihudrive.lol)
echo "[INFO] Starting Cloudflare Tunnel for api.pihudrive.lol"
cloudflared tunnel --config "$ROOT/deploy/cloudflare-tunnel.yml" run shravya-ai &
TUNNEL_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  API live at → https://api.pihudrive.lol"
echo "  Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

trap "kill $BACKEND_PID $TUNNEL_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait
