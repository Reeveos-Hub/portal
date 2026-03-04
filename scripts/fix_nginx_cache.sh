#!/bin/bash
# ═══════════════════════════════════════════════════
# Fix Nginx cache headers — ensures deploys are instant
# Run as root: bash /opt/rezvo-app/scripts/fix_nginx_cache.sh
# ═══════════════════════════════════════════════════
set -e

DOMAINS=("adminportal.reeveos.app" "webportal.reeveos.app" "book.reeveos.app")

# Create shared cache snippet
cat > /etc/nginx/snippets/reeveos-cache.conf << 'SNIPPET'
# ── ReeveOS Cache Control ──────────────────────────
# index.html: NEVER cache — ensures new deploys load instantly
location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    try_files $uri /index.html;
}

# Vite hashed assets: cache forever (hash changes on each build)
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    try_files $uri =404;
}

# Favicon, manifest, robots: short cache
location ~* \.(ico|webmanifest|txt)$ {
    add_header Cache-Control "public, max-age=3600" always;
}
# ── End ReeveOS Cache Control ──────────────────────
SNIPPET

echo "✅ Cache snippet written to /etc/nginx/snippets/reeveos-cache.conf"

# Inject include into each domain's SSL server block
for DOMAIN in "${DOMAINS[@]}"; do
  CONF="/etc/nginx/sites-available/$DOMAIN"
  
  if [ ! -f "$CONF" ]; then
    echo "⏭️  $DOMAIN — no config, skipping"
    continue
  fi

  # Check if already included
  if grep -q "reeveos-cache" "$CONF"; then
    echo "✅ $DOMAIN — already has cache snippet"
    continue
  fi

  # Backup
  cp "$CONF" "${CONF}.bak"

  # Insert include line right after "root /opt/rezvo-app/frontend/dist;"
  # This works in both HTTP and SSL server blocks
  sed -i '/root \/opt\/rezvo-app\/frontend\/dist;/a\    include snippets/reeveos-cache.conf;' "$CONF"
  
  echo "✅ $DOMAIN — cache snippet included"
done

echo ""
echo "Testing Nginx config..."
if nginx -t 2>&1; then
  systemctl reload nginx
  echo "✅ Nginx reloaded — cache headers active"
else
  echo "❌ Config test failed — restoring backups"
  for DOMAIN in "${DOMAINS[@]}"; do
    BAK="/etc/nginx/sites-available/${DOMAIN}.bak"
    [ -f "$BAK" ] && mv "$BAK" "/etc/nginx/sites-available/$DOMAIN"
  done
  nginx -t && systemctl reload nginx
  echo "✅ Restored from backups"
  exit 1
fi

# Cleanup backups
for DOMAIN in "${DOMAINS[@]}"; do
  rm -f "/etc/nginx/sites-available/${DOMAIN}.bak"
done

echo ""
echo "═══════════════════════════════════════════════════"
echo "  DONE — Cache headers active"
echo "═══════════════════════════════════════════════════"
echo "  index.html → no-cache (always fresh)"
echo "  /assets/*  → immutable (Vite hash = auto cache-bust)"
echo "  Deploys now take effect immediately for all users."
echo "═══════════════════════════════════════════════════"
