from sqlalchemy import Column, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from ..database import Base


class RequestStatus(str, enum.Enum):
    open = "open"  # Available for anyone to claim
    assigned = "assigned"  # Assigned to specific user
    in_progress = "in_progress"  # Someone is working on it
    completed = "completed"  # App has been created
    cancelled = "cancelled"  # Request was cancelled


class AppRequest(Base):
    __tablename__ = "app_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic info (similar to app creation)
    name = Column(String, nullable=False)
    short_description = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Request-specific fields
    status = Column(Enum(RequestStatus), default=RequestStatus.open, nullable=False)

    # Who created the request
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    requester = relationship("User", foreign_keys=[requester_id], backref="app_requests_created")

    # Who is assigned to work on it (optional - can be assigned by email or claimed)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assignee = relationship("User", foreign_keys=[assignee_id], backref="app_requests_assigned")

    # Email for assignment (if user doesn't exist yet)
    assigned_email = Column(String, nullable=True)

    # Reference to the created app (when completed)
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=True)
    app = relationship("App", backref="source_request")

    # Optional team association
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    team = relationship("Team", backref="app_requests")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
