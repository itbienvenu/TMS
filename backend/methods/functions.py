from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from database.dbs import Base, engine, get_db
from database.models import User, CompanyUser, Route, Role, Permission, LoginOTP
from schemas.LoginRegisteScheme import RegisterUser, LoginUser, UserOut
from schemas.RoutesScheme import RegisterRoute, UpdateRoute, RouteOut
from jose import jwt, JWTError
import os
import uuid
from dotenv import load_dotenv
from datetime import timedelta, datetime, UTC
import random
import string
import smtplib
from email.message import EmailMessage

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES"))
GMAIL_SMTP_USER = os.environ.get("GMAIL_SMTP_USER")
GMAIL_SMTP_PASSWORD = os.environ.get("GMAIL_SMTP_PASSWORD")
# oauth2_scheme  = OAuth2PasswordBearer(tokenUrl="/api/v1/login")
bearer_scheme = HTTPBearer()


def has_permission(company_user: CompanyUser, permission_name: str) -> bool:
    """
    Compute the effective permissions for a company user, taking into account:
    - Permissions granted via roles (company-scoped or global)
    - Extra per-user permissions (company-scoped or global)
    - Explicitly revoked per-user permissions (which override grants)
    
    Permissions are filtered to only include:
    - Permissions that belong to the user's company (company_id matches)
    - Global permissions (company_id is None) - only for super_admin
    """
    # Check if user is super_admin (can access global permissions)
    is_super_admin = any(r.name == "super_admin" for r in (company_user.roles or []))
    
    # Base permissions from roles - filter by company scope
    role_permissions = set()
    for role in (company_user.roles or []):
        for perm in (role.permissions or []):
            # Include if: permission belongs to user's company, OR it's global and user is super_admin
            if perm.company_id == company_user.company_id or (perm.company_id is None and is_super_admin):
                role_permissions.add(perm.name)

    # Per-user overrides - filter by company scope
    extra_permissions = set()
    for perm in (company_user.extra_permissions or []):
        if perm.company_id == company_user.company_id or (perm.company_id is None and is_super_admin):
            extra_permissions.add(perm.name)
    
    revoked_permissions = set()
    for perm in (company_user.revoked_permissions or []):
        if perm.company_id == company_user.company_id or (perm.company_id is None and is_super_admin):
            revoked_permissions.add(perm.name)

    effective_permissions = (role_permissions | extra_permissions) - revoked_permissions
    return permission_name in effective_permissions



def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=15))   
    to_encode.update({"exp": expire})   
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  
    return encoded_jwt


def generate_otp_code(length: int = 6) -> str:
    """Generate a numeric OTP code."""
    return "".join(random.choices(string.digits, k=length))


def send_email(to_email: str, subject: str, body: str):
    """
    Send an email using Gmail SMTP.

    Requires the following env vars:
    - GMAIL_SMTP_USER: your Gmail address
    - GMAIL_SMTP_PASSWORD: an App Password (not your normal Gmail password)
    """
    if not GMAIL_SMTP_USER or not GMAIL_SMTP_PASSWORD:
        raise RuntimeError("GMAIL_SMTP_USER and GMAIL_SMTP_PASSWORD must be set in environment")

    msg = EmailMessage()
    msg["From"] = GMAIL_SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(GMAIL_SMTP_USER, GMAIL_SMTP_PASSWORD)
        smtp.send_message(msg)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)):
    """
    Get current user - can be either a regular User (customer) or CompanyUser (company staff).
    Token should have 'user_type' field to distinguish.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Could not validate Credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("user_type", "user")  # Default to "user" for backward compatibility
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Check if it's a company user or regular user
    if user_type == "company_user":
        company_user = db.query(CompanyUser).filter(CompanyUser.id == user_id).first()
        if not company_user:
            raise credentials_exception
        return company_user
    else:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise credentials_exception
        return user


def get_current_company_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)):
    """
    Get current company user - only returns CompanyUser, not regular User.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Could not validate Credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("user_type", "user")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    if user_type != "company_user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires company user authentication"
        )
    
    company_user = db.query(CompanyUser).filter(CompanyUser.id == user_id).first()
    if not company_user:
        raise credentials_exception
    return company_user



def create_user(db: Session, user: RegisterUser):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    hashed_password = bcrypt.hash(user.password)
    user_id = uuid.uuid4()
    # Create the user
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        password_hash=hashed_password,
        
    )
    
    # Assign the existing 'user' role
    default_role = db.query(Role).filter(Role.name == "user").first()
    if not default_role:
        raise HTTPException(status_code=500, detail="Default role 'user' not found in database")
    db_user.roles.append(default_role) 

    # Save the user
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.verify(plain_password, hashed_password)

def login_user(db: Session, user: LoginUser):
    """
    Login for regular users (customers) who book tickets via website.
    - If `email` is provided, authenticate by real email.
    - If `phone_number` is provided, authenticate by phone.
    """
    check_user = None

    if user.email:
        check_user = db.query(User).filter(User.email == user.email).first()
    elif user.phone_number:
        check_user = db.query(User).filter(User.phone_number == user.phone_number).first()

    if not check_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(user.password_hash, check_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(
        data={
            "sub": str(check_user.id),
            "user_type": "user"  # Regular user
        }, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer"
    }

def register_route(db: Session, route: RegisterRoute):
    check_route = (db.query(Route)
    .filter(Route.origin == route.origin)
    .filter(Route.destination == route.destination)
    .first()
    )
    if check_route:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Route is alredy registered")
    
    db_route = Route(
        origin = route.origin,
        destination = route.destination,
        price = route.price,
        created_at = datetime.now(UTC)
    )
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route
        
    

def register_route(db: Session, route: RegisterRoute):
    """
    Creates a new route entry in the database.

    Args:
        db (Session): The SQLAlchemy database session.
        route (RegisterRoute): The Pydantic model containing the route data.

    Returns:
        Route: The newly created Route database object.
    """
    # Create a new Route database model instance from the Pydantic model
    new_route = Route(**route.model_dump())
    
    # Add the new route to the database session
    db.add(new_route)
    
    # Commit the transaction to save the route to the database
    db.commit()
    
    # Refresh the new_route object to get its database-generated ID
    db.refresh(new_route)
    
    return new_route