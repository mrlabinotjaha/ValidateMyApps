from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
import re

from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.user import UserCreate, UserLogin, UserResponse, Token, ResetPasswordRequest
from ..utils.security import verify_password, get_password_hash, create_access_token
from ..utils.dependencies import get_current_user
from ..utils.oauth import oauth
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


def generate_unique_username(email: str, db: Session) -> str:
    """Generate a unique username from email."""
    base_username = email.split('@')[0]
    # Clean username - only allow alphanumeric and underscores
    base_username = re.sub(r'[^a-zA-Z0-9_]', '', base_username)
    if len(base_username) < 3:
        base_username = "user"

    username = base_username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1
    return username


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role=UserRole.developer  # Default role for new users
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # Allow login with username or email
    user = db.query(User).filter(
        (User.username == credentials.username) | (User.email == credentials.username)
    ).first()

    # Check if user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if this is an OAuth-only account
    if user.oauth_provider and not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"This account uses {user.oauth_provider.title()} sign-in. Please use the '{user.oauth_provider.title()}' button to log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(current_user.id)},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# Google OAuth endpoints
@router.get("/google/login")
async def google_login(request: Request):
    """Redirect to Google OAuth login."""
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured"
        )
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured"
        )

    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=oauth_failed"
        )

    user_info = token.get('userinfo')
    if not user_info:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=oauth_failed"
        )

    google_id = user_info.get('sub')
    email = user_info.get('email')

    # Check if user exists by oauth_id
    user = db.query(User).filter(User.oauth_id == google_id).first()

    if not user:
        # Check if email already registered with password
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            # Link OAuth to existing account if no oauth_id yet
            if not existing_user.oauth_id:
                existing_user.oauth_provider = 'google'
                existing_user.oauth_id = google_id
                existing_user.is_email_verified = True
                if user_info.get('picture') and not existing_user.avatar_url:
                    existing_user.avatar_url = user_info.get('picture')
                db.commit()
                user = existing_user
            else:
                return RedirectResponse(
                    url=f"{settings.frontend_url}/login?error=email_exists"
                )
        else:
            # Create new user
            user = User(
                username=generate_unique_username(email, db),
                email=email,
                full_name=user_info.get('name'),
                avatar_url=user_info.get('picture'),
                oauth_provider='google',
                oauth_id=google_id,
                is_email_verified=True,
                password_hash=None,
                role=UserRole.developer
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # Generate JWT token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    # Redirect to frontend with token
    return RedirectResponse(
        url=f"{settings.frontend_url}/oauth/callback?token={access_token}"
    )


# GitHub OAuth endpoints (for connecting GitHub to access private repos)
@router.get("/github/connect")
async def github_connect(
    request: Request,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Redirect to GitHub OAuth to connect user's GitHub account.

    Accepts token as query parameter since this is accessed via direct link.
    """
    from ..utils.security import decode_access_token
    from uuid import UUID

    if not settings.github_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth is not configured"
        )

    # Validate token from query parameter
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token required. Add ?token=YOUR_TOKEN to the URL"
        )

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user = db.query(User).filter(User.id == UUID(user_id_str)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Store user ID in session for callback
    request.session["user_id"] = str(user.id)

    # Redirect to GitHub OAuth
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={settings.github_redirect_uri}"
        f"&scope=repo,read:user"
        f"&state={user.id}"
    )
    return RedirectResponse(url=github_auth_url)


@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None,
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback."""
    if error or not code:
        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?error=github_auth_failed"
        )

    if not settings.github_client_id:
        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?error=github_not_configured"
        )

    try:
        # Exchange code for access token
        import httpx
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": settings.github_redirect_uri,
                },
                headers={"Accept": "application/json"}
            )
            token_data = token_response.json()

        if "error" in token_data:
            return RedirectResponse(
                url=f"{settings.frontend_url}/settings?error=github_token_failed"
            )

        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(
                url=f"{settings.frontend_url}/settings?error=github_no_token"
            )

        # Get GitHub user info
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            github_user = user_response.json()

        github_username = github_user.get("login")

        # Find user by state (user_id)
        user = db.query(User).filter(User.id == state).first()
        if not user:
            return RedirectResponse(
                url=f"{settings.frontend_url}/settings?error=user_not_found"
            )

        # Update user with GitHub token
        user.github_access_token = access_token
        user.github_username = github_username
        db.commit()

        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?github=connected"
        )

    except Exception as e:
        print(f"GitHub OAuth error: {e}")
        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?error=github_auth_failed"
        )


@router.post("/github/disconnect")
async def github_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect user's GitHub account."""
    current_user.github_access_token = None
    current_user.github_username = None
    db.commit()
    return {"message": "GitHub disconnected successfully"}


@router.get("/github/status")
async def github_status(current_user: User = Depends(get_current_user)):
    """Check if user has GitHub connected."""
    return {
        "connected": bool(current_user.github_access_token),
        "username": current_user.github_username
    }


# Password Reset endpoint (simplified for testing - no email verification)
@router.post("/reset-password")
def reset_password(request_data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password directly with email and new password."""
    user = db.query(User).filter(User.email == request_data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No account found with that email"
        )

    # Check if this is an OAuth-only account
    if user.oauth_provider and not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account uses {user.oauth_provider.title()} sign-in. Password cannot be reset."
        )

    # Validate new password length
    if len(request_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )

    # Update password
    user.password_hash = get_password_hash(request_data.new_password)
    db.commit()

    return {"message": "Password has been reset successfully"}
