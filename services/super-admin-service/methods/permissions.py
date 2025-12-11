from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from methods.functions import get_current_company_user as get_company_user_func, has_permission
from database.dbs import get_db
from database.models import Permission, Role, CompanyUser

def check_permission(permission_name: str):
    """
    Dependency that checks the *effective* permission set of the current company user,
    including role-based permissions plus per-user overrides.
    """
    def wrapper(current_user: CompanyUser = Depends(get_company_user_func), db: Session = Depends(get_db)):
        if not has_permission(current_user, permission_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action",
            )
        return True

    return wrapper

def get_current_company_user(current_user: CompanyUser = Depends(get_company_user_func)):
    """
    Dependency that checks if the current user is a company user (not super admin).
    Super admins are NOT allowed here - they can only manage companies, not company internals.
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not associated with a company."
        )
    return current_user

def get_current_super_admin_user(current_user: CompanyUser = Depends(get_company_user_func)):
    if not any(role.name == "super_admin" for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )
    return current_user
