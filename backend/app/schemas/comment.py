from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from .user import UserResponse


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    parent_comment_id: Optional[UUID] = None


class CommentUpdate(CommentBase):
    pass


class CommentResponse(CommentBase):
    id: UUID
    app_id: UUID
    user_id: UUID
    parent_comment_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    user: UserResponse
    replies: List["CommentResponse"] = []

    class Config:
        from_attributes = True


# Update forward reference
CommentResponse.model_rebuild()
