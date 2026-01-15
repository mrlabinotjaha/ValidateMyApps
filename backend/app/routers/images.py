from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID

from ..database import get_db
from ..models.app import App
from ..models.image import Image
from ..schemas.app import ImageResponse
from ..utils.dependencies import get_current_user
from ..services.upload import save_upload_file, delete_upload_file

router = APIRouter(prefix="/api/apps", tags=["images"])


@router.post("/{app_id}/images", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    app_id: UUID,
    file: UploadFile = File(...),
    is_featured: bool = False,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found"
        )
    
    if app.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload images for this app"
        )
    
    # Save file
    image_url = await save_upload_file(file)
    
    # Get max order_index
    max_order = db.query(Image.order_index).filter(Image.app_id == app_id).order_by(Image.order_index.desc()).first()
    order_index = (max_order[0] + 1) if max_order else 0
    
    # If this is featured, unset other featured images
    if is_featured:
        db.query(Image).filter(Image.app_id == app_id).update({"is_featured": False})
    
    # Create image record
    image = Image(
        app_id=app_id,
        image_url=image_url,
        is_featured=is_featured,
        order_index=order_index
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    image_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    app = db.query(App).filter(App.id == image.app_id).first()
    if app.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this image"
        )
    
    # Delete file
    delete_upload_file(image.image_url)
    
    db.delete(image)
    db.commit()
    return None
