from fastapi import APIRouter, Depends, HTTPException, status
from database.models import Role, Permission, CompanyUser
from methods.functions import get_current_company_user
from database.dbs import get_db
from sqlalchemy.orm import aliased, joinedload
from methods.permissions import check_permission, get_current_company_user
from sqlalchemy.orm import Session
from schemas.AuthScheme import RoleCreate, PermissionCreate, RolePermissionAssign, PermissionOut, MyPermissionsOut, RoleOut
from typing import List

router = APIRouter(prefix="/api/v1/roles", tags=['Roles control endpoints'])

# Endpoint to create roles
@router.post("/create_role", dependencies=[Depends(get_current_company_user), Depends(check_permission("create_role"))])
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user),
):
    """
    Create a new role scoped to the current user's company.
    Super admins cannot create roles - they can only manage companies.
    """
    # Check if role with same name already exists in this company
    existing = db.query(Role).filter(
        Role.name == role_data.name,
        Role.company_id == current_user.company_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists in your company"
        )
    
    # Create Role scoped to the company
    new_role = Role(name=role_data.name, company_id=current_user.company_id)

    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    return {"message": "Role created successfully", "role": {"id": new_role.id, "name": new_role.name}}

# Getting all roles

@router.get("/all_roles", response_model=List[RoleOut], dependencies=[Depends(get_current_company_user), Depends(check_permission("list_all_roles"))])
async def get_all_roles(db: Session = Depends(get_db), current_user: CompanyUser = Depends(get_current_company_user)):
    """
    Get all roles for the current user's company.
    Super admins cannot access this - they can only manage companies.
    """
    return db.query(Role).options(joinedload(Role.permissions)).filter(Role.company_id == current_user.company_id).all()


# Deleting the role
@router.delete("/delete_role/{role_id}", dependencies=[Depends(get_current_company_user), Depends(check_permission("delete_role"))])
async def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Delete a role.
    Only company admins can do this, and only for roles in their company.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Ensure role belongs to the same company
    if role.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only delete roles from your company")

    # Delete the role
    db.delete(role)
    db.commit()

    return {"message": f"Role '{role.name}' with ID '{role_id}' deleted successfully"}

