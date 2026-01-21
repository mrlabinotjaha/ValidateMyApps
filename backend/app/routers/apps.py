from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..models.app import App, AppStatus, AppTag, AppTask
from ..models.image import Image
from ..models.tag import Tag
from ..models.user import User
from ..schemas.app import AppCreate, AppUpdate, AppResponse, AppListItem, ImageResponse, TagResponse, TaskCreate, TaskUpdate, TaskResponse, CommitsResponse, CommitInfo, RepoInfo
from ..services.repository import repository_service
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/api/apps", tags=["apps"])


@router.get("", response_model=List[AppResponse])
def get_apps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[AppStatus] = Query(None, alias="status"),
    creator_id: Optional[UUID] = Query(None),
    team_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|name)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    # If team_id is provided, get all team apps (not just published)
    # Otherwise only get public published apps (no team)
    if team_id:
        query = db.query(App).filter(App.team_id == team_id)
    else:
        query = db.query(App).filter(App.is_published == True, App.team_id == None)
    
    if status_filter:
        query = query.filter(App.status == status_filter)
    
    if creator_id:
        query = query.filter(App.creator_id == creator_id)
    
    if search:
        query = query.filter(
            or_(
                App.name.ilike(f"%{search}%"),
                App.short_description.ilike(f"%{search}%")
            )
        )
    
    # Sorting
    if sort_by == "created_at":
        order_by = App.created_at.desc() if order == "desc" else App.created_at.asc()
    elif sort_by == "updated_at":
        order_by = App.updated_at.desc() if order == "desc" else App.updated_at.asc()
    else:  # name
        order_by = App.name.desc() if order == "desc" else App.name.asc()
    
    query = query.order_by(order_by)
    
    apps = query.offset(skip).limit(limit).all()
    
    # Build response with vote counts
    from ..models.vote import Vote, VoteType
    result = []
    
    for app in apps:
        upvotes = db.query(Vote).filter(Vote.app_id == app.id, Vote.vote_type == VoteType.upvote).count()
        downvotes = db.query(Vote).filter(Vote.app_id == app.id, Vote.vote_type == VoteType.downvote).count()
        comment_count = len(app.comments)
        
        app_dict = {
            **{c.name: getattr(app, c.name) for c in app.__table__.columns},
            "images": app.images,
            "tags": app.tags,
            "vote_count": upvotes - downvotes,  # Keep for backward compatibility
            "upvotes": upvotes,
            "downvotes": downvotes,
            "total_votes": upvotes + downvotes,
            "comment_count": comment_count,
            "creator": {
                "id": app.creator.id,
                "username": app.creator.username,
                "full_name": app.creator.full_name
            } if app.creator else None
        }
        result.append(app_dict)
    
    return result


@router.get("/{app_id}", response_model=AppResponse)
def get_app(app_id: UUID, db: Session = Depends(get_db)):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found"
        )
    return app


@router.post("", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
def create_app(
    app_data: AppCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If team_id is provided, verify user is a team member
    if app_data.team_id:
        from ..models.team import Team, TeamMember
        team = db.query(Team).filter(Team.id == app_data.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        is_member = (
            team.owner_id == current_user.id or
            db.query(TeamMember).filter(
                TeamMember.team_id == app_data.team_id,
                TeamMember.user_id == current_user.id
            ).first() is not None
        )
        if not is_member:
            raise HTTPException(status_code=403, detail="You are not a member of this team")
    
    app = App(
        name=app_data.name,
        short_description=app_data.short_description,
        full_description=app_data.full_description,
        status=app_data.status,
        is_published=app_data.is_published,
        team_id=app_data.team_id,
        creator_id=current_user.id
    )
    
    if app_data.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(app_data.tag_ids)).all()
        app.tags = tags
    
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.put("/{app_id}", response_model=AppResponse)
def update_app(
    app_id: UUID,
    app_data: AppUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found"
        )
    
    if app.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this app"
        )
    
    update_data = app_data.dict(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)
    
    # If changing team_id, verify membership
    if "team_id" in update_data and update_data["team_id"]:
        from ..models.team import Team, TeamMember
        team = db.query(Team).filter(Team.id == update_data["team_id"]).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        is_member = (
            team.owner_id == current_user.id or
            db.query(TeamMember).filter(
                TeamMember.team_id == update_data["team_id"],
                TeamMember.user_id == current_user.id
            ).first() is not None
        )
        if not is_member:
            raise HTTPException(status_code=403, detail="You are not a member of this team")
    
    for field, value in update_data.items():
        setattr(app, field, value)
    
    if tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        app.tags = tags
    
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found"
        )
    
    if app.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this app"
        )
    
    db.delete(app)
    db.commit()
    return None


# ==================== TASK ENDPOINTS ====================

@router.get("/{app_id}/tasks", response_model=List[TaskResponse])
def get_app_tasks(
    app_id: UUID,
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app.tasks


@router.post("/{app_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_app_task(
    app_id: UUID,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    if app.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add tasks to this app")
    
    task = AppTask(
        app_id=app_id,
        title=task_data.title
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{app_id}/tasks/{task_id}", response_model=TaskResponse)
def update_app_task(
    app_id: UUID,
    task_id: UUID,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    if app.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update tasks for this app")
    
    task = db.query(AppTask).filter(AppTask.id == task_id, AppTask.app_id == app_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{app_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app_task(
    app_id: UUID,
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    if app.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete tasks for this app")

    task = db.query(AppTask).filter(AppTask.id == task_id, AppTask.app_id == app_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None


# ==================== REPOSITORY/COMMITS ENDPOINTS ====================

@router.get("/{app_id}/commits", response_model=CommitsResponse)
async def get_app_commits(
    app_id: UUID,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Fetch recent commits from the app's linked repository."""
    from ..services.repository import RepositoryService

    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found"
        )

    if not app.repository_url:
        return CommitsResponse(
            commits=[],
            error="No repository URL configured"
        )

    platform, owner, repo = RepositoryService.parse_repo_url(app.repository_url)
    if not platform or not owner or not repo:
        return CommitsResponse(
            commits=[],
            error="Invalid repository URL format. Supported: GitHub, GitLab"
        )

    # Get the app creator's GitHub token for private repo access
    creator = db.query(User).filter(User.id == app.creator_id).first()
    github_token = creator.github_access_token if creator else None

    # Create service with user's token
    repo_service = RepositoryService(github_token=github_token)

    # Fetch commits and repo info
    commits = await repo_service.get_recent_commits(app.repository_url, limit)
    repo_info = await repo_service.get_repo_info(app.repository_url)

    if not commits and not repo_info:
        return CommitsResponse(
            commits=[],
            error="Repository not found or not accessible. Connect GitHub in Settings for private repos."
        )

    return CommitsResponse(
        commits=[CommitInfo(**c) for c in commits],
        repo_info=RepoInfo(**repo_info) if repo_info else None
    )
