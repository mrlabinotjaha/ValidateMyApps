from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os
from .config import settings
from .database import engine, Base
from .routers import auth, apps, images, tags, votes, comments, annotations, teams, app_requests, notifications
# Import all models to register them with SQLAlchemy
from .models import user, app, team, image, tag, vote, comment, annotation, app_request, claim_request, notification

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="App Showcase API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers first (so they take precedence)
app.include_router(auth.router)
app.include_router(apps.router)
app.include_router(images.router)
app.include_router(tags.router)
app.include_router(votes.router)
app.include_router(comments.router)
app.include_router(annotations.router)
app.include_router(teams.router)
app.include_router(app_requests.router)
app.include_router(notifications.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Serve frontend static files (for production builds) - must be last to catch all other routes
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend app - catch all routes not handled by API or uploads"""
        # Don't serve files for API routes
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            return {"error": "Not found"}, 404
        
        # Check if it's a file request (has extension)
        file_path = static_dir / full_path
        if file_path.is_file() and file_path.exists():
            return FileResponse(file_path)
        
        # For all other routes, serve index.html (client-side routing)
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        
        return {"error": "Not found"}, 404
