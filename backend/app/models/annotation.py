from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from ..database import Base


class AnnotationType(str, enum.Enum):
    rectangle = "rectangle"
    circle = "circle"
    point = "point"


class AnnotationStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id = Column(UUID(as_uuid=True), ForeignKey("images.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    x_position = Column(Numeric(10, 2), nullable=False)
    y_position = Column(Numeric(10, 2), nullable=False)
    width = Column(Numeric(10, 2), nullable=True)
    height = Column(Numeric(10, 2), nullable=True)
    annotation_type = Column(Enum(AnnotationType), nullable=False)
    comment = Column(Text, nullable=False)
    status = Column(Enum(AnnotationStatus), default=AnnotationStatus.open, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    image = relationship("Image", back_populates="annotations")
    user = relationship("User", back_populates="annotations")
