from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, UTC
import uuid

from database.dbs import get_db
from database.models import Company, CompanyUser, Role, Permission
from schemas.CompanyScheme import CompanyCreate, CompanyResponse

from methods.permissions import get_current_super_admin_user

# Define router for super admin company management
router = APIRouter(prefix="/api/v1/super-admin/companies", tags=["Companies"])

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

@router.delete("/{company_id}", dependencies=[Depends(get_current_super_admin_user)])
async def delete_company(company_id: str, db: Session = Depends(get_db)):
    """This action is sudo, means super users can only do this"""
    company =  db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()

    return {"message":"Company deleted well"}

@router.get("/me")
async def get_me(current_user: CompanyUser = Depends(get_current_super_admin_user)):
    """Returns the current super admin info."""
    return current_user
