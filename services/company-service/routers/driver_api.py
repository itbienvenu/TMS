from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import orm
from typing import List

from database.dbs import get_db
from database.models import Driver, Ticket, Bus, Schedule, Route, BusStation
from methods.functions import get_current_driver
import redis
import os

# Redis for Tracking Coordination
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379")
redis_client = redis.StrictRedis.from_url(REDIS_URL, decode_responses=True)

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
    active_schedule_data = None
    
    if driver.bus_id:
        bus = db.query(Bus).filter(Bus.id == driver.bus_id).first()
        if bus:
            bus_info = {
                "id": bus.id,
                "plate_number": bus.plate_number,
                "capacity": bus.capacity,
                "available_seats": bus.available_seats
            }
            
        # Find active schedule (Trip)
        # We look for In_Transit or Boarding first, then Scheduled next.
        # Simple logic: Find ANY schedule for this bus that is NOT Completed/Reconciled.
        # And usually implies "today" or "future".
        
        from database.models import TripStatus
        
        active_schedule = db.query(Schedule).filter(
            Schedule.bus_id == driver.bus_id,
            Schedule.status.in_([TripStatus.Boarding, TripStatus.In_Transit])
        ).first()
        
        if not active_schedule:
             # If no active trip, look for next Scheduled one
             active_schedule = db.query(Schedule).filter(
                Schedule.bus_id == driver.bus_id,
                Schedule.status == TripStatus.Scheduled,
                Schedule.departure_time >= datetime.now(UTC)
             ).order_by(Schedule.departure_time.asc()).first()
             
        if active_schedule:
             # Basic info
             active_schedule_data = {
                 "id": active_schedule.id,
                 "status": active_schedule.status,
                 "departure_time": active_schedule.departure_time,
                 # "route_id": active_schedule.route_segment.route_id # simplified
             }

    return {
        "id": driver.id,
        "full_name": driver.full_name,
        "email": driver.email,
        "company_id": driver.company_id,
        "license_number": driver.license_number,
        "bus": bus_info,
        "active_trip": active_schedule_data
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

# Lifecycle Management Endpoints

from database.models import TripStatus, AuditLog

@router.post("/trip/{schedule_id}/start")
async def start_trip(
    schedule_id: str,
    driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """
    Driver starts the trip. 
    State transition: Scheduled/Boarding -> In_Transit
    """
    # Lock the row for update to prevent race conditions
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).with_for_update().first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    # Verify driver assignment
    if driver.bus_id != schedule.bus_id:
        raise HTTPException(status_code=403, detail="You are not assigned to this bus/schedule")
        
    if schedule.status == TripStatus.In_Transit:
         # Idempotency
         return {"status": "already_started", "trip_status": schedule.status}
         
    if schedule.status not in [TripStatus.Scheduled, TripStatus.Boarding]:
         raise HTTPException(status_code=400, detail=f"Invalid transition from {schedule.status} to In_Transit")
         
    old_status = schedule.status
    schedule.status = TripStatus.In_Transit
    
    # Audit Log
    audit = AuditLog(
        actor_id=driver.id,
        role="driver",
        action="START_TRIP",
        target_id=schedule.id,
        target_type="Schedule",
        details=f"Transition: {old_status} -> In_Transit. Bus: {schedule.bus_id}"
    )
    db.add(audit)
    db.commit()
    
    # Sync with Tracking Service
    try:
        redis_client.set(f"bus_trip:{schedule.bus_id}", schedule.id)
    except Exception as e:
        print(f"Warning: Redis sync failed: {e}")
    
    return {"status": "started", "trip_status": schedule.status}

@router.post("/trip/{schedule_id}/board")
async def start_boarding(
    schedule_id: str,
    driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """
    Driver starts boarding.
    State transition: Scheduled -> Boarding
    """
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).with_for_update().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    if driver.bus_id != schedule.bus_id:
        raise HTTPException(status_code=403, detail="You are not assigned to this bus/schedule")
        
    if schedule.status == TripStatus.Boarding:
         return {"status": "already_boarding", "trip_status": schedule.status}
         
    if schedule.status != TripStatus.Scheduled:
         raise HTTPException(status_code=400, detail=f"Invalid transition from {schedule.status} to Boarding")
         
    schedule.status = TripStatus.Boarding
    
    audit = AuditLog(
        actor_id=driver.id,
        role="driver",
        action="START_BOARDING",
        target_id=schedule.id,
        target_type="Schedule",
        details=f"Values: Scheduled -> Boarding"
    )
    db.add(audit)
    db.commit()
    return {"status": "boarding", "trip_status": schedule.status}

@router.post("/trip/{schedule_id}/end")
async def end_trip(
    schedule_id: str,
    driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """
    Driver ends the trip.
    State transition: In_Transit -> Completed
    """
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).with_for_update().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    if driver.bus_id != schedule.bus_id:
        raise HTTPException(status_code=403, detail="You are not assigned to this bus/schedule")
        
    if schedule.status != TripStatus.In_Transit:
         # Fail-safe: Allow ending checks? No, stick to strict.
         raise HTTPException(status_code=400, detail=f"Invalid transition from {schedule.status} to Completed")
         
    schedule.status = TripStatus.Completed
    
    audit = AuditLog(
        actor_id=driver.id,
        role="driver",
        action="END_TRIP",
        target_id=schedule.id,
        target_type="Schedule",
        details=f"Details: Trip Completed at {datetime.now(UTC)}"
    )
    db.add(audit)
    
    # Sync with Tracking Service
    try:
        redis_client.delete(f"bus_trip:{schedule.bus_id}")
    except Exception as e:
        print(f"Warning: Redis sync failed: {e}")
    
    db.commit()
    return {"status": "ended", "trip_status": schedule.status}
