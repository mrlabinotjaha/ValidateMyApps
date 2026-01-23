from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..models.app_request import AppRequest, RequestStatus
from ..models.claim_request import ClaimRequest, ClaimStatus
from ..models.user import User
from ..models.notification import Notification, NotificationType
from ..schemas.app_request import (
    AppRequestCreate,
    AppRequestUpdate,
    AppRequestResponse,
    AppRequestAssign,
    ClaimRequestCreate,
    ClaimRequestResponse,
)
from ..utils.dependencies import get_current_user, get_optional_user

router = APIRouter(prefix="/api/app-requests", tags=["app-requests"])


def create_notification(
    db: Session,
    user_id: UUID,
    notification_type: NotificationType,
    title: str,
    message: str = None,
    related_id: UUID = None,
    related_type: str = None,
):
    """Helper to create a notification."""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        related_id=related_id,
        related_type=related_type,
    )
    db.add(notification)
    return notification


def add_pending_claims_count(app_requests: List[AppRequest], db: Session) -> List[dict]:
    """Add pending claims count to app requests."""
    result = []
    for req in app_requests:
        req_dict = {
            "id": req.id,
            "name": req.name,
            "description": req.description,
            "status": req.status,
            "requester_id": req.requester_id,
            "requester": req.requester,
            "assignee_id": req.assignee_id,
            "assignee": req.assignee,
            "assigned_email": req.assigned_email,
            "app_id": req.app_id,
            "app": req.app,
            "team_id": req.team_id,
            "team": req.team,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
            "pending_claims_count": db.query(func.count(ClaimRequest.id)).filter(
                ClaimRequest.app_request_id == req.id,
                ClaimRequest.status == ClaimStatus.pending
            ).scalar() or 0
        }
        result.append(req_dict)
    return result


@router.get("", response_model=List[AppRequestResponse])
def get_app_requests(
    status: Optional[str] = None,
    team_id: Optional[UUID] = None,
    my_requests: bool = False,
    assigned_to_me: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get all app requests with optional filters."""
    query = db.query(AppRequest)

    if status:
        query = query.filter(AppRequest.status == status)

    if team_id:
        query = query.filter(AppRequest.team_id == team_id)

    if my_requests and current_user:
        query = query.filter(AppRequest.requester_id == current_user.id)

    if assigned_to_me and current_user:
        query = query.filter(
            or_(
                AppRequest.assignee_id == current_user.id,
                AppRequest.assigned_email == current_user.email,
            )
        )

    app_requests = query.order_by(AppRequest.created_at.desc()).all()
    return add_pending_claims_count(app_requests, db)


@router.get("/{request_id}", response_model=AppRequestResponse)
def get_app_request(
    request_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a specific app request."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )
    return app_request


@router.post("", response_model=AppRequestResponse, status_code=status.HTTP_201_CREATED)
def create_app_request(
    request_data: AppRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new app request."""
    # Check if assigned_email is provided and user exists
    assignee_id = None
    assigned_user = None
    assigned_status = RequestStatus.open

    if request_data.assigned_email:
        existing_user = db.query(User).filter(User.email == request_data.assigned_email).first()
        if existing_user:
            assignee_id = existing_user.id
            assigned_user = existing_user
        assigned_status = RequestStatus.assigned

    app_request = AppRequest(
        name=request_data.name,
        description=request_data.description,
        team_id=request_data.team_id,
        requester_id=current_user.id,
        assignee_id=assignee_id,
        assigned_email=request_data.assigned_email,
        status=assigned_status,
    )

    db.add(app_request)
    db.flush()  # Get the app_request.id before commit

    # Create notification for the assigned user
    if assigned_user:
        create_notification(
            db=db,
            user_id=assigned_user.id,
            notification_type=NotificationType.request_assigned,
            title=f"You've been assigned to: {app_request.name}",
            message=f"{current_user.full_name or current_user.username} assigned you to work on this request.",
            related_id=app_request.id,
            related_type="app_request",
        )

    db.commit()
    db.refresh(app_request)
    return app_request


@router.put("/{request_id}", response_model=AppRequestResponse)
def update_app_request(
    request_id: UUID,
    request_data: AppRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an app request (only requester can update)."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )

    if app_request.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can update this request",
        )

    update_data = request_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(app_request, field, value)

    db.commit()
    db.refresh(app_request)
    return app_request


@router.post("/{request_id}/assign", response_model=AppRequestResponse)
def assign_app_request(
    request_id: UUID,
    assign_data: AppRequestAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign an app request to a user (by email or user_id)."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )

    # Only requester can assign
    if app_request.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can assign this request",
        )

    assigned_user = None
    if assign_data.user_id:
        user = db.query(User).filter(User.id == assign_data.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        app_request.assignee_id = user.id
        app_request.assigned_email = user.email
        assigned_user = user
    elif assign_data.email:
        # Check if user exists
        user = db.query(User).filter(User.email == assign_data.email).first()
        if user:
            app_request.assignee_id = user.id
            assigned_user = user
        app_request.assigned_email = assign_data.email
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or user_id must be provided",
        )

    app_request.status = RequestStatus.assigned

    # Create notification for the assigned user
    if assigned_user:
        create_notification(
            db=db,
            user_id=assigned_user.id,
            notification_type=NotificationType.request_assigned,
            title=f"You've been assigned to: {app_request.name}",
            message=f"{current_user.full_name or current_user.username} assigned you to work on this request.",
            related_id=app_request.id,
            related_type="app_request",
        )

    db.commit()
    db.refresh(app_request)
    return app_request


@router.post("/{request_id}/claim", response_model=ClaimRequestResponse, status_code=status.HTTP_201_CREATED)
def request_to_claim(
    request_id: UUID,
    claim_data: ClaimRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Request to claim an app request (requires approval from requester)."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )

    if app_request.status not in [RequestStatus.open]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request is not available to claim",
        )

    # Can't claim your own request
    if app_request.requester_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot claim your own request",
        )

    # Check if user already has a pending claim
    existing_claim = db.query(ClaimRequest).filter(
        ClaimRequest.app_request_id == request_id,
        ClaimRequest.claimer_id == current_user.id,
        ClaimRequest.status == ClaimStatus.pending
    ).first()

    if existing_claim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending claim for this request",
        )

    claim_request = ClaimRequest(
        app_request_id=request_id,
        claimer_id=current_user.id,
        message=claim_data.message,
        status=ClaimStatus.pending,
    )

    db.add(claim_request)

    # Notify the requester about the new claim
    create_notification(
        db=db,
        user_id=app_request.requester_id,
        notification_type=NotificationType.new_claim,
        title=f"New claim request for: {app_request.name}",
        message=f"{current_user.full_name or current_user.username} wants to work on your request.",
        related_id=app_request.id,
        related_type="app_request",
    )

    db.commit()
    db.refresh(claim_request)
    return claim_request


