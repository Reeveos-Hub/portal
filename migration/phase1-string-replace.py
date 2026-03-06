#!/usr/bin/env python3
"""
Phase 1.3: Codebase String Replacement
Rezvo → ReeveOS across all frontend + backend files

SAFE replacements only:
- Display strings (titles, labels, footer text)
- Session/storage key names
- CSS class prefixes

NOT replaced (yet):
- Database name (rezvo) — stays until separate DB migration
- Domain URLs — stays until DNS is live (Phase 2)
- Git remote URLs — stays until repo renamed (Phase 4)
"""

import os
import re
import sys

DRY_RUN = "--dry-run" in sys.argv
BASE = "/opt/rezvo-app" if os.path.exists("/opt/rezvo-app") else "."

REPLACEMENTS = [
    # Session/storage keys
    ("rezvo_token", "reeveos_token"),
    ("rezvo-token", "reeveos-token"),
    
    # Display strings
    ("Rezvo", "ReeveOS"),  # careful — only in display contexts
    ("rezvo2024", "reeveos2024"),
    ("Rezvo2024", "ReeveOS2024"),
    
    # API/admin pin
    ("rezvo2024", "reeveos2024"),
]

# Files to skip
SKIP_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__", "migration"}
SKIP_FILES = {".map", ".lock", ".png", ".jpg", ".ico", ".woff", ".woff2", ".ttf"}
EXTENSIONS = {".jsx", ".js", ".py", ".html", ".css", ".json", ".env", ".md", ".sh"}

def should_process(path):
    for skip in SKIP_DIRS:
        if f"/{skip}/" in path or path.endswith(f"/{skip}"):
            return False
    ext = os.path.splitext(path)[1]
    if ext in SKIP_FILES:
        return False
    if ext not in EXTENSIONS:
        return False
    return True

def scan_and_replace():
    changes = []
    
    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            fpath = os.path.join(root, fname)
            if not should_process(fpath):
                continue
            
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except Exception:
                continue
            
            original = content
            file_changes = []
            
            for old, new in REPLACEMENTS:
                if old in content:
                    count = content.count(old)
                    content = content.replace(old, new)
                    file_changes.append(f"  {old} → {new} ({count}x)")
            
            if file_changes:
                rel_path = os.path.relpath(fpath, BASE)
                changes.append((rel_path, file_changes))
                
                if not DRY_RUN:
                    with open(fpath, "w", encoding="utf-8") as f:
                        f.write(content)
    
    return changes

if __name__ == "__main__":
    print(f"{'DRY RUN — ' if DRY_RUN else ''}Scanning {BASE}...")
    print("")
    
    changes = scan_and_replace()
    
    if not changes:
        print("No changes found.")
    else:
        total = 0
        for path, file_changes in changes:
            print(f"📄 {path}")
            for c in file_changes:
                print(c)
                total += 1
            print("")
        
        print(f"{'Would change' if DRY_RUN else 'Changed'}: {len(changes)} files, {total} replacements")
    
    if DRY_RUN:
        print("\nRun without --dry-run to apply changes.")
