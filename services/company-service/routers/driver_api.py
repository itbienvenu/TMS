from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import orm
from typing import List

from database.dbs import get_db
from database.models import Driver, Ticket, Bus, Schedule, Route, BusStation
from methods.functions import get_current_driver

router = APIRouter(prefix="/api/v1/driver-api", tags=['Driver App API'])

@router.get("/me")
async def get_driver_me(
    driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """
    Get current driver profile and assigned bus info.
    """
    bus_info = None
    if driver.bus_id:
        bus = db.query(Bus).filter(Bus.id == driver.bus_id).first()
        if bus:
            bus_info = {
                "id": bus.id,
                "plate_number": bus.plate_number,
                "capacity": bus.capacity,
                "available_seats": bus.available_seats
            }

    return {
        "id": driver.id,
        "full_name": driver.full_name,
        "email": driver.email,
        "company_id": driver.company_id,
        "license_number": driver.license_number,
        "bus": bus_info
    }

@router.get("/passengers")
async def get_my_passengers(
    driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """
    Get passengers for the driver's current bus.
    For MVP, returns all active tickets for the assigned bus.
    """
    if not driver.bus_id:
        return []
    
    # Eager load user and route info
    tickets = db.query(Ticket).options(
        orm.joinedload(Ticket.user),
        orm.joinedload(Ticket.route), 
        # Note: In shared DB model, Route has origin_id/dest_id but simple relationship might not auto-resolve station names unless we join BusStation
    ).filter(
        Ticket.bus_id == driver.bus_id,
        Ticket.mode == "active"
    ).all()
    
    # Helper to get station name manually if needed (or rely on frontend to know stations)
    # We'll return basic info
    
    results = []
    for t in tickets:
        p_name = "Unknown"
        if t.user:
            p_name = t.user.full_name
        
        # Determine Route Name
        route_name = "Unknown Route"
        if t.route:
            # We assume route objects in DB are loaded. 
            # To get names we'd need to query stations or if relationship is set up deeper
            # Let's just return IDs or basic info
            route_name = "Assigned Route" 

        results.append({
            "ticket_id": t.id,
            "passenger_name": p_name,
            "status": t.status,
            "route_info": route_name,
            "created_at": t.created_at
        })

    return results
