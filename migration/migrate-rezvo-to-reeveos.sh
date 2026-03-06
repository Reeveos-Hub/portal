#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# REEVEOS MIGRATION SCRIPT
# Rezvo → ReeveOS complete migration
# VPS: 178.128.33.73 | Date: March 2026
#
# RUN EACH SECTION MANUALLY — DO NOT RUN THIS AS ONE SCRIPT
# Copy/paste each section, verify output before moving to next
# ═══════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────
# SECTION 0: PRE-FLIGHT CHECKS
# Verify everything is working BEFORE touching anything
# ─────────────────────────────────────────────────────────────────────

echo "=== PRE-FLIGHT CHECKS ==="
echo ""

# Check services running
systemctl is-active rezvo-backend && echo "✓ Backend running" || echo "✗ Backend NOT running"
curl -s -o /dev/null -w "%{http_code}" https://portal.rezvo.app/api/health && echo " ✓ API responding" || echo " ✗ API not responding"
mongosh --eval "db.stats()" rezvo --quiet | head -3 && echo "✓ MongoDB OK" || echo "✗ MongoDB issue"

# Check disk space (need ~2GB free for backups)
echo ""
df -h / | tail -1
echo ""
echo "Need at least 2GB free for backups"
echo ""
echo "=== If all checks pass, proceed to SECTION 1 ==="

# ─────────────────────────────────────────────────────────────────────
# SECTION 1: BACKUP LAYER 1 — Git Tag
# Creates a named checkpoint you can instantly revert to
# ROLLBACK: git checkout pre-migration-backup
# ─────────────────────────────────────────────────────────────────────

echo "=== BACKUP LAYER 1: Git Tag ==="
cd /opt/rezvo-app
git status
git add -A && git commit -m "Pre-migration snapshot — $(date +%Y%m%d-%H%M)" || true
git tag -a pre-migration-backup -m "Last known working state before rezvo→reeveos migration"
git tag -l | grep migration
echo "✓ Git tag created: pre-migration-backup"

# ─────────────────────────────────────────────────────────────────────
# SECTION 2: BACKUP LAYER 2 — Full Tar Archive
# Physical file copy, independent of git
# ROLLBACK: cd / && tar -xzf /root/reeveos-backup-YYYYMMDD.tar.gz
# ─────────────────────────────────────────────────────────────────────

echo "=== BACKUP LAYER 2: Tar Archive ==="
BACKUP_DATE=$(date +%Y%m%d-%H%M)
tar -czf /root/reeveos-backup-${BACKUP_DATE}.tar.gz /opt/rezvo-app
ls -lh /root/reeveos-backup-${BACKUP_DATE}.tar.gz
echo "✓ Tar archive created: /root/reeveos-backup-${BACKUP_DATE}.tar.gz"

# Also backup nginx configs
cp -r /etc/nginx/sites-available /root/nginx-backup-${BACKUP_DATE}
cp -r /etc/nginx/sites-enabled /root/nginx-enabled-backup-${BACKUP_DATE}
echo "✓ Nginx configs backed up"

# Backup systemd service
cp /etc/systemd/system/rezvo-backend.service /root/rezvo-backend.service.bak
echo "✓ Systemd service backed up"

# ─────────────────────────────────────────────────────────────────────
# SECTION 3: BACKUP LAYER 3 — MongoDB Dump
# Separate DB backup in case tar gets corrupted
# ROLLBACK: mongorestore --db rezvo /root/mongodb-backup-YYYYMMDD/rezvo/
# ─────────────────────────────────────────────────────────────────────

echo "=== BACKUP LAYER 3: MongoDB Dump ==="
mongodump --db rezvo --out /root/mongodb-backup-${BACKUP_DATE}
ls -la /root/mongodb-backup-${BACKUP_DATE}/rezvo/ | head -20
echo "✓ MongoDB dumped to /root/mongodb-backup-${BACKUP_DATE}/"

# ─────────────────────────────────────────────────────────────────────
# SECTION 4: BACKUP LAYER 4 — DigitalOcean Snapshot
# DO THIS IN THE DIGITALOCEAN DASHBOARD:
# 1. Go to https://cloud.digitalocean.com/droplets
# 2. Click on rezvo-production droplet
# 3. Click "Snapshots" tab
# 4. Name it: "pre-migration-2026-03-XX"
# 5. Click "Take Snapshot"
# 6. Wait for it to complete (5-10 mins)
# ─────────────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  MANUAL STEP: Take DigitalOcean Snapshot NOW            ║"
echo "║  Name: pre-migration-$(date +%Y-%m-%d)                  ║"
echo "║  DO NOT proceed until snapshot is complete               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Backups complete:"
echo "  1. Git tag: pre-migration-backup"
echo "  2. Tar: /root/reeveos-backup-${BACKUP_DATE}.tar.gz"
echo "  3. MongoDB: /root/mongodb-backup-${BACKUP_DATE}/"
echo "  4. DO Snapshot: (manual — verify in dashboard)"
echo ""
echo "=== ALL 4 BACKUP LAYERS DONE — proceed to Phase 1 ==="


