#!/bin/bash
# ═══════════════════════════════════════════════════
# Setup ReeveOS subdomains on VPS
# Run as root: bash /opt/rezvo-app/scripts/setup_reeveos.sh
# ═══════════════════════════════════════════════════
set -e

DOMAINS=("adminportal.reeveos.app" "webportal.reeveos.app" "book.reeveos.app")
FRONTEND_ROOT="/opt/rezvo-app/frontend/dist"
BACKEND="http://127.0.0.1:8000"

for DOMAIN in "${DOMAINS[@]}"; do
  NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
  NGINX_LINK="/etc/nginx/sites-enabled/$DOMAIN"

  echo ""
  echo "═══ Setting up $DOMAIN ═══"

  # Step 1: Write Nginx config (HTTP first for certbot)
  cat > "$NGINX_CONF" << NGINX
server {
    listen 80;
    server_name $DOMAIN;

    root $FRONTEND_ROOT;
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api/ {
        proxy_pass $BACKEND/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

  echo "  ✅ Nginx config written"

  # Step 2: Enable site
  ln -sf "$NGINX_CONF" "$NGINX_LINK"
  echo "  ✅ Site enabled"

done

# Test and reload nginx
echo ""
echo "═══ Testing Nginx config ═══"
nginx -t && systemctl reload nginx
echo "  ✅ Nginx reloaded"

# Step 3: Get SSL certificates for all domains
echo ""
echo "═══ Getting SSL certificates ═══"
for DOMAIN in "${DOMAINS[@]}"; do
  echo "  → $DOMAIN"
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@reeveos.app --redirect 2>&1 | tail -3 || {
    echo "  ⚠️  Certbot failed for $DOMAIN — DNS may not have propagated yet"
    echo "  Retry later: certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@reeveos.app --redirect"
  }
  echo ""
done

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ReeveOS domains setup complete"
echo "═══════════════════════════════════════════════════"
echo "  Admin:     https://adminportal.reeveos.app/"
echo "  Dashboard: https://webportal.reeveos.app/"
echo "  Booking:   https://book.reeveos.app/"
echo ""
