from fastapi import APIRouter, Depends, HTTPException, status
from database.models import Role, Permission, User
from methods.functions import get_current_user
from database.dbs import get_db
from sqlalchemy.orm import aliased, joinedload
from methods.permissions import check_permission
from sqlalchemy.orm import Session
from schemas.AuthScheme import RoleCreate, PermissionCreate, RolePermissionAssign, PermissionOut, MyPermissionsOut, RoleOut
from typing import List

router = APIRouter(prefix="/api/v1/roles", tags=['Roles control endpoints'])

# Endpoint to create roles
@router.post("/create_role", dependencies=[Depends(check_permission("create_role"))])
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new role.

    - If the caller is a super admin, the role is global (company_id = None).
    - Otherwise, the role is scoped to the caller's company (company_id = current_user.company_id).
    """
    # Determine scope: global vs company-scoped
    is_super_admin = any(r.name == "super_admin" for r in (current_user.roles or []))
    company_id = None if is_super_admin else current_user.company_id

    # Check if role with same name already exists in the same scope
    query = db.query(Role).filter(Role.name == role_data.name)
    if company_id is None:
        query = query.filter(Role.company_id.is_(None))
    else:
        query = query.filter(Role.company_id == company_id)

    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists"
        )
    
    # Create Role with the resolved scope
    new_role = Role(name=role_data.name, company_id=company_id)

    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    return {"message": "Role created successfully", "role": {"id": new_role.id, "name": new_role.name}}

# Getting all roles

@router.get("/all_roles", response_model=List[RoleOut], dependencies=[Depends(check_permission("list_all_roles"))])
def get_all_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()


# Deleting the role
@router.delete("/delete_role/{role_id}", dependencies=[Depends(check_permission("delete_role"))])
def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Find the role to delete
    role = db.query(Role).filter(Role.id == role_id).first()
    
    # Check if the role exists
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Delete the role
    db.delete(role)
    db.commit()

    return {"message": f"Role '{role.name}' with ID '{role_id}' deleted successfully"}

