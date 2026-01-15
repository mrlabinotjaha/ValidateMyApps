from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from ..database import get_db
from ..models.app import App
from ..models.vote import Vote, VoteType
from ..models.user import User
from ..schemas.vote import VoteCreate, VoteResponse, VoteStats
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/api/apps", tags=["votes"])


@router.post("/{app_id}/vote", response_model=VoteResponse)
def vote_app(
    app_id: UUID,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found"
        )
    
    # Check if user already voted
    existing_vote = db.query(Vote).filter(
        Vote.app_id == app_id,
        Vote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        # Update existing vote
        existing_vote.vote_type = vote_data.vote_type
        db.commit()
        db.refresh(existing_vote)
        return existing_vote
    else:
        # Create new vote
        vote = Vote(
            app_id=app_id,
            user_id=current_user.id,
            vote_type=vote_data.vote_type
        )
        db.add(vote)
        db.commit()
        db.refresh(vote)
        return vote


@router.delete("/{app_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
def remove_vote(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vote = db.query(Vote).filter(
        Vote.app_id == app_id,
        Vote.user_id == current_user.id
    ).first()
    
    if vote:
        db.delete(vote)
        db.commit()
    
    return None


@router.get("/{app_id}/votes", response_model=VoteStats)
def get_vote_stats(
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
    
    upvotes = db.query(Vote).filter(Vote.app_id == app_id, Vote.vote_type == VoteType.upvote).count()
    downvotes = db.query(Vote).filter(Vote.app_id == app_id, Vote.vote_type == VoteType.downvote).count()
    
    user_vote = db.query(Vote).filter(
        Vote.app_id == app_id,
        Vote.user_id == current_user.id
    ).first()
    
    return VoteStats(
        upvotes=upvotes,
        downvotes=downvotes,
        net_score=upvotes - downvotes,
        user_vote=user_vote.vote_type if user_vote else None
    )
