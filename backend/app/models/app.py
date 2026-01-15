from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from ..database import Base


class AppStatus(str, enum.Enum):
    in_development = "in_development"
    beta = "beta"
    completed = "completed"


class ProgressMode(str, enum.Enum):
    auto = "auto"
    manual = "manual"


class App(Base):
    __tablename__ = "apps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    short_description = Column(String, nullable=False)
    full_description = Column(Text, nullable=True)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    status = Column(Enum(AppStatus), default=AppStatus.in_development, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    progress_mode = Column(Enum(ProgressMode), default=ProgressMode.manual, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User", back_populates="apps")
    team = relationship("Team", back_populates="apps")
    images = relationship("Image", back_populates="app", cascade="all, delete-orphan", order_by="Image.order_index")
    votes = relationship("Vote", back_populates="app", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="app", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="app_tags", back_populates="apps")
    tasks = relationship("AppTask", back_populates="app", cascade="all, delete-orphan", order_by="AppTask.created_at")


class AppTag(Base):
    __tablename__ = "app_tags"

    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True)


class AppTask(Base):
    __tablename__ = "app_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    title = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    app = relationship("App", back_populates="tasks")