# ═══════════════════════════════════════════════════════════════════════
# PHASE 1: CODEBASE STRING REPLACEMENT
# Replace all rezvo references with reeveos
# Still deploying to same domains — testing before DNS switch
# ═══════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────
# STEP 1.1: Backend .env
# ─────────────────────────────────────────────────────────────────────

echo "=== PHASE 1.1: Backend .env ==="
cd /opt/rezvo-app/backend

# Show current values
echo "Current .env MongoDB settings:"
grep -i "MONGODB\|DB_NAME\|JWT\|rezvo" .env

# NOTE: We keep MONGODB_DB_NAME=rezvo for now
# DB rename happens separately to avoid data loss
# Only rename display strings and session keys

# ─────────────────────────────────────────────────────────────────────
# STEP 1.2: Frontend session/storage keys
# ─────────────────────────────────────────────────────────────────────

echo "=== PHASE 1.2: Session Keys ==="
cd /opt/rezvo-app

# Find all rezvo references in frontend
echo "Frontend rezvo references:"
grep -rn "rezvo" frontend/src/ --include="*.jsx" --include="*.js" | grep -v node_modules | grep -v ".map"

# Key replacements (REVIEW EACH ONE):
# rezvo_token → reeveos_token (sessionStorage)
# rezvo → reeveos in display strings
# portal.rezvo.app references stay until DNS switch (Phase 2)

# ─────────────────────────────────────────────────────────────────────
# STEP 1.3: Do the replacements
# Ambassador: git pull first to get latest code, then I push the
# string-replaced version from Claude
# ─────────────────────────────────────────────────────────────────────

echo "=== PHASE 1.3: String Replacement ==="
echo "Claude will push the code changes."
echo "Run: cd /opt/rezvo-app && git pull && cd frontend && npm run build"
echo "Then: sudo systemctl restart rezvo-backend"
echo ""
echo "Test EVERYTHING:"
echo "  - Login at portal.rezvo.app/login"
echo "  - Login at portal.rezvo.app/admin"  
echo "  - Consultation form"
echo "  - Client portal"
echo "  - All dashboard pages"
echo ""
echo "If ANYTHING is broken:"
echo "  git checkout pre-migration-backup"
echo "  npm run build"
echo "  sudo systemctl restart rezvo-backend"


# ═══════════════════════════════════════════════════════════════════════
# PHASE 2: DNS SETUP (Ambassador does in Cloudflare)
# Old domains keep working — new ones added alongside
# ═══════════════════════════════════════════════════════════════════════

echo "=== PHASE 2: DNS Records to Add in Cloudflare ==="
echo ""
echo "Domain: reeveos.app"
echo "  Type: A    | Name: portal    | Value: 178.128.33.73 | Proxy: ON"
echo "  Type: A    | Name: portaladmin| Value: 178.128.33.73 | Proxy: ON"
echo ""
echo "Domain: reevenow.com" 
echo "  Type: A    | Name: @          | Value: 178.128.33.73 | Proxy: ON"
echo "  Type: A    | Name: www        | Value: 178.128.33.73 | Proxy: ON"
echo ""
echo "DO NOT delete old rezvo.app records yet."
echo "Both old and new domains will work simultaneously."


# ═══════════════════════════════════════════════════════════════════════
# PHASE 3: VPS CONFIG — Nginx + Systemd + Directory
# ═══════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────
# STEP 3.1: Nginx config for new domains
# ─────────────────────────────────────────────────────────────────────

echo "=== PHASE 3.1: Nginx Config ==="

