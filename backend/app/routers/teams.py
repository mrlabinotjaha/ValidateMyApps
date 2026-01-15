from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models.team import Team, TeamMember, TeamInvitation, TeamRole, InvitationStatus
from ..models.user import User
from ..schemas.team import (
    TeamCreate, TeamUpdate, TeamResponse, TeamListItem,
    TeamMemberCreate, TeamMemberResponse,
    TeamInvitationCreate, TeamInvitationResponse, OwnerInfo
)
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/api/teams", tags=["teams"])


# Helper function to check team access
def check_team_access(team: Team, user: Optional[User], require_edit: bool = False) -> bool:
    """Check if user has access to team. Returns True if allowed."""
    if not user:
        return False
    if team.owner_id == user.id:
        return True
    # Check if user is a member
    for member in team.members:
        if member.user_id == user.id:
            if require_edit:
                return member.role in [TeamRole.owner, TeamRole.admin]
            return True
    return False


@router.get("", response_model=List[TeamListItem])
def get_teams(
    my_teams: bool = Query(True, description="Get only teams user is member of or invited to"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get teams. If my_teams=True, returns only user's teams and pending invitations."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if my_teams:
        # Get teams where user is owner or member
        member_team_ids = db.query(TeamMember.team_id).filter(
            TeamMember.user_id == current_user.id
        ).subquery()
        
        query = db.query(Team).options(joinedload(Team.apps)).filter(
            or_(
                Team.owner_id == current_user.id,
                Team.id.in_(member_team_ids)
            )
        )
        
        teams = query.order_by(Team.updated_at.desc()).all()
        
        # Also get pending invitations
        pending_invitations = db.query(TeamInvitation).filter(
            TeamInvitation.email == current_user.email,
            TeamInvitation.status == InvitationStatus.pending
        ).all()
        
        invitation_team_ids = {inv.team_id for inv in pending_invitations}
        
        # Get teams for pending invitations
        if invitation_team_ids:
            invited_teams = db.query(Team).options(joinedload(Team.apps)).filter(Team.id.in_(invitation_team_ids)).all()
            teams.extend(invited_teams)
        
        result = []
        for team in teams:
            invitation_status = None
            if team.id in invitation_team_ids:
                invitation_status = 'pending'
            
            result.append({
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "owner_id": team.owner_id,
                "created_at": team.created_at,
                "updated_at": team.updated_at,
                "owner": {
                    "id": team.owner.id,
                    "username": team.owner.username,
                    "full_name": team.owner.full_name
                },
                "member_count": len(team.members),
                "app_count": len(team.apps),
                "invitation_status": invitation_status
            })
        
        return result
    else:
        # Get all teams (for admin or public listing)
        teams = db.query(Team).options(joinedload(Team.apps)).order_by(Team.updated_at.desc()).all()
        result = []
        for team in teams:
            result.append({
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "owner_id": team.owner_id,
                "created_at": team.created_at,
                "updated_at": team.updated_at,
                "owner": {
                    "id": team.owner.id,
                    "username": team.owner.username,
                    "full_name": team.owner.full_name
                },
                "member_count": len(team.members),
                "app_count": len(team.apps),
                "invitation_status": None
            })
        return result


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: UUID,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single team by ID"""
    team = db.query(Team).options(joinedload(Team.apps)).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check access
    if not check_team_access(team, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this team"
        )
    
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "owner_id": team.owner_id,
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": {
            "id": team.owner.id,
            "username": team.owner.username,
            "full_name": team.owner.full_name
        },
        "member_count": len(team.members),
        "app_count": len(team.apps)
    }


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new team with optional initial invitations"""
    team = Team(
        name=team_data.name,
        description=team_data.description,
        owner_id=current_user.id
    )
    
    db.add(team)
    db.flush()  # Get the team ID
    
    # Add owner as a member with owner role
    owner_member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamRole.owner
    )
    db.add(owner_member)
    
    # Create initial invitations if provided
    if team_data.initial_invitations:
        for email in team_data.initial_invitations:
            if email and email.strip():
                email = email.strip()
                # Check if user with this email exists and is already a member
                user = db.query(User).filter(User.email == email).first()
                if user:
                    existing_member = db.query(TeamMember).filter(
                        TeamMember.team_id == team.id,
                        TeamMember.user_id == user.id
                    ).first()
                    if existing_member:
                        continue  # Skip if already a member
                
                # Check if there's already a pending invitation
                existing_invitation = db.query(TeamInvitation).filter(
                    TeamInvitation.team_id == team.id,
                    TeamInvitation.email == email,
                    TeamInvitation.status == InvitationStatus.pending
                ).first()
                
                if not existing_invitation:
                    invitation = TeamInvitation(
                        team_id=team.id,
                        email=email,
                        invited_by_id=current_user.id,
                        status=InvitationStatus.pending
                    )
                    db.add(invitation)
    
    db.commit()
    db.refresh(team)
    
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "owner_id": team.owner_id,
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name
        },
        "member_count": 1,
        "app_count": 0
    }


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: UUID,
    team_data: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a team"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not check_team_access(team, current_user, require_edit=True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this team"
        )
    
    update_data = team_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    
    db.commit()
    db.refresh(team)
    
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "owner_id": team.owner_id,
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": {
            "id": team.owner.id,
            "username": team.owner.username,
            "full_name": team.owner.full_name
        },
        "member_count": len(team.members),
        "app_count": len(team.apps)
    }


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a team (owner only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if team.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can delete this team"
        )
    
    db.delete(team)
    db.commit()
    return None


