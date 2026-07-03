from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.db import get_db
from models.auth_schemas import AuthResponse, LoginRequest, ProfileUpdateRequest, SignupRequest, UserResponse
from models.db_models import User
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    if auth_service.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists.")

    user = auth_service.create_user(
        db,
        name=payload.name,
        email=payload.email,
        password=payload.password,
        role=payload.role,
        company=payload.company,
    )
    token = auth_service.create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")

    token = auth_service.create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(auth_service.get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    if payload.name is not None:
        current_user.name = payload.name
    if payload.role is not None:
        current_user.role = payload.role
    if payload.company is not None:
        current_user.company = payload.company

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
