# REEVEOS MIGRATION — ROLLBACK QUICK REFERENCE

## Recovery Chain (try in order)

| # | Method | Time | When to use |
|---|--------|------|-------------|
| 1 | Git revert | 2 min | Code broke after string replacement |
| 2 | Tar extract | 1 min | Git repo is mangled |
| 3 | MongoDB restore | 1 min | Database corrupted during migration |
| 4 | DO Snapshot | 5 min | VPS itself is bricked |

## Backup Locations

| Layer | Location | Restores |
|-------|----------|----------|
| Git tag | `pre-migration-backup` | All code files |
| Tar | `/root/reeveos-backup-YYYYMMDD-HHMM.tar.gz` | Entire /opt/rezvo-app |
| MongoDB | `/root/mongodb-backup-YYYYMMDD-HHMM/rezvo/` | All database collections |
| Nginx | `/root/nginx-backup-YYYYMMDD-HHMM/` | Web server config |
| Systemd | `/root/rezvo-backend.service.bak` | Service definition |
| DO Snapshot | DigitalOcean dashboard | Full VPS disk image |

## Key Safety Net

Old domains (`portal.rezvo.app`) continue working throughout the entire migration.
They are NOT removed until 2 weeks after everything is confirmed stable on new domains.
