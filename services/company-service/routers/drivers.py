from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, UTC
import uuid

from database.dbs import get_db
from database.models import Driver, User, Bus
from schemas.DriverScheme import DriverCreate, DriverResponse, DriverUpdate, DriverLogin
from methods.functions import get_current_user, get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter(prefix="/api/v1/drivers", tags=['Drivers Management'])

@router.post("/login")
async def login_driver(payload: DriverLogin, db: Session = Depends(get_db)):
    """
    Driver login to mobile app.
    Returns access token.
    """
    driver = db.query(Driver).filter(Driver.email == payload.email).first()
    if not driver:
        # Avoid user enumeration by generic message, though for MVP explicit is fine.
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(payload.password, driver.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Create Token
    token = create_access_token(
        data={
            "sub": str(driver.id),
            "company_id": str(driver.company_id),
            "user_type": "driver",
            "bus_id": str(driver.bus_id) if driver.bus_id else None
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_type": "driver",
        "driver_name": driver.full_name,
        "bus_id": driver.bus_id
    }

@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    driver_in: DriverCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Create a new bus driver. Only Company Users can do this.
    """
    if not user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized. Company account required.")

    # Check if email exists in Driver or User table?
    # Ideally email should be unique across system if we plan to merge auth later.
    # For now, separate table unique constraint handles it.
    if db.query(Driver).filter(Driver.email == driver_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered for a driver")

    # Validate Bus ownership if bus_id provided
    if driver_in.bus_id:
        bus = db.query(Bus).filter(Bus.id == driver_in.bus_id, Bus.company_id == user.company_id).first()
        if not bus:
            raise HTTPException(status_code=404, detail="Bus not found or does not belong to your company")

    new_driver = Driver(
        id=str(uuid.uuid4()),
        full_name=driver_in.full_name,
        email=driver_in.email,
        phone_number=driver_in.phone_number,
        password_hash=get_password_hash(driver_in.password),
        license_number=driver_in.license_number,
        company_id=user.company_id,
        bus_id=driver_in.bus_id,
        created_at=datetime.now(UTC)
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver

@router.get("/", response_model=List[DriverResponse])
async def list_drivers(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    List all drivers for the current user's company.
    """
    if not user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    drivers = db.query(Driver).filter(Driver.company_id == user.company_id).all()
    return drivers

@router.patch("/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: str,
    driver_in: DriverUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == user.company_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if driver_in.full_name is not None:
        driver.full_name = driver_in.full_name
    if driver_in.phone_number is not None:
        driver.phone_number = driver_in.phone_number
    if driver_in.license_number is not None:
        driver.license_number = driver_in.license_number
    
    if driver_in.bus_id is not None:
        # If bus_id is "null" string or empty, unassign? Logic usually sends null from JSON which is None here.
        # But if client sends null, Pydantic field is None. But Optional means 'present or not'.
        # We need to distinguish between 'not updating' and 'setting to null'.
        # For simplicity, if passed as None, we ignore. 
        # CAUTION: This simple logic prevents unassigning bus if we just set bus_id: None in payload.
        # Let's assume sending an empty string "" unassigns.
        if driver_in.bus_id == "":
            driver.bus_id = None
        else:
             # Validate Bus
            bus = db.query(Bus).filter(Bus.id == driver_in.bus_id, Bus.company_id == user.company_id).first()
            if not bus:
                raise HTTPException(status_code=404, detail="Bus not found")
            driver.bus_id = driver_in.bus_id

    db.commit()
    db.refresh(driver)
    return driver

@router.delete("/{driver_id}")
async def delete_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == user.company_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    db.delete(driver)
    db.commit()
    return {"message": "Driver deleted successfully"}
