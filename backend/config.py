from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "ReeveOS"
    app_version: str = "1.0.0"
    
    mongodb_url: str
    mongodb_db_name: str = "rezvo"
    
    jwt_secret_key: str  # Still required as fallback for HS256 compat
    jwt_algorithm: str = "HS256"
    jwt_private_key_path: Optional[str] = None  # RS256: path to PEM private key
    jwt_public_key_path: Optional[str] = None   # RS256: path to PEM public key
    jwt_access_token_expire_minutes: int = 60 * 24  # 24 hours — increase once frontend refresh is wired
    jwt_refresh_token_expire_days: int = 7
    
    # Loaded at runtime — not from .env directly
    _jwt_private_key: Optional[str] = None
    _jwt_public_key: Optional[str] = None
    
    google_places_api_key: str
    google_maps_api_key: str
    google_geocoding_api_key: str
    
    stripe_secret_key: str
    stripe_publishable_key: str
    stripe_webhook_secret: str
    
    resend_api_key: Optional[str] = None
    sendgrid_api_key: Optional[str] = None
    
    sendly_api_key: Optional[str] = None
    
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_s3_bucket: Optional[str] = None
    aws_s3_region: Optional[str] = "eu-west-2"
    
    cloudflare_r2_access_key_id: Optional[str] = None
    cloudflare_r2_secret_access_key: Optional[str] = None
    cloudflare_r2_bucket: Optional[str] = None
    cloudflare_r2_endpoint: Optional[str] = None
    
    anthropic_api_key: Optional[str] = None
    xai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    floor_plan_llm_provider: str = "gemini"
    
    frontend_url: str = "https://portal.rezvo.app"
    backend_url: str = "https://portal.rezvo.app/api"
    
    encryption_key: Optional[str] = None   # Fernet key for PII at-rest encryption
    
    environment: str = "production"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    @property
    def jwt_signing_key(self) -> str:
        """Key used to SIGN tokens. Private key for RS256, secret for HS256."""
        if self.jwt_algorithm == "RS256":
            if self._jwt_private_key:
                return self._jwt_private_key
            if self.jwt_private_key_path:
                import os
                if os.path.exists(self.jwt_private_key_path):
                    with open(self.jwt_private_key_path, "r") as f:
                        key = f.read()
                    object.__setattr__(self, "_jwt_private_key", key)
                    return key
            raise RuntimeError(
                "RS256 configured but JWT_PRIVATE_KEY_PATH not set or file missing. "
                "Run: python3 backend/scripts/generate_jwt_keys.py"
            )
        return self.jwt_secret_key

    @property
    def jwt_verify_key(self) -> str:
        """Key used to VERIFY tokens. Public key for RS256, secret for HS256."""
        if self.jwt_algorithm == "RS256":
            if self._jwt_public_key:
                return self._jwt_public_key
            if self.jwt_public_key_path:
                import os
                if os.path.exists(self.jwt_public_key_path):
                    with open(self.jwt_public_key_path, "r") as f:
                        key = f.read()
                    object.__setattr__(self, "_jwt_public_key", key)
                    return key
            raise RuntimeError(
                "RS256 configured but JWT_PUBLIC_KEY_PATH not set or file missing. "
                "Run: python3 backend/scripts/generate_jwt_keys.py"
            )
        return self.jwt_secret_key


settings = Settings()