# Create new nginx config for portal.reeveos.app
cat > /etc/nginx/sites-available/portal.reeveos.app << 'NGINX'
server {
    listen 80;
    server_name portal.reeveos.app;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Symlink to enable
ln -sf /etc/nginx/sites-available/portal.reeveos.app /etc/nginx/sites-enabled/
nginx -t && echo "✓ Nginx config valid" || echo "✗ Nginx config INVALID — DO NOT RELOAD"

# Only reload if valid
# nginx -t && sudo systemctl reload nginx

# ─────────────────────────────────────────────────────────────────────
# STEP 3.2: Rename directory
# ─────────────────────────────────────────────────────────────────────

echo "=== PHASE 3.2: Directory Rename ==="
echo "Stopping backend..."
# sudo systemctl stop rezvo-backend
# mv /opt/rezvo-app /opt/reeveos-portal
echo "Directory renamed: /opt/rezvo-app → /opt/reeveos-portal"

# ─────────────────────────────────────────────────────────────────────
# STEP 3.3: Systemd service rename
# ─────────────────────────────────────────────────────────────────────

echo "=== PHASE 3.3: Systemd Service ==="

cat > /etc/systemd/system/reeveos-backend.service << 'SYSTEMD'
[Unit]
Description=ReeveOS Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/reeveos-portal/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
SYSTEMD

# sudo systemctl daemon-reload
# sudo systemctl enable reeveos-backend
# sudo systemctl start reeveos-backend
# sudo systemctl disable rezvo-backend

echo "New service: reeveos-backend"
echo "Old service: rezvo-backend (to be disabled)"

# ─────────────────────────────────────────────────────────────────────
# STEP 3.4: Update git remote
# ─────────────────────────────────────────────────────────────────────

echo "=== PHASE 3.4: Git Remote ==="
# cd /opt/reeveos-portal
# git remote set-url origin https://github.com/Ambassadorbtc/portal.reeveos.git
# git remote -v


# ═══════════════════════════════════════════════════════════════════════
# PHASE 4: GITHUB REPO RENAME
# Do this on GitHub.com — Settings → General → Repository name
# ═══════════════════════════════════════════════════════════════════════

echo "=== PHASE 4: GitHub Rename ==="
echo "On GitHub.com:"
echo "  1. Go to Ambassadorbtc/Rezvo.app → Settings"
echo "  2. Change name to: portal.reeveos"
echo "  3. GitHub auto-redirects old URLs"
echo ""
echo "Then on VPS:"
echo "  cd /opt/reeveos-portal"
echo "  git remote set-url origin https://YOUR_GITHUB_TOKEN@github.com/Ambassadorbtc/portal.reeveos.git"
echo "  git pull  # verify it works"


# ═══════════════════════════════════════════════════════════════════════
# PHASE 5: VERIFICATION
# ═══════════════════════════════════════════════════════════════════════

echo "=== FINAL VERIFICATION ==="
echo ""
echo "Test ALL of these:"
echo "  [ ] portal.reeveos.app/login — business dashboard login"
echo "  [ ] portal.reeveos.app/admin — admin login"
echo "  [ ] portal.reeveos.app/book/rejuvenate-skin-experts — booking page"
echo "  [ ] portal.reeveos.app/portal/rejuvenate-skin-experts — client portal"
echo "  [ ] Client portal: login, form, bookings, messages, profile"
echo "  [ ] Dashboard: staff, services, consultation forms, client messages"
echo "  [ ] API: curl https://portal.reeveos.app/api/health"
echo ""
echo "OLD domains still working (keep for 2 weeks):"
echo "  [ ] portal.rezvo.app/login"
echo "  [ ] portal.rezvo.app/admin"
echo ""
echo "After 2 weeks stable, remove old DNS records."


# ═══════════════════════════════════════════════════════════════════════
# EMERGENCY ROLLBACK PROCEDURES
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " EMERGENCY ROLLBACK — copy the section you need:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "--- ROLLBACK OPTION 1: Git revert (fastest, ~2 min) ---"
echo "cd /opt/reeveos-portal   # or /opt/rezvo-app if not renamed yet"
echo "git checkout pre-migration-backup"
echo "cd frontend && npm run build"
echo "sudo systemctl restart rezvo-backend   # or reeveos-backend"
echo ""
echo "--- ROLLBACK OPTION 2: Tar restore (~1 min) ---"
echo "sudo systemctl stop reeveos-backend"
echo "rm -rf /opt/reeveos-portal"
echo "cd / && tar -xzf /root/reeveos-backup-*.tar.gz"
echo "sudo systemctl start rezvo-backend"
echo ""
echo "--- ROLLBACK OPTION 3: MongoDB restore ---"
echo "mongorestore --drop --db rezvo /root/mongodb-backup-*/rezvo/"
echo ""
echo "--- ROLLBACK OPTION 4: Full VPS restore (nuclear) ---"
echo "Go to DigitalOcean → Droplets → Snapshots"
echo "Restore from: pre-migration-YYYY-MM-DD"
echo "Takes ~5 minutes, reverts EVERYTHING"
echo ""
echo "--- ROLLBACK: Undo directory rename ---"
echo "sudo systemctl stop reeveos-backend"
echo "mv /opt/reeveos-portal /opt/rezvo-app"
echo "sudo systemctl start rezvo-backend"
echo ""
echo "--- ROLLBACK: Undo nginx ---"
echo "rm /etc/nginx/sites-enabled/portal.reeveos.app"
echo "sudo systemctl reload nginx"
echo ""
echo "--- ROLLBACK: Undo systemd ---"
echo "sudo systemctl stop reeveos-backend"
echo "sudo systemctl disable reeveos-backend"
echo "sudo systemctl enable rezvo-backend"
echo "sudo systemctl start rezvo-backend"
echo ""
echo "═══════════════════════════════════════════════════════════"
