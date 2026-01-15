from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from ..models.vote import VoteType


class VoteCreate(BaseModel):
    vote_type: VoteType


class VoteResponse(BaseModel):
    id: UUID
    app_id: UUID
    user_id: UUID
    vote_type: VoteType
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VoteStats(BaseModel):
    upvotes: int
    downvotes: int
    net_score: int
    user_vote: Optional[VoteType] = None
