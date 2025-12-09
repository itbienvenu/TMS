from fastapi import APIRouter, Depends, HTTPException, status
from database.models import Role, Permission, CompanyUser
from methods.functions import get_current_company_user
from database.dbs import get_db
from sqlalchemy.orm import aliased, joinedload
from methods.permissions import check_permission, get_current_company_user
from sqlalchemy.orm import Session
from schemas.AuthScheme import RoleCreate, PermissionCreate, RolePermissionAssign, PermissionOut, MyPermissionsOut, RoleOut
from typing import List

router = APIRouter(prefix="/api/v1/perm", tags=['Permission control endpoints'])

@router.get("/validate-token")
async def validate_token(current_user = Depends(get_current_company_user)):
    return {"status": "valid", "user_id": current_user.id}


@router.post("/create_permission", dependencies=[Depends(get_current_company_user), Depends(check_permission("create_permission"))])
async def create_permission(permission_data: PermissionCreate, db: Session = Depends(get_db), current_user: CompanyUser = Depends(get_current_company_user)):
    """
    Create a new permission scoped to the current user's company.
    Super admins cannot create permissions - they can only manage companies.
    """
    # Check if permission with the same name exists in this company
    existing = db.query(Permission).filter(
        Permission.name == permission_data.name,
        Permission.company_id == current_user.company_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission with this name already exists in your company"
        )
    
    # Create Permission scoped to the company
    new_permission = Permission(name=permission_data.name, company_id=current_user.company_id)
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)

    return {"message": "Permission created successfully", "permission": {"id": new_permission.id, "name": new_permission.name}}




@router.get("/get_permissions", response_model=List[PermissionOut], dependencies=[Depends(get_current_company_user), Depends(check_permission("get_permission"))])
async def get_permissions(db: Session = Depends(get_db), user: CompanyUser = Depends(get_current_company_user)):
    """
    Get all permissions for the current user's company.
    Super admins cannot access this - they can only manage companies.
    """
    return db.query(Permission).filter(Permission.company_id == user.company_id).all()

