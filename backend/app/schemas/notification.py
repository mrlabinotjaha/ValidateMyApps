from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class NotificationType(str, Enum):
    request_assigned = "request_assigned"
    claim_approved = "claim_approved"
    claim_denied = "claim_denied"
    new_claim = "new_claim"
    request_completed = "request_completed"
    team_invitation = "team_invitation"


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    message: Optional[str] = None
    related_id: Optional[UUID] = None
    related_type: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCount(BaseModel):
    unread_count: int
