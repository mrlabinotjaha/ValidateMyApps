from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from ..database import Base


class NotificationType(str, enum.Enum):
    request_assigned = "request_assigned"  # You were assigned to a request
    claim_approved = "claim_approved"  # Your claim was approved
    claim_denied = "claim_denied"  # Your claim was denied
    new_claim = "new_claim"  # Someone wants to claim your request
    request_completed = "request_completed"  # A request you created was completed
    team_invitation = "team_invitation"  # You were invited to a team


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Who receives this notification
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="notifications")

    # Notification content
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=True)

    # Related entity (optional, for navigation)
    related_id = Column(UUID(as_uuid=True), nullable=True)  # ID of related entity (request, team, etc.)
    related_type = Column(String(50), nullable=True)  # "app_request", "team", etc.

    # Status
    is_read = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
