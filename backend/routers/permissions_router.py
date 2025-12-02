from fastapi import APIRouter, Depends, HTTPException, status
from database.models import Role, Permission, User
from methods.functions import get_current_user
from database.dbs import get_db
from sqlalchemy.orm import aliased, joinedload
from methods.permissions import check_permission
from sqlalchemy.orm import Session
from schemas.AuthScheme import RoleCreate, PermissionCreate, RolePermissionAssign, PermissionOut, MyPermissionsOut, RoleOut
from typing import List

router = APIRouter(prefix="/api/v1/perm", tags=['Permission control endpoints'])

@router.get("/validate-token")
async def validate_token(current_user = Depends(get_current_user)):
    return {"status": "valid", "user_id": current_user.id}


@router.post("/create_permission", dependencies=[Depends(check_permission("create_permission"))])
def create_permission(permission_data: PermissionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if permission with the same name exists
    """Admins are only to  access this role"""

    existing = db.query(Permission).filter(Permission.name == permission_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission with this name already exists"
        )
    
    # Create Permission
    new_permission = Permission(name=permission_data.name)
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)

    return {"message": "Permission created successfully", "permission": {"id": new_permission.id, "name": new_permission.name}}




@router.get("/get_permissions", response_model=List[PermissionOut], dependencies=[Depends(check_permission("get_permission"))])
def get_permissions(db: Session = Depends(get_db), user = Depends(get_current_user)):
    """Any one can access this enpoint to see his permission, but mostly for admins class"""
    return db.query(Permission).all()

# Role managment
@router.get("/my_permissions", response_model=MyPermissionsOut)
def my_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return the *effective* permission list for the current user:
    - All permissions from their roles
    - Plus any per-user extra permissions
    - Minus any explicitly revoked permissions
    """
    role_perms = {
        perm.id: perm for role in (current_user.roles or []) for perm in (role.permissions or [])
    }
    extra_perms = {perm.id: perm for perm in (current_user.extra_permissions or [])}
    revoked_ids = {perm.id for perm in (current_user.revoked_permissions or [])}

    # Start from union of role+extra, then remove revoked
    combined = {**role_perms, **extra_perms}
    effective = [p for pid, p in combined.items() if pid not in revoked_ids]

    return {
        "permissions": [{"id": p.id, "name": p.name} for p in effective]
    }


@router.post(
    "/grant_user_permission",
    dependencies=[Depends(check_permission("manage_user_permissions"))],
)
def grant_user_permission(
    user_id: str,
    permission_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Grant an *extra* permission directly to a user (beyond what their roles provide).
    Typically used by a company admin or super admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    if permission in user.extra_permissions:
        return {"message": "Permission already granted to user"}

    # If this permission was explicitly revoked before, remove it from revoked set
    if permission in user.revoked_permissions:
        user.revoked_permissions.remove(permission)

    user.extra_permissions.append(permission)
    db.commit()
    db.refresh(user)

    return {"message": "Permission granted to user"}


@router.post(
    "/revoke_user_permission",
    dependencies=[Depends(check_permission("manage_user_permissions"))],
)
def revoke_user_permission(
    user_id: str,
    permission_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Explicitly revoke a permission from a user.
    This overrides any grants coming from roles or extra permissions.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    # Remove from extra_permissions if present
    if permission in user.extra_permissions:
        user.extra_permissions.remove(permission)

    if permission not in user.revoked_permissions:
        user.revoked_permissions.append(permission)

    db.commit()
    db.refresh(user)

    return {"message": "Permission revoked from user"}



# Assigning the 
@router.post("/assign_permissions", dependencies=[Depends(check_permission("assign_permission"))])
def assign_permissions_to_role(
    data: RolePermissionAssign,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Eagerly load the permissions relationship to ensure they are in the session
    role = db.query(Role).filter(Role.id == data.role_id).options(joinedload(Role.permissions)).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Fetch the single permission to assign
    permission_to_add = db.query(Permission).filter(Permission.id == data.permission_id).first()
    if not permission_to_add:
        raise HTTPException(status_code=404, detail="Permission not found with the provided ID")

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
@router.delete("/delete_permission/{permission_id}", dependencies=[Depends(check_permission("delete_permission"))])
def delete_role(
    permission_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Find the role to delete
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    
    # Check if the role exists
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    # Delete the Permissionrole
    db.delete(permission)
    db.commit()

    return {"message": f"Role '{permission.name}' with ID '{permission_id}' deleted successfully"}

