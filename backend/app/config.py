from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Railway will provide DATABASE_URL automatically
    database_url: str
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 43200  # 30 days
    upload_dir: str = ""
    allowed_origins: List[str] = []

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""
    frontend_url: str = "http://localhost:5173"

    # GitHub OAuth (for users to connect their GitHub accounts)
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Handle Railway DATABASE_URL - convert postgres:// to postgresql:// for SQLAlchemy
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql://", 1)
        
        # Set upload directory - use Railway volume if available
        if os.getenv("RAILWAY_VOLUME_MOUNT_PATH"):
            self.upload_dir = os.path.join(os.getenv("RAILWAY_VOLUME_MOUNT_PATH"), "uploads")
        else:
            self.upload_dir = "./uploads"
        
        # Set allowed origins - only if not already set from env
        if not self.allowed_origins:
            origins = ["http://localhost:5173"]

            # Add Railway public domain if available
            if os.getenv("RAILWAY_PUBLIC_DOMAIN"):
                railway_url = f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN')}"
                origins.append(railway_url)

            # For Railway, allow requests from same origin (when frontend is served from backend)
            if os.getenv("RAILWAY_ENVIRONMENT"):
                # Allow all origins since we're serving frontend from same domain
                origins = ["*"]

            self.allowed_origins = origins
        else:
            # Add Railway domain if available
            if os.getenv("RAILWAY_PUBLIC_DOMAIN"):
                railway_url = f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN')}"
                if railway_url not in self.allowed_origins:
                    self.allowed_origins.append(railway_url)

            # For Railway, allow all origins
            if os.getenv("RAILWAY_ENVIRONMENT"):
                self.allowed_origins = ["*"]

        # Set frontend URL for OAuth redirects
        if os.getenv("FRONTEND_URL"):
            self.frontend_url = os.getenv("FRONTEND_URL")
        elif os.getenv("RAILWAY_PUBLIC_DOMAIN"):
            self.frontend_url = f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN')}"

        # Set Google OAuth redirect URI
        if not self.google_redirect_uri and self.google_client_id:
            if os.getenv("RAILWAY_PUBLIC_DOMAIN"):
                self.google_redirect_uri = f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN')}/api/auth/google/callback"
            else:
                self.google_redirect_uri = "http://localhost:8000/api/auth/google/callback"

        # Set GitHub OAuth redirect URI
        if not self.github_redirect_uri and self.github_client_id:
            if os.getenv("RAILWAY_PUBLIC_DOMAIN"):
                self.github_redirect_uri = f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN')}/api/auth/github/callback"
            else:
                self.github_redirect_uri = "http://localhost:8000/api/auth/github/callback"

        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)


settings = Settings()
