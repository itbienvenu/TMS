from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, UTC
import uuid

from  database.dbs import get_db
from database.models import Company, CompanyUser, Role, Permission
from schemas.CompanyScheme import CompanyCreate, CompanyResponse , CompanyUserResponse, UserCreate, PasswordChange, CompanyRoleCreate, CompanyRoleResponse
# from app.dependencies.dependencies import get_current_super_admin_user
# from app.utils.auth_utils import get_password_hash
from methods.functions import get_current_user
from methods.permissions import get_current_super_admin_user, get_current_company_user
from passlib.hash import bcrypt


# Define a new router for company management
router = APIRouter(prefix="/api/v1/companies", tags=["Companies"])



@router.post(
    "/create_company",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_super_admin_user)]
)
async def create_new_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db)
):
    """
    Creates a new company.
    - Creates the company record.
    - Copies all global permissions to this company's scope.
    - Creates a default 'admin' role for this company.
    - Assigns all copied permissions to the 'admin' role.
    """
    # Check if company name or email already exists
    if db.query(Company).filter(Company.name == company_data.name).first():
        raise HTTPException(status_code=400, detail="Company name already registered.")
    if db.query(Company).filter(Company.email == company_data.email).first():
        raise HTTPException(status_code=400, detail="Company email already registered.")

    try:
        # Create the new company
        new_company = Company(
            id=str(uuid.uuid4()),
            name=company_data.name,
            email=company_data.email,
            phone_number=company_data.phone_number,
            address=company_data.address,
            created_at=datetime.now(UTC)
        )
        db.add(new_company)
        # Flush to get ID, but don't commit transaction yet until permissions/roles are done
        db.flush() 
        db.refresh(new_company)
        
        # 1. Fetch Global Permissions (Templates)
        global_perms = db.query(Permission).filter(Permission.company_id == None).all()
        
        # 2. Create Default 'Admin' Role for this company
        admin_role = Role(
            id=str(uuid.uuid4()),
            name="admin", 
            company_id=new_company.id
        )
        db.add(admin_role)

        # 3. Replicate permissions for this company and assign to Admin role
        company_permissions = []
        for gp in global_perms:
            cp = Permission(
                id=str(uuid.uuid4()),
                name=gp.name,
                company_id=new_company.id
            )
            company_permissions.append(cp)
        
        db.add_all(company_permissions)
        
        # Link permissions to role
        admin_role.permissions = company_permissions 
        
        # Commit everything
        db.commit()
        db.refresh(new_company)
        
        return new_company

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@router.get(
    "/",
    response_model=List[CompanyResponse],
    dependencies=[Depends(get_current_super_admin_user)]
)
async def get_all_companies(db: Session = Depends(get_db)):
    """
    Returns a list of all companies. Accessible only by a super admin.
    """
    companies = db.query(Company).all()
    return companies


# get company members - MOVED UP to avoid conflict with /{company_id}
@router.get("/users", response_model=List[CompanyUserResponse], dependencies=[Depends(get_current_company_user)])
async def get_company_users(
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Returns a list of company users belonging to the current user's company.
    Only company admins can access this.
    Super admins cannot access company users - they can only manage companies.
    """
    company_users = db.query(CompanyUser).filter(CompanyUser.company_id == current_user.company_id).all()
    return company_users


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
    dependencies=[Depends(get_current_super_admin_user)]
)
async def get_company_by_id(company_id: str, db: Session = Depends(get_db)):
    """
    Returns a single company by its ID. Accessible only by a super admin.
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

# Endpoint to delete any company

@router.delete("/{company_id}", dependencies=[Depends(get_current_super_admin_user)])
async def delete_company(company_id: str, db: Session = Depends(get_db)):

    """This action is sudo, means super users can only do this"""

    company =  db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()

    return {"message":"Company deleted well"}


@router.post('/company-user', dependencies=[Depends(get_current_company_user)])
async def create_company_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):  
    """
    Create a new user for the current user's company.
    Only company admins can create users in their company.
    Super admins cannot create company users - they can only manage companies.
    """
    # Check if the company user's email already exists
    if db.query(CompanyUser).filter(CompanyUser.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already in use.")
    
    # Check if login_email already exists
    if user_data.login_email and db.query(CompanyUser).filter(CompanyUser.login_email == user_data.login_email).first():
        raise HTTPException(status_code=400, detail="Login email already in use.")

    # Ensure user is being created in the same company as the current user
    if user_data.company_id and user_data.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only create users in your company.")

    try:
        # Create the new company user - always use current_user's company_id
        hashed_password = bcrypt.hash(user_data.password)
        new_company_user = CompanyUser(
            id=str(uuid.uuid4()),
            full_name=user_data.full_name,
            email=user_data.email,
            login_email=user_data.login_email or user_data.email,
            phone_number=user_data.phone_number,
            password_hash=hashed_password,
            created_at=datetime.now(UTC),
            company_id=current_user.company_id  # Always use current user's company
        )

        # Assign the specified role to the new company user - must be from the same company
        role = db.query(Role).filter(
            Role.name == user_data.role_name,
            Role.company_id == current_user.company_id
        ).first()
        if not role:
            raise HTTPException(
                status_code=400,
                detail=f"Role '{user_data.role_name}' not found in your company."
            )
        new_company_user.roles.append(role)
        db.add(new_company_user)
        db.commit()
        
        return {"message": "Company user created successfully."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
    
# Endpoints for Company Roles Management

# @router.post(
#     "/company-roles",
#     response_model=CompanyRoleResponse,
#     status_code=status.HTTP_201_CREATED,
#     dependencies=[Depends(get_current_company_user)]
# )
# async def create_company_role(
#     company_role_data: CompanyRoleCreate,
#     db: Session = Depends(get_db)
# ):
#     """
#     Creates a new role specific to a company.
#     This endpoint is for the main system admin.
#     """
#     # Check if the role name already exists within the company
#     existing_role = db.query(CompanyRole).filter(
#         CompanyRole.name == company_role_data.name,
#         CompanyRole.company_id == company_role_data.company_id
#     ).first()
#     if existing_role:
#         raise HTTPException(status_code=400, detail="Role name already exists for this company.")

#     try:
#         # Create the new company role
#         new_company_role = CompanyRole(
#             id=str(uuid.uuid4()),
#             name=company_role_data.name,
#             company_id=company_role_data.company_id
#         )
#         db.add(new_company_role)
#         db.commit()
#         db.refresh(new_company_role)
        
#         return new_company_role

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"An error occurred: {e}")