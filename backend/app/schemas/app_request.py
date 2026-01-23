from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class RequestStatus(str, Enum):
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class AppRequestBase(BaseModel):
    name: str
    description: Optional[str] = None
    team_id: Optional[UUID] = None


class AppRequestCreate(AppRequestBase):
    assigned_email: Optional[EmailStr] = None  # Optionally assign to email


class AppRequestUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[RequestStatus] = None


class AppRequestAssign(BaseModel):
    email: Optional[EmailStr] = None  # Assign by email
    user_id: Optional[UUID] = None  # Or assign by user ID


class UserSummary(BaseModel):
    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class TeamSummary(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class AppSummary(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class AppRequestResponse(AppRequestBase):
    id: UUID
    status: RequestStatus
    requester_id: UUID
    requester: UserSummary
    assignee_id: Optional[UUID] = None
    assignee: Optional[UserSummary] = None
    assigned_email: Optional[str] = None
    app_id: Optional[UUID] = None
    app: Optional[AppSummary] = None
    team: Optional[TeamSummary] = None
    created_at: datetime
    updated_at: datetime
    pending_claims_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Claim Request schemas
class ClaimStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    denied = "denied"


class ClaimRequestCreate(BaseModel):
    message: Optional[str] = None


class ClaimRequestResponse(BaseModel):
    id: UUID
    app_request_id: UUID
    claimer_id: UUID
    claimer: UserSummary
    message: Optional[str] = None
    status: ClaimStatus
    created_at: datetime

    class Config:
        from_attributes = True
