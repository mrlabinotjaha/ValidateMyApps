from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from ..models.app import AppStatus, ProgressMode


class CreatorInfo(BaseModel):
    id: UUID
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class ImageBase(BaseModel):
    image_url: str
    is_featured: bool = False
    order_index: int = 0


class ImageCreate(ImageBase):
    pass


class ImageResponse(ImageBase):
    id: UUID
    app_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TagBase(BaseModel):
    name: str


class TagResponse(TagBase):
    id: UUID

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    is_completed: bool = False


class TaskCreate(BaseModel):
    title: str


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None


class TaskResponse(TaskBase):
    id: UUID
    app_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class AppBase(BaseModel):
    name: str
    short_description: str
    full_description: Optional[str] = None
    status: AppStatus = AppStatus.in_development
    is_published: bool = False
    progress: int = 0
    progress_mode: ProgressMode = ProgressMode.manual
    repository_url: Optional[str] = None


class AppCreate(AppBase):
    team_id: Optional[UUID] = None
    tag_ids: Optional[List[UUID]] = None


class AppUpdate(BaseModel):
    name: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    status: Optional[AppStatus] = None
    is_published: Optional[bool] = None
    progress: Optional[int] = None
    progress_mode: Optional[ProgressMode] = None
    repository_url: Optional[str] = None
    team_id: Optional[UUID] = None
    tag_ids: Optional[List[UUID]] = None


class AppResponse(AppBase):
    id: UUID
    creator_id: UUID
    team_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    images: List[ImageResponse] = []
    tags: List[TagResponse] = []
    tasks: List[TaskResponse] = []
    vote_count: Optional[int] = None
    upvotes: Optional[int] = None
    downvotes: Optional[int] = None
    total_votes: Optional[int] = None
    comment_count: Optional[int] = None
    creator: Optional[CreatorInfo] = None

    class Config:
        from_attributes = True


class AppListItem(AppBase):
    id: UUID
    creator_id: UUID
    team_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    featured_image: Optional[ImageResponse] = None
    tags: List[TagResponse] = []
    images: List[ImageResponse] = []
    vote_count: Optional[int] = None
    comment_count: Optional[int] = None
    creator: Optional[CreatorInfo] = None

    class Config:
        from_attributes = True


# Repository/Commits schemas
class CommitInfo(BaseModel):
    sha: str
    full_sha: str
    message: str
    author: str
    date: str
    url: str


class RepoInfo(BaseModel):
    name: str
    full_name: str
    description: Optional[str] = None
    stars: int
    forks: int
    language: Optional[str] = None
    open_issues: int
    default_branch: str
    url: str
    is_private: bool


class CommitsResponse(BaseModel):
    commits: List[CommitInfo] = []
    repo_info: Optional[RepoInfo] = None
    error: Optional[str] = None
