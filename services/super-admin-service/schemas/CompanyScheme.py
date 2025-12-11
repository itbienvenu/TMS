from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class CompanyCreate(CompanyBase):
    admin_email: str
    admin_name: str
    admin_phone: str
    admin_password: str

class CompanyResponse(CompanyBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    full_name: str
    # Real email of the user (used for OTP verification and communication)
    email: str
    # Company-issued login identifier/email the user will use to sign in
    login_email: Optional[str] = None
    phone_number: str
    password: str
    role_name: str
    company_id: Optional[str] = None
    
class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class CompanyRoleCreate(BaseModel):
    name: str
    company_id: Optional[str] = None

class CompanyRoleUpdate(BaseModel):
    name: Optional[str] = None
    company_id: Optional[str] = None

class CompanyRoleResponse(BaseModel):
    id: str
    name: str
    company_id: Optional[str] = None

    class Config:
        from_attributes = True


from typing import List

class RoleResponse(BaseModel):
    name: str
    class Config:
        from_attributes = True

class CompanyUserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: str
    roles: List[RoleResponse] = []
    company_id: Optional[str] = None

    class Config:
        from_attributes = True