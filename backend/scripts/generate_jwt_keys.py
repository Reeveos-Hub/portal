#!/usr/bin/env python3
"""
Generate RSA-2048 key pair for ReeveOS JWT RS256 signing.

Run ONCE on the VPS:
    python3 backend/scripts/generate_jwt_keys.py

Creates:
    backend/keys/jwt_private.pem  — PRIVATE. Signs tokens. Never share.
    backend/keys/jwt_public.pem   — PUBLIC. Verifies tokens. Safe to share.

Then add to backend/.env:
    JWT_PRIVATE_KEY_PATH=/opt/rezvo-app/backend/keys/jwt_private.pem
    JWT_PUBLIC_KEY_PATH=/opt/rezvo-app/backend/keys/jwt_public.pem
    JWT_ALGORITHM=RS256
"""
import os
import sys
import stat
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

KEYS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "keys")
PRIVATE_PATH = os.path.join(KEYS_DIR, "jwt_private.pem")
PUBLIC_PATH = os.path.join(KEYS_DIR, "jwt_public.pem")


def main():
    # Safety: don't overwrite existing keys
    if os.path.exists(PRIVATE_PATH):
        print(f"STOP: Private key already exists at {PRIVATE_PATH}")
        print("If you regenerate, ALL existing tokens are invalidated.")
        print("Delete the old keys manually if you're sure, then re-run.")
        sys.exit(1)

    # Create keys directory
    os.makedirs(KEYS_DIR, exist_ok=True)

    # Generate 2048-bit RSA key pair
    print("Generating RSA-2048 key pair...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    # Write private key (owner-read only: 600)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    with open(PRIVATE_PATH, "wb") as f:
        f.write(private_pem)
    os.chmod(PRIVATE_PATH, stat.S_IRUSR)  # 0o400 — owner read only
    print(f"Private key: {PRIVATE_PATH} (permissions: 400)")

    # Write public key (owner-read: 644 is fine, it's public)
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    with open(PUBLIC_PATH, "wb") as f:
        f.write(public_pem)
    os.chmod(PUBLIC_PATH, stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)  # 0o444
    print(f"Public key:  {PUBLIC_PATH} (permissions: 444)")

    print()
    print("Add these to backend/.env:")
    print(f"  JWT_PRIVATE_KEY_PATH={PRIVATE_PATH}")
    print(f"  JWT_PUBLIC_KEY_PATH={PUBLIC_PATH}")
    print(f"  JWT_ALGORITHM=RS256")
    print()
    print("Then restart: sudo systemctl restart rezvo-backend")
    print("NOTE: All existing tokens are now invalid. Everyone must log in again.")


if __name__ == "__main__":
    main()
