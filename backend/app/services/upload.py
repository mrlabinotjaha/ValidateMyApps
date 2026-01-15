import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from PIL import Image as PILImage
from ..config import settings


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def ensure_upload_dir():
    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def validate_image(file: UploadFile):
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    return file_ext


async def save_upload_file(file: UploadFile) -> str:
    """Save uploaded file and return the relative URL path"""
    validate_image(file)
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    upload_dir = ensure_upload_dir()
    file_path = upload_dir / unique_filename
    
    # Read file content
    contents = await file.read()
    
    # Check file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # Validate it's actually an image
    try:
        from io import BytesIO
        image = PILImage.open(BytesIO(contents))
        image.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file"
        )
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return URL path (relative to uploads directory)
    return f"/uploads/{unique_filename}"


def delete_upload_file(file_url: str):
    """Delete uploaded file"""
    if file_url.startswith("/uploads/"):
        filename = file_url.replace("/uploads/", "")
        file_path = Path(settings.upload_dir) / filename
        if file_path.exists():
            file_path.unlink()
