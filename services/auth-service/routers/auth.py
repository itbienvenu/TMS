from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from datetime import datetime, UTC, timedelta
from typing import List

# Relies on local copies of these moduels
from methods.functions import (
    create_user,
    login_user,
    get_current_user,
    generate_otp_code,
    create_access_token,
    send_email,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    verify_password
)
from methods.permissions import check_permission, get_current_company_user
from schemas.LoginRegisteScheme import RegisterUser, LoginUser, UpdateUser, UserOut, CompanyLoginStart, CompanyLoginVerify

# In main.py we can override get_db dependency or setup a global engine in common/database.py
# For simplicity, we wil import get_db from a local dependency wrapper.
from common.database import get_db_engine, get_db_session

# Simple Dependency Wrapper
def get_db():
    engine = get_db_engine("auth")
    db = next(get_db_session(engine))
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# ... (Logic copied from login_router.py but adapted path /api/v1/auth) ...

@router.post("/login")
async def login(user: LoginUser, db: Session = Depends(get_db)):
    # Note: get_db needs an engine. We need to inject engine or fix get_db dependencies.
    # In common/database.py, get_db_session expects engine arg, which FastAPI Depends cannot provide easily 
    # unless we wrap it.
    # For now, let's just make get_db use a singleton engine.
    return login_user(db, user)

@router.post("/company-login/start")
async def company_login_start(
    payload: CompanyLoginStart,
    db: Session = Depends(get_db),
):
    company_user = db.query(CompanyUser).filter(CompanyUser.login_email == payload.login_email).first()
    if not company_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company user not found")

    if not verify_password(payload.password, company_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    code = generate_otp_code()
    expires_at = datetime.now(UTC) + timedelta(minutes=10)

    otp_entry = LoginOTP(
        company_user_id=company_user.id,
        code=code,
        expires_at=expires_at,
        consumed=False,
    )
    db.add(otp_entry)
    db.commit()

    if company_user.email:
        send_email(
            to_email=company_user.email,
            subject="Your login OTP",
            body=f"Your OTP code is: {code}. It expires in 10 minutes.",
        )

    return {"message": "OTP sent to your registered email"}


@router.post("/company-login/verify")
async def company_login_verify(
    payload: CompanyLoginVerify,
    db: Session = Depends(get_db),
):
    company_user = db.query(CompanyUser).filter(CompanyUser.login_email == payload.login_email).first()
    if not company_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company user not found")

    otp_entry = (
        db.query(LoginOTP)
        .filter(LoginOTP.company_user_id == company_user.id, LoginOTP.code == payload.code, LoginOTP.consumed == False)
        .order_by(LoginOTP.expires_at.desc())
        .first()
    )

    if not otp_entry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code")

    expires_at = otp_entry.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)

    if expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")

    otp_entry.consumed = True
    db.commit()

    token = create_access_token(
        data={
            "sub": str(company_user.id),
            "company_id": str(company_user.company_id),
            "user_type": "company_user"
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/register", response_model=UserOut)
async def register(user: RegisterUser, db: Session = Depends(get_db)):
    return create_user(db, user)

@router.get("/me")
async def get_users_me(current_user = Depends(get_current_user)):
    if isinstance(current_user, CompanyUser):
        role_names = [r.name for r in (current_user.roles or [])]
        primary_role = role_names[0] if role_names else None
        return {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "company_id": str(current_user.company_id),
            "role": primary_role,
            "roles": role_names,
            "user_type": "company_user"
        }
    else:
        return {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "user_type": "user"
        }
