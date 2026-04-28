#!/usr/bin/env bash
# ============================================================
#  Shravya AI Lite — VPS Setup Script
#  Run once on a fresh Ubuntu 22.04/24.04 VPS as root or sudo
# ============================================================
set -e

echo "==> Updating system packages"
apt update && apt upgrade -y

echo "==> Installing Docker"
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

echo "==> Installing Ollama"
curl -fsSL https://ollama.com/install.sh | sh
systemctl enable ollama
systemctl start ollama

echo "==> Pulling Qwen 1.5B model"
ollama pull qwen2.5:1.5b

echo "==> Installing Nginx + Certbot"
apt install -y nginx certbot python3-certbot-nginx

echo "==> Writing Nginx config"
cat > /etc/nginx/sites-available/shravya <<'NGINX'
server {
    listen 80;
    server_name api.pihu.drive.lol;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/shravya /etc/nginx/sites-enabled/shravya
nginx -t && systemctl reload nginx

echo "==> Building and running FastAPI backend"
cd /opt
git clone https://github.com/YOUR_GITHUB_USERNAME/Shravya_AI.git || true
cd Shravya_AI/backend

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

echo ""
echo "============================================================"
echo " Backend running at http://api.pihu.drive.lol (HTTP only)"
echo " Next: run certbot to enable HTTPS"
echo "   certbot --nginx -d api.pihu.drive.lol"
echo "============================================================"
