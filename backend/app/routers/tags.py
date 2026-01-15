from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.tag import Tag
from ..schemas.app import TagResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).all()
    return tags


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    name = tag_data.get("name")
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag name is required"
        )
    
    # Check if tag already exists
    existing_tag = db.query(Tag).filter(Tag.name == name).first()
    if existing_tag:
        return existing_tag
    
    tag = Tag(name=name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag
