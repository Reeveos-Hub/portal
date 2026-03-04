"""
TENANT ISOLATION AUDIT
======================
Run this ANY TIME to verify tenant isolation coverage.
Shows exactly which routes are protected and which aren't.

Usage: python3 backend/scripts/tenant_audit.py
"""
import os
import re
import sys

# Routes that legitimately DON'T need tenant isolation
EXEMPT_FILES = {
    "auth.py",                  # Login/signup - no business context yet
    "public/directory.py",      # Public consumer browsing
    "public/book.py",           # Public booking flow
    "public/voice_search.py",   # Public search
    "public/webhooks.py",       # Inbound webhooks (no user session)
    "admin/core.py",            # Platform admin (not business-scoped)
    "admin/extended.py",        # Platform admin
    "admin/command_centre.py",  # Platform admin project board
    "admin/library.py",         # Platform knowledge library
    "dashboard/studio.py",      # Design studio (platform tool)
    "dashboard/chatbot.py",     # Support chatbot
    "platform/agent.py",        # AI agent (platform tool)
    "platform/outreach.py",     # Platform sales outreach (not tenant data)
    "platform/linkedin.py",     # Platform content generation (not tenant data)
    "epos/online_ordering.py",  # Public QR ordering (customer-facing, no auth)
}

GUARD_PATTERNS = [
    "verify_business_access",
    "TenantScopedDB",
    "get_scoped_db",
    "set_user_tenant_context",
]

def audit(routes_dir):
    results = {"guarded": [], "unguarded": [], "exempt": [], "missing_guard": []}

    for dirpath, dirnames, filenames in os.walk(routes_dir):
        for fname in sorted(filenames):
            if not fname.endswith(".py") or fname == "__init__.py":
                continue

            filepath = os.path.join(dirpath, fname)
            relpath = os.path.relpath(filepath, routes_dir)

            with open(filepath) as f:
                content = f.read()

            route_count = len(re.findall(r"@router\.", content))
            if route_count == 0:
                continue

            has_guard = any(p in content for p in GUARD_PATTERNS)

            if relpath in EXEMPT_FILES:
                results["exempt"].append((relpath, route_count, has_guard))
            elif has_guard:
                results["guarded"].append((relpath, route_count))
            else:
                results["unguarded"].append((relpath, route_count))
                results["missing_guard"].append(relpath)

    # Print report
    total_guarded = sum(r for _, r in results["guarded"])
    total_unguarded = sum(r for _, r in results["unguarded"])
    total_exempt = sum(r for _, r, _ in results["exempt"])
    total = total_guarded + total_unguarded + total_exempt

    print("=" * 60)
    print("  TENANT ISOLATION AUDIT REPORT")
    print("=" * 60)
    print()

    if results["unguarded"]:
        print("!! UNPROTECTED ROUTES (CRITICAL) !!")
        print("-" * 40)
        for fname, count in results["unguarded"]:
            print(f"  {fname:40s} {count:3d} routes  ** NO GUARD **")
        print(f"\n  TOTAL UNPROTECTED: {total_unguarded} routes across {len(results['unguarded'])} files")
        print()

    print("PROTECTED ROUTES")
    print("-" * 40)
    for fname, count in results["guarded"]:
        print(f"  {fname:40s} {count:3d} routes  OK")
    print(f"\n  TOTAL PROTECTED: {total_guarded} routes across {len(results['guarded'])} files")
    print()

    print("EXEMPT (public/admin - no business scope)")
    print("-" * 40)
    for fname, count, has in results["exempt"]:
        status = "has guard anyway" if has else "exempt"
        print(f"  {fname:40s} {count:3d} routes  ({status})")
    print(f"\n  TOTAL EXEMPT: {total_exempt} routes across {len(results['exempt'])} files")
    print()

    # Summary
    coverage = (total_guarded / (total_guarded + total_unguarded) * 100) if (total_guarded + total_unguarded) > 0 else 0
    print("=" * 60)
    print(f"  COVERAGE: {coverage:.1f}%")
    print(f"  Protected:   {total_guarded} routes ({len(results['guarded'])} files)")
    print(f"  Unprotected: {total_unguarded} routes ({len(results['unguarded'])} files)")
    print(f"  Exempt:      {total_exempt} routes ({len(results['exempt'])} files)")
    print(f"  Total:       {total} routes")
    print("=" * 60)

    if coverage < 100:
        print(f"\n  VERDICT: FAIL - {len(results['unguarded'])} files need tenant guards")
        print(f"\n  Files to fix:")
        for f in results["missing_guard"]:
            print(f"    - {f}")
        return 1
    else:
        print(f"\n  VERDICT: PASS - All business routes have tenant isolation")
        return 0

if __name__ == "__main__":
    routes_dir = os.path.join(os.path.dirname(__file__), "..", "routes")
    if not os.path.isdir(routes_dir):
        routes_dir = "backend/routes"
    if not os.path.isdir(routes_dir):
        print("Cannot find routes directory")
        sys.exit(1)
    sys.exit(audit(routes_dir))