@router.get("/{request_id}/claims", response_model=List[ClaimRequestResponse])
def get_claim_requests(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all claim requests for an app request (only requester can see)."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )

    # Only requester can see claims
    if app_request.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can view claims",
        )

    return db.query(ClaimRequest).filter(
        ClaimRequest.app_request_id == request_id
    ).order_by(ClaimRequest.created_at.desc()).all()


@router.post("/{request_id}/claims/{claim_id}/approve", response_model=AppRequestResponse)
def approve_claim(
    request_id: UUID,
    claim_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a claim request and assign the app request to the claimer."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )

    # Only requester can approve
    if app_request.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can approve claims",
        )

    claim = db.query(ClaimRequest).filter(
        ClaimRequest.id == claim_id,
        ClaimRequest.app_request_id == request_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim request not found",
        )

    if claim.status != ClaimStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This claim has already been processed",
        )

    # Approve the claim
    claim.status = ClaimStatus.approved

    # Assign the app request to the claimer
    app_request.assignee_id = claim.claimer_id
    app_request.status = RequestStatus.in_progress

    # Notify the approved claimer
    create_notification(
        db=db,
        user_id=claim.claimer_id,
        notification_type=NotificationType.claim_approved,
        title=f"Your claim was approved: {app_request.name}",
        message=f"You've been assigned to work on this request. Time to get started!",
        related_id=app_request.id,
        related_type="app_request",
    )

    # Get other pending claims to notify them
    other_claims = db.query(ClaimRequest).filter(
        ClaimRequest.app_request_id == request_id,
        ClaimRequest.id != claim_id,
        ClaimRequest.status == ClaimStatus.pending
    ).all()

    # Notify denied claimers
    for other_claim in other_claims:
        create_notification(
            db=db,
            user_id=other_claim.claimer_id,
            notification_type=NotificationType.claim_denied,
            title=f"Your claim was not selected: {app_request.name}",
            message=f"Another developer was chosen for this request.",
            related_id=app_request.id,
            related_type="app_request",
        )
        other_claim.status = ClaimStatus.denied

    db.commit()
    db.refresh(app_request)
    return app_request


@router.post("/{request_id}/claims/{claim_id}/deny", response_model=ClaimRequestResponse)
def deny_claim(
    request_id: UUID,
    claim_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deny a claim request."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )

    # Only requester can deny
    if app_request.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can deny claims",
        )

    claim = db.query(ClaimRequest).filter(
        ClaimRequest.id == claim_id,
        ClaimRequest.app_request_id == request_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim request not found",
        )

    if claim.status != ClaimStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This claim has already been processed",
        )

    claim.status = ClaimStatus.denied

    # Notify the claimer that their claim was denied
    create_notification(
        db=db,
        user_id=claim.claimer_id,
        notification_type=NotificationType.claim_denied,
        title=f"Your claim was denied: {app_request.name}",
        message=f"The requester chose not to accept your claim for this request.",
        related_id=app_request.id,
        related_type="app_request",
    )

    db.commit()
    db.refresh(claim)
    return claim


@router.post("/{request_id}/complete", response_model=AppRequestResponse)
def complete_app_request(
    request_id: UUID,
    app_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an app request as completed and link to the created app."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )

    # Only assignee can complete
    if app_request.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assignee can complete this request",
        )

    app_request.app_id = app_id
    app_request.status = RequestStatus.completed
    db.commit()
    db.refresh(app_request)
    return app_request


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an app request (only requester can delete)."""
    app_request = db.query(AppRequest).filter(AppRequest.id == request_id).first()
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App request not found",
        )

    if app_request.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can delete this request",
        )

    db.delete(app_request)
    db.commit()
