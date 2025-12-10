from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database.dbs import get_db
from database.models import Role, Permission, CompanyUser
from methods.permissions import get_current_company_user

router = APIRouter(prefix="/api/v1/perm", tags=["Permissions"])

class PermissionResponse(BaseModel):
    id: str
    name: str
    company_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class RolePermissionAssignSchema(BaseModel):
    role_id: str
    permission_id: str

@router.get("/get_permissions", response_model=List[PermissionResponse])
async def get_permissions(
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Get all available permissions for the current user's company.
    """
    permissions = db.query(Permission).filter(
        Permission.company_id == current_user.company_id
    ).all()
    return permissions

@router.post("/assign_permissions")
async def assign_permission(
    assignment: RolePermissionAssignSchema,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Assign a permission to a role.
    Verifies that both the role and permission belong to the user's company.
    """
    # 1. Fetch Role
    role = db.query(Role).filter(
        Role.id == assignment.role_id,
        Role.company_id == current_user.company_id
    ).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
        
    # 2. Fetch Permission
    permission = db.query(Permission).filter(
        Permission.id == assignment.permission_id,
        Permission.company_id == current_user.company_id
    ).first()
    
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found.")
        
    # 3. Check if already assigned
    if permission in role.permissions:
        return {"message": "Permission already assigned to this role", "role": role}

    # 4. Assign
    role.permissions.append(permission)
    db.commit()
    db.refresh(role)
    
    return {"message": "Permission assigned successfully", "role": role}
