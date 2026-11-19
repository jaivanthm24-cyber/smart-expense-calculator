import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    decode_token,
)
from app.core.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken, PasswordResetToken
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse


class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> Tuple[TokenResponse, User]:
        existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        hashed_pw = hash_password(user_in.password)
        db_user = User(
            email=user_in.email.lower(),
            hashed_password=hashed_pw,
            full_name=user_in.full_name,
            currency=user_in.currency or "USD",
            is_active=True,
            is_verified=True,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        access_token = create_access_token(subject=db_user.id)
        refresh_token_str, refresh_expires = create_refresh_token(subject=db_user.id)

        # Store hashed refresh token
        db_refresh = RefreshToken(
            user_id=db_user.id,
            token_hash=hash_token(refresh_token_str),
            expires_at=refresh_expires,
            revoked=False,
        )
        db.add(db_refresh)
        db.commit()

        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(db_user),
        )
        return token_response, db_user

    @staticmethod
    def login_user(db: Session, login_data: UserLogin) -> TokenResponse:
        user = db.query(User).filter(User.email == login_data.email.lower()).first()
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Please contact support.",
            )

        access_token = create_access_token(subject=user.id)
        refresh_token_str, refresh_expires = create_refresh_token(subject=user.id)

        # Store hashed refresh token
        db_refresh = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token_str),
            expires_at=refresh_expires,
            revoked=False,
        )
        db.add(db_refresh)
        db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    def refresh_access_token(db: Session, refresh_token_str: str) -> TokenResponse:
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload.",
            )

        user_id = int(user_id_str)
        token_hash = hash_token(refresh_token_str)
        token_record = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
            )
            .first()
        )

        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not recognized or already revoked.",
            )

        if token_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            token_record.revoked = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired.",
            )

        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive.",
            )

        # Issue new access token
        new_access_token = create_access_token(subject=user.id)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    def logout_user(db: Session, user_id: int, refresh_token_str: Optional[str] = None) -> None:
        if refresh_token_str:
            token_hash = hash_token(refresh_token_str)
            record = (
                db.query(RefreshToken)
                .filter(
                    RefreshToken.user_id == user_id,
                    RefreshToken.token_hash == token_hash,
                )
                .first()
            )
            if record:
                record.revoked = True
        else:
            # Revoke all active refresh tokens for user
            db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
            ).update({"revoked": True})
        db.commit()

    @staticmethod
    def request_password_reset(db: Session, email: str) -> Optional[str]:
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            # Prevent email enumeration by returning None quietly
            return None

        # Invalidate old unused tokens
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        ).update({"used": True})

        raw_reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_reset_token),
            expires_at=expires_at,
            used=False,
        )
        db.add(reset_record)
        db.commit()

        return raw_reset_token

    @staticmethod
    def confirm_password_reset(db: Session, raw_token: str, new_password: str) -> bool:
        t_hash = hash_token(raw_token)
        reset_record = (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token_hash == t_hash,
                PasswordResetToken.used == False,
            )
            .first()
        )

        if not reset_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already used password reset link.",
            )

        if reset_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            reset_record.used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset link has expired.",
            )

        user = db.query(User).filter(User.id == reset_record.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User associated with token not found.",
            )

        user.hashed_password = hash_password(new_password)
        reset_record.used = True

        # Invalidate all existing sessions
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked == False,
        ).update({"revoked": True})

        db.commit()
        return True
