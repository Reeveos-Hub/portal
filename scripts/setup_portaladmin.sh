#!/bin/bash
# ═══════════════════════════════════════════════════
# Setup portaladmin.rezvo.app
# Run as root on VPS: bash /opt/rezvo-app/scripts/setup_portaladmin.sh
# ═══════════════════════════════════════════════════
set -e

DOMAIN="portaladmin.rezvo.app"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
NGINX_LINK="/etc/nginx/sites-enabled/$DOMAIN"

echo "═══ 1. Creating Nginx config (HTTP only first) ═══"
cat > "$NGINX_CONF" << 'NGINX'
server {
    listen 80;
    server_name portaladmin.rezvo.app;

    root /opt/rezvo-app/frontend/dist;
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

echo "  ✅ Nginx config written"

echo "═══ 2. Enabling site ═══"
ln -sf "$NGINX_CONF" "$NGINX_LINK"
nginx -t && systemctl reload nginx
echo "  ✅ Site enabled on HTTP"

echo "═══ 3. Getting SSL certificate ═══"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@rezvo.app --redirect || {
    echo ""
    echo "  ⚠️  Certbot failed. If DNS hasn't propagated yet, wait and re-run:"
    echo "  certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@rezvo.app --redirect"
    exit 0
}

echo "  ✅ SSL certificate installed"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ portaladmin.rezvo.app is LIVE"
echo "═══════════════════════════════════════════════════"
echo "  Admin:  https://portaladmin.rezvo.app/admin"
echo "  API:    https://portaladmin.rezvo.app/api/"
echo ""
