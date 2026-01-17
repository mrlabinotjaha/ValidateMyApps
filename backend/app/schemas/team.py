from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
import enum
from ..models.team import TeamRole, InvitationStatus


class OwnerInfo(BaseModel):
    id: UUID
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None


class TeamCreate(TeamBase):
    initial_invitations: Optional[List[str]] = None  # List of email addresses to invite


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TeamResponse(TeamBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    owner: OwnerInfo
    member_count: int = 0
    app_count: int = 0

    class Config:
        from_attributes = True


class TeamListItem(TeamBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    owner: OwnerInfo
    member_count: int = 0
    app_count: int = 0
    invitation_status: Optional[str] = None  # 'pending' if user has pending invitation
    invitation_id: Optional[str] = None  # ID of the pending invitation for the user

    class Config:
        from_attributes = True


class TeamMemberResponse(BaseModel):
    id: UUID
    team_id: UUID
    user_id: UUID
    role: TeamRole
    joined_at: datetime
    user: OwnerInfo

    class Config:
        from_attributes = True


class TeamMemberCreate(BaseModel):
    user_id: UUID
    role: TeamRole = TeamRole.member


class TeamInvitationCreate(BaseModel):
    email: str


class TeamInvitationResponse(BaseModel):
    id: UUID
    team_id: UUID
    email: str
    invited_by_id: UUID
    status: InvitationStatus
    created_at: datetime
    responded_at: Optional[datetime] = None
    invited_by: OwnerInfo

    class Config:
        from_attributes = True
