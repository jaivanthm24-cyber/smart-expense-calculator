from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, hash_password
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    UserPasswordUpdate,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    token_response, _ = AuthService.register_user(db, user_in)
    return token_response


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    return AuthService.login_user(db, login_data)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    return AuthService.refresh_access_token(db, request.refresh_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    request: Optional[RefreshTokenRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    refresh_token_str = request.refresh_token if request else None
    AuthService.logout_user(db, current_user.id, refresh_token_str)
    return {"message": "Successfully logged out"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    raw_token = AuthService.request_password_reset(db, req.email)
    # In development/demo, we return the token in the response for convenience
    response_payload = {
        "message": "If the email is registered, password reset instructions have been generated."
    }
    if raw_token:
        response_payload["reset_token"] = raw_token
    return response_payload


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(req: PasswordResetConfirm, db: Session = Depends(get_db)):
    AuthService.confirm_password_reset(db, req.token, req.new_password)
    return {"message": "Password successfully reset. You may now log in with your new password."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = user_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(current_user, field, val)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    data: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect.",
        )
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password successfully changed."}
