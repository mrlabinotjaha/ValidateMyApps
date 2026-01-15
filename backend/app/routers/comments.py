from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..models.app import App
from ..models.comment import Comment
from ..models.user import User
from ..schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/api/apps", tags=["comments"])


def build_comment_tree(comments: List[Comment]) -> List[CommentResponse]:
    """Build nested comment tree structure"""
    comment_map: dict = {}
    root_comments: List[CommentResponse] = []
    
    # First pass: create all comment responses
    for comment in comments:
        comment_response = CommentResponse.model_validate(comment)
        comment_response.replies = []
        comment_map[str(comment.id)] = comment_response
    
    # Second pass: build tree structure
    for comment in comments:
        comment_response = comment_map[str(comment.id)]
        if comment.parent_comment_id:
            parent = comment_map.get(str(comment.parent_comment_id))
            if parent:
                parent.replies.append(comment_response)
        else:
            root_comments.append(comment_response)
    
    return root_comments


@router.get("/{app_id}/comments", response_model=List[CommentResponse])
def get_comments(
    app_id: UUID,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at)$"),
    order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found"
        )
    
    # Build query
    query = db.query(Comment).filter(Comment.app_id == app_id)
    
    # Sorting
    if sort_by == "created_at":
        order_by = Comment.created_at.asc() if order == "asc" else Comment.created_at.desc()
    else:
        order_by = Comment.updated_at.asc() if order == "asc" else Comment.updated_at.desc()
    
    comments = query.order_by(order_by).all()
    return build_comment_tree(comments)


@router.post("/{app_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    app_id: UUID,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found"
        )
    
    # If parent comment specified, verify it exists and belongs to the same app
    if comment_data.parent_comment_id:
        parent = db.query(Comment).filter(
            Comment.id == comment_data.parent_comment_id,
            Comment.app_id == app_id
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment not found"
            )
    
    comment = Comment(
        app_id=app_id,
        user_id=current_user.id,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: UUID,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    db.delete(comment)
    db.commit()
    return None
