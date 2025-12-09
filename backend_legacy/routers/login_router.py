from fastapi import APIRouter, Depends, HTTPException, Body, status
from methods.functions import (
    create_user,
    login_user,
    get_current_user,
    generate_otp_code,
    create_access_token,
    send_email,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from methods.permissions import check_permission, get_current_company_user
from schemas.LoginRegisteScheme import RegisterUser, LoginUser, UpdateUser, UserOut, CompanyLoginStart, CompanyLoginVerify
from database.dbs import get_db
from database.models import User, CompanyUser, Payment, Role, LoginOTP
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
    - Company user submits company-issued `login_email` and password.
    - We verify password.
    - We generate an OTP, persist it, and send it to the real `company_user.email`.
    """
    company_user = db.query(CompanyUser).filter(CompanyUser.login_email == payload.login_email).first()
    if not company_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company user not found")

    from methods.functions import verify_password  # avoid circular import at top

    if not verify_password(payload.password, company_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Generate and store OTP
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

    # Send OTP via Gmail SMTP to the company user's real email
    print(f"\n[DEBUG] Generated OTP for {payload.login_email}: {code} (Send to: {company_user.email})\n")
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
    """
    Step 2 of company login:
    - Company user submits company-issued `login_email` and the OTP code.
    - If valid and not expired, issue a JWT token.
    """
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

    # Ensure expires_at is timezone-aware for comparison
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
    """
    Get current user info - works for both regular User and CompanyUser.
    """
    from database.models import CompanyUser
    
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
        # Regular user (customer)
        return {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "user_type": "user"
        }

# Endpoint to delete User

@router.delete("/users/{user_id}", dependencies=[Depends(get_current_company_user), Depends(check_permission("delete_user"))])
async def delete_user(user_id, db: Session = Depends(get_db), current_user = Depends(get_current_company_user)):
    """
    Delete a company user.
    Only company admins can do this, and only for company users in their company.
    """
    company_user = db.query(CompanyUser).filter(CompanyUser.id == user_id).first()
    if not company_user:
        raise HTTPException(status_code=404, detail="Company user not found")
    
    # Ensure company user belongs to the same company
    if company_user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only delete company users in your company")
    
    db.delete(company_user)
    db.commit()
    return {"message": f"Company user with id: {user_id}, deleted successfully"}

# Endpoint to Edit User

@router.patch("/users/{user_id}", response_model=UserOut, dependencies=[Depends(get_current_company_user), Depends(check_permission("update_user"))])
async def update_user(
    user_id: str,
    db: Session = Depends(get_db),
    user: UpdateUser = Body(...),
    current_user = Depends(get_current_company_user)
):
    """
    Update a company user.
    Only company admins can do this, and only for company users in their company.
    """
    get_company_user = db.query(CompanyUser).filter(CompanyUser.id == str(user_id)).first()
    if not get_company_user:
        raise HTTPException(status_code=404, detail="Company user not found")
    
    # Ensure company user belongs to the same company
    if get_company_user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only update company users in your company")

    # Update normal fields
    updated_data = user.model_dump(exclude_unset=True)
    for key, value in updated_data.items():
        if key != "role":
            setattr(get_company_user, key, value)

    # Update role if provided - must be from the same company
    if user.role:
        role_obj = db.query(Role).filter(
            Role.name == user.role,
            Role.company_id == current_user.company_id
        ).first()
        if not role_obj:
            raise HTTPException(status_code=404, detail="Role not found in your company")
        get_company_user.roles = [role_obj]  # replace old roles with the new one

    db.commit()
    db.refresh(get_company_user)

    # Prepare response with role name
    role_name = get_company_user.roles[0].name if get_company_user.roles else None
    return UserOut(
        id=get_company_user.id,
        full_name=get_company_user.full_name,
        email=get_company_user.email,
        phone_number=get_company_user.phone_number,
        role=role_name
    )
   

# Endpoint to get all company users (company-scoped)
@router.get("/users", response_model=List[UserOut], dependencies=[Depends(get_current_company_user), Depends(check_permission("view_users"))])
async def get_all_users(db: Session = Depends(get_db), current_user = Depends(get_current_company_user)):
    """
    Get all company users in the current user's company.
    Super admins cannot access this - they can only manage companies.
    """
    company_users = db.query(CompanyUser).filter(CompanyUser.company_id == current_user.company_id).all()
    
    result = []
    for cu in company_users:
        # Take the first role name if available
        role_name = cu.roles[0].name if cu.roles else None
        result.append(UserOut(
            id=cu.id,
            full_name=cu.full_name,
            email=cu.email,
            phone_number=cu.phone_number,
            role=role_name
        ))
    
    return result
