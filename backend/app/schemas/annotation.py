from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from ..models.annotation import AnnotationType, AnnotationStatus
from .user import UserResponse


class AnnotationBase(BaseModel):
    x_position: Decimal
    y_position: Decimal
    width: Optional[Decimal] = None
    height: Optional[Decimal] = None
    annotation_type: AnnotationType
    comment: str
    status: AnnotationStatus = AnnotationStatus.open


class AnnotationCreate(AnnotationBase):
    pass


class AnnotationUpdate(BaseModel):
    comment: Optional[str] = None
    status: Optional[AnnotationStatus] = None


class AnnotationResponse(AnnotationBase):
    id: UUID
    image_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True
