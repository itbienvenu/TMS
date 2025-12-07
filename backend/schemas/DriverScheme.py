from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class DriverCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    license_number: str
    bus_id: Optional[str] = None
    password: str

class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    license_number: Optional[str] = None
    bus_id: Optional[str] = None

class DriverResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: Optional[str]
    license_number: Optional[str]
    bus_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
