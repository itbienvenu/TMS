from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid

from database.dbs import get_db
from database.models import Role, Permission, CompanyUser
from methods.permissions import get_current_company_user
from schemas.CompanyScheme import CompanyRoleResponse, CompanyRoleCreate

router = APIRouter(prefix="/api/v1/roles", tags=["Roles"])

class PermissionResponse(BaseModel):
    id: str
    name: str
    company_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class RoleWithPermissionsResponse(CompanyRoleResponse):
    permissions: List[PermissionResponse] = []
    
    class Config:
        from_attributes = True

class RoleCreatedWrapper(BaseModel):
    message: str
    role: RoleWithPermissionsResponse

@router.post("/create_role", response_model=RoleCreatedWrapper, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: CompanyRoleCreate,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Create a new role for the current user's company.
    """
    # Check if role with same name exists in company
    existing_role = db.query(Role).filter(
        Role.name == role_data.name,
        Role.company_id == current_user.company_id
    ).first()
    
    if existing_role:
        raise HTTPException(status_code=400, detail="Role with this name already exists in your company.")

    new_role = Role(
        id=str(uuid.uuid4()),
        name=role_data.name,
        company_id=current_user.company_id
    )
    
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return {"message": "Role created successfully", "role": new_role}

@router.get("/all_roles", response_model=List[RoleWithPermissionsResponse])
async def get_all_roles(
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Get all roles for the current user's company.
    """
    roles = db.query(Role).filter(Role.company_id == current_user.company_id).all()
    return roles

@router.delete("/delete_role/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Delete a role by ID.
    Only allows deleting roles belonging to the current user's company.
    """
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.company_id == current_user.company_id
    ).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    db.delete(role)
    db.commit()
    return None