# ==================== MEMBER ENDPOINTS ====================

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
def get_team_members(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all members of a team"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not check_team_access(team, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this team's members"
        )
    
    result = []
    for member in team.members:
        result.append({
            "id": member.id,
            "team_id": member.team_id,
            "user_id": member.user_id,
            "role": member.role,
            "joined_at": member.joined_at,
            "user": {
                "id": member.user.id,
                "username": member.user.username,
                "full_name": member.user.full_name
            }
        })
    
    return result


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: UUID,
    member_data: TeamMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a member to a team (owner/admin only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not check_team_access(team, current_user, require_edit=True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add members to this team"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already a member
    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == member_data.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team"
        )
    
    member = TeamMember(
        team_id=team_id,
        user_id=member_data.user_id,
        role=member_data.role
    )
    
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return {
        "id": member.id,
        "team_id": member.team_id,
        "user_id": member.user_id,
        "role": member.role,
        "joined_at": member.joined_at,
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name
        }
    }


@router.delete("/{team_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from a team (owner/admin only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not check_team_access(team, current_user, require_edit=True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove members from this team"
        )
    
    member = db.query(TeamMember).filter(
        TeamMember.id == member_id,
        TeamMember.team_id == team_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Can't remove the owner
    if member.role == TeamRole.owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the team owner"
        )
    
    db.delete(member)
    db.commit()
    return None


# ==================== INVITATION ENDPOINTS ====================

@router.get("/{team_id}/invitations", response_model=List[TeamInvitationResponse])
def get_team_invitations(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all invitations for a team (owner/admin only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not check_team_access(team, current_user, require_edit=True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can view invitations"
        )
    
    invitations = db.query(TeamInvitation).filter(
        TeamInvitation.team_id == team_id
    ).order_by(TeamInvitation.created_at.desc()).all()
    
    result = []
    for invitation in invitations:
        result.append({
            "id": invitation.id,
            "team_id": invitation.team_id,
            "email": invitation.email,
            "invited_by_id": invitation.invited_by_id,
            "status": invitation.status,
            "created_at": invitation.created_at,
            "responded_at": invitation.responded_at,
            "invited_by": {
                "id": invitation.invited_by.id,
                "username": invitation.invited_by.username,
                "full_name": invitation.invited_by.full_name
            }
        })
    
    return result


@router.post("/{team_id}/invitations", response_model=TeamInvitationResponse, status_code=status.HTTP_201_CREATED)
def create_team_invitation(
    team_id: UUID,
    invitation_data: TeamInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an invitation to a team (owner/admin only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not check_team_access(team, current_user, require_edit=True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can send invitations"
        )
    
    # Check if user with this email exists
    user = db.query(User).filter(User.email == invitation_data.email).first()
    
    # If user exists, check if already a member
    if user:
        existing_member = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user.id
        ).first()
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this team"
            )
    
    # Check if there's already a pending invitation for this email
    existing_invitation = db.query(TeamInvitation).filter(
        TeamInvitation.team_id == team_id,
        TeamInvitation.email == invitation_data.email,
        TeamInvitation.status == InvitationStatus.pending
    ).first()
    
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An invitation has already been sent to this email"
        )
    
    invitation = TeamInvitation(
        team_id=team_id,
        email=invitation_data.email,
        invited_by_id=current_user.id,
        status=InvitationStatus.pending
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    return {
        "id": invitation.id,
        "team_id": invitation.team_id,
        "email": invitation.email,
        "invited_by_id": invitation.invited_by_id,
        "status": invitation.status,
        "created_at": invitation.created_at,
        "responded_at": invitation.responded_at,
        "invited_by": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name
        }
    }


@router.post("/{team_id}/invitations/{invitation_id}/accept", status_code=status.HTTP_204_NO_CONTENT)
def accept_invitation(
    team_id: UUID,
    invitation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a team invitation"""
    invitation = db.query(TeamInvitation).filter(
        TeamInvitation.id == invitation_id,
        TeamInvitation.team_id == team_id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if invitation is for current user's email
    if invitation.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is not for you"
        )
    
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been responded to"
        )
    
    # Add user as member
    member = TeamMember(
        team_id=team_id,
        user_id=current_user.id,
        role=TeamRole.member
    )
    db.add(member)
    
    # Update invitation status
    invitation.status = InvitationStatus.accepted
    invitation.responded_at = datetime.utcnow()
    
    db.commit()
    return None


@router.post("/{team_id}/invitations/{invitation_id}/decline", status_code=status.HTTP_204_NO_CONTENT)
def decline_invitation(
    team_id: UUID,
    invitation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline a team invitation"""
    invitation = db.query(TeamInvitation).filter(
        TeamInvitation.id == invitation_id,
        TeamInvitation.team_id == team_id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if invitation is for current user's email
    if invitation.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is not for you"
        )
    
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been responded to"
        )
    
    invitation.status = InvitationStatus.declined
    invitation.responded_at = datetime.utcnow()
    
    db.commit()
    return None


@router.delete("/{team_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invitation(
    team_id: UUID,
    invitation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an invitation (owner/admin only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not check_team_access(team, current_user, require_edit=True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can delete invitations"
        )
    
    invitation = db.query(TeamInvitation).filter(
        TeamInvitation.id == invitation_id,
        TeamInvitation.team_id == team_id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    db.delete(invitation)
    db.commit()
    return None