# Role managment
@router.get("/my_permissions", response_model=MyPermissionsOut)
async def my_permissions(
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Return the *effective* permission list for the current user:
    - All permissions from their roles (company-scoped or global for super_admin)
    - Plus any per-user extra permissions
    - Minus any explicitly revoked permissions
    """
    is_super_admin = any(r.name == "super_admin" for r in (current_user.roles or []))
    
    role_perms = {}
    for role in (current_user.roles or []):
        for perm in (role.permissions or []):
            if perm.company_id == current_user.company_id or (perm.company_id is None and is_super_admin):
                role_perms[perm.id] = perm
    
    extra_perms = {}
    for perm in (current_user.extra_permissions or []):
        if perm.company_id == current_user.company_id or (perm.company_id is None and is_super_admin):
            extra_perms[perm.id] = perm
    
    revoked_ids = set()
    for perm in (current_user.revoked_permissions or []):
        if perm.company_id == current_user.company_id or (perm.company_id is None and is_super_admin):
            revoked_ids.add(perm.id)

    # Start from union of role+extra, then remove revoked
    combined = {**role_perms, **extra_perms}
    effective = [p for pid, p in combined.items() if pid not in revoked_ids]

    return {
        "permissions": [{"id": p.id, "name": p.name} for p in effective]
    }


@router.post(
    "/grant_user_permission",
    dependencies=[Depends(get_current_company_user), Depends(check_permission("manage_user_permissions"))],
)
async def grant_user_permission(
    user_id: str,
    permission_id: str,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user),
):
    """
    Grant an *extra* permission directly to a company user (beyond what their roles provide).
    Only company admins can do this, and only for company users in their company.
    Super admins cannot manage company users.
    """
    company_user = db.query(CompanyUser).filter(CompanyUser.id == user_id).first()
    if not company_user:
        raise HTTPException(status_code=404, detail="Company user not found")
    
    # Ensure company user belongs to the same company
    if company_user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only manage company users in your company")

    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    # Ensure permission belongs to the same company
    if permission.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only grant permissions from your company")

    if permission in company_user.extra_permissions:
        return {"message": "Permission already granted to company user"}

    # If this permission was explicitly revoked before, remove it from revoked set
    if permission in company_user.revoked_permissions:
        company_user.revoked_permissions.remove(permission)

    company_user.extra_permissions.append(permission)
    db.commit()
    db.refresh(company_user)

    return {"message": "Permission granted to company user"}


@router.post(
    "/revoke_user_permission",
    dependencies=[Depends(get_current_company_user), Depends(check_permission("manage_user_permissions"))],
)
async def revoke_user_permission(
    user_id: str,
    permission_id: str,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user),
):
    """
    Explicitly revoke a permission from a company user.
    This overrides any grants coming from roles or extra permissions.
    Only company admins can do this, and only for company users in their company.
    """
    company_user = db.query(CompanyUser).filter(CompanyUser.id == user_id).first()
    if not company_user:
        raise HTTPException(status_code=404, detail="Company user not found")
    
    # Ensure company user belongs to the same company
    if company_user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only manage company users in your company")

    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    # Ensure permission belongs to the same company
    if permission.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only revoke permissions from your company")

    # Remove from extra_permissions if present
    if permission in company_user.extra_permissions:
        company_user.extra_permissions.remove(permission)

    if permission not in company_user.revoked_permissions:
        company_user.revoked_permissions.append(permission)

    db.commit()
    db.refresh(company_user)

    return {"message": "Permission revoked from company user"}



# Assigning the 
@router.post("/assign_permissions", dependencies=[Depends(get_current_company_user), Depends(check_permission("assign_permission"))])
async def assign_permissions_to_role(
    data: RolePermissionAssign,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Assign a permission to a role.
    Only company admins can do this, and only for roles/permissions in their company.
    """
    # Eagerly load the permissions relationship to ensure they are in the session
    role = db.query(Role).filter(Role.id == data.role_id).options(joinedload(Role.permissions)).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Ensure role belongs to the same company
    if role.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only manage roles in your company")
    
    # Fetch the single permission to assign
    permission_to_add = db.query(Permission).filter(Permission.id == data.permission_id).first()
    if not permission_to_add:
        raise HTTPException(status_code=404, detail="Permission not found with the provided ID")
    
    # Ensure permission belongs to the same company
    if permission_to_add.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only assign permissions from your company")

    # Check if the permission is already assigned to the role
    existing_permission_ids = {p.id for p in role.permissions}
    if permission_to_add.id in existing_permission_ids:
        return {
            "message": f"Permission with ID '{permission_to_add.id}' is already assigned to role '{role.name}'",
            "role": {
                "id": role.id,
                "name": role.name,
                "permissions": [{"id": p.id, "name": p.name} for p in role.permissions]
            }
        }

    # Add the new permission to the role's collection
    role.permissions.append(permission_to_add)

    # Commit the changes to the database
    db.commit()
    db.refresh(role)

    return {
        "message": f"Permission '{permission_to_add.name}' assigned to role '{role.name}' successfully",
        "role": {
            "id": role.id,
            "name": role.name,
            "permissions": [{"id": p.id, "name": p.name} for p in role.permissions]
        }
    }



# Deleting the Permission
@router.delete("/delete_permission/{permission_id}", dependencies=[Depends(get_current_company_user), Depends(check_permission("delete_permission"))])
async def delete_permission(
    permission_id: str,
    db: Session = Depends(get_db),
    current_user: CompanyUser = Depends(get_current_company_user)
):
    """
    Delete a permission.
    Only company admins can do this, and only for permissions in their company.
    """
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    # Ensure permission belongs to the same company
    if permission.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only delete permissions from your company")

    # Delete the Permission
    db.delete(permission)
    db.commit()

    return {"message": f"Permission '{permission.name}' with ID '{permission_id}' deleted successfully"}

