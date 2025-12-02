from fastapi import APIRouter, Depends, HTTPException, Body, status
from methods.functions import (
    create_user,
    login_user,
    get_current_user,
    generate_otp_code,
    create_access_token,
    send_email,
)
from methods.permissions import check_permission
from schemas.LoginRegisteScheme import RegisterUser, LoginUser, UpdateUser, UserOut, CompanyLoginStart, CompanyLoginVerify
from database.dbs import get_db
from database.models import User, Payment, Role, LoginOTP
from datetime import datetime, UTC, timedelta
from sqlalchemy.orm import Session
from typing import List
router = APIRouter(prefix="/api/v1", tags=["User Managment"])

@router.post("/login")
async def login(user: LoginUser, db: Session = Depends(get_db)):
    return login_user(db, user)


@router.post("/company-login/start")
async def company_login_start(
    payload: CompanyLoginStart,
    db: Session = Depends(get_db),
):
    """
    Step 1 of company login:
    - User submits company-issued `login_email` and password.
    - We verify password.
    - We generate an OTP, persist it, and (you must) send it to the real `user.email`.
    """
    user = db.query(User).filter(User.login_email == payload.login_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    from methods.functions import verify_password  # avoid circular import at top

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Generate and store OTP
    code = generate_otp_code()
    expires_at = datetime.now(UTC) + timedelta(minutes=10)

    otp_entry = LoginOTP(
        user_id=user.id,
        code=code,
        expires_at=expires_at,
        consumed=False,
    )
    db.add(otp_entry)
    db.commit()

    # Send OTP via Gmail SMTP to the user's real email
    if user.email:
        send_email(
            to_email=user.email,
            subject="Your login OTP",
            body=f"Your OTP code is: {code}. It expires in 10 minutes.",
        )

    return {"message": "OTP sent to your registered email"}


@router.post("/company-login/verify")
async def company_login_verify(
    payload: CompanyLoginVerify,
    db: Session = Depends(get_db),
):
    """
    Step 2 of company login:
    - User submits company-issued `login_email` and the OTP code.
    - If valid and not expired, issue a JWT token.
    """
    user = db.query(User).filter(User.login_email == payload.login_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp_entry = (
        db.query(LoginOTP)
        .filter(LoginOTP.user_id == user.id, LoginOTP.code == payload.code, LoginOTP.consumed == False)  # noqa: E712
        .order_by(LoginOTP.expires_at.desc())
        .first()
    )

    if not otp_entry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code")

    if otp_entry.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")

    otp_entry.consumed = True
    db.commit()

    token = create_access_token(
        data={"sub": str(user.id), "company_id": str(user.company_id)},
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
async def get_users_me(current_user: User = Depends(get_current_user)):
    role_names = [r.name for r in (current_user.roles or [])]
    primary_role = role_names[0] if role_names else None

    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "role": primary_role,   # single role for legacy clients
        "roles": role_names
    }

# Endpoint to delete User

@router.delete("/users/{user_id}", dependencies=[Depends(get_current_user), Depends(check_permission("delete_user"))])
def delete_user(user_id, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    payments = db.query(Payment).filter(Payment.user_id == user.id).all()
    for payment in payments:
        db.delete(payment)
    db.delete(user)
    db.commit()
    return {"message":f"User with id: {user_id}, deleted well"}

# Endpoint to Edit User

@router.patch("/users/{user_id}", response_model=UserOut, dependencies=[Depends(check_permission("update_user"))])
async def update_user(
    user_id: str,
    db: Session = Depends(get_db),
    user: UpdateUser = Body(...),
    current_user = Depends(get_current_user)
):
    get_user = db.query(User).filter(User.id == str(user_id)).first()
    if not get_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update normal fields
    updated_data = user.model_dump(exclude_unset=True)
    for key, value in updated_data.items():
        if key != "role":
            setattr(get_user, key, value)

    # Update role if provided
    if user.role:
        role_obj = db.query(Role).filter(Role.name == user.role).first()
        if not role_obj:
            raise HTTPException(status_code=404, detail="Role not found")
        get_user.roles = [role_obj]  # replace old roles with the new one

    db.commit()
    db.refresh(get_user)

    # Prepare response with role name
    role_name = get_user.roles[0].name if get_user.roles else None
    return UserOut(
        id=get_user.id,
        full_name=get_user.full_name,
        email=get_user.email,
        phone_number=get_user.phone_number,
        role=role_name
    )
   

# Endpoint to get all user
@router.get("/users", response_model=List[UserOut], dependencies=[Depends(check_permission("view_users"))])
def get_all_users(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    users = db.query(User).all()
    
    result = []
    for u in users:
        # Take the first role name if available
        role_name = u.roles[0].name if u.roles else None
        result.append(UserOut(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone_number=u.phone_number,
            role=role_name
        ))
    
    return result