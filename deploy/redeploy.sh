#!/usr/bin/env bash
# ============================================================
#  Shravya AI Lite — Update script (run to redeploy backend)
# ============================================================
set -e

cd /opt/Shravya_AI
git pull origin main

cd backend
docker build -t shravya-backend .
docker rm -f shravya-backend 2>/dev/null || true
docker run -d \
  --name shravya-backend \
  --restart unless-stopped \
  -p 127.0.0.1:8000:8000 \
  -e OLLAMA_URL=http://host-gateway:11434/api/chat \
  -e ALLOWED_ORIGINS=https://pihu.drive.lol \
  --add-host=host-gateway:host-gateway \
  shravya-backend

echo "Backend redeployed!"
