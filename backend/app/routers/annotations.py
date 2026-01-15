from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..models.image import Image
from ..models.annotation import Annotation, AnnotationStatus
from ..models.user import User
from ..schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/api/images", tags=["annotations"])


@router.get("/{image_id}/annotations", response_model=List[AnnotationResponse])
def get_annotations(
    image_id: UUID,
    status_filter: Optional[AnnotationStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    query = db.query(Annotation).filter(Annotation.image_id == image_id)
    
    if status_filter:
        query = query.filter(Annotation.status == status_filter)
    
    annotations = query.order_by(Annotation.created_at.asc()).all()
    return annotations


@router.post("/{image_id}/annotations", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
def create_annotation(
    image_id: UUID,
    annotation_data: AnnotationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    annotation = Annotation(
        image_id=image_id,
        user_id=current_user.id,
        x_position=annotation_data.x_position,
        y_position=annotation_data.y_position,
        width=annotation_data.width,
        height=annotation_data.height,
        annotation_type=annotation_data.annotation_type,
        comment=annotation_data.comment,
        status=annotation_data.status
    )
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return annotation


@router.put("/annotations/{annotation_id}", response_model=AnnotationResponse)
def update_annotation(
    annotation_id: UUID,
    annotation_data: AnnotationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotation not found"
        )
    
    if annotation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this annotation"
        )
    
    update_data = annotation_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(annotation, field, value)
    
    db.commit()
    db.refresh(annotation)
    return annotation


@router.delete("/annotations/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annotation(
    annotation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotation not found"
        )
    
    if annotation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this annotation"
        )
    
    db.delete(annotation)
    db.commit()
    return None


@router.patch("/annotations/{annotation_id}/resolve", response_model=AnnotationResponse)
def resolve_annotation(
    annotation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotation not found"
        )
    
    annotation.status = AnnotationStatus.resolved
    db.commit()
    db.refresh(annotation)
    return annotation
