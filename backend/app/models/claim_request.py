from sqlalchemy import Column, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from ..database import Base


class ClaimStatus(str, enum.Enum):
    pending = "pending"  # Waiting for approval
    approved = "approved"  # Claim approved
    denied = "denied"  # Claim denied


class ClaimRequest(Base):
    __tablename__ = "claim_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # The app request being claimed
    app_request_id = Column(UUID(as_uuid=True), ForeignKey("app_requests.id"), nullable=False)
    app_request = relationship("AppRequest", backref="claim_requests")

    # Who wants to claim it
    claimer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    claimer = relationship("User", backref="claim_requests")

    # Optional message from claimer explaining why they want to work on it
    message = Column(Text, nullable=True)

    # Status of the claim request
    status = Column(Enum(ClaimStatus), default=ClaimStatus.pending, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
