from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from typing import List, Optional
from datetime import datetime, date
from database.dbs import get_db
from database.models import Schedule, Bus, RouteSegment, Route, BusStation, Company, Ticket
from schemas.SchedulesScheme import ScheduleCreate, ScheduleResponse, ScheduleUpdate
from methods.functions import get_current_user
from methods.permissions import get_current_company_user

router = APIRouter(prefix="/api/v1/schedules", tags=["Schedules"])

# Swap Bus Endpoint
@router.post("/{schedule_id}/swap-bus")
def swap_bus_for_schedule(
    schedule_id: str,
    new_bus_id: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_company_user)
):
    """
    Seamlessly migrates a schedule and all its passengers to a new bus.
    Validates capacity before migration.
    """
    # 1. Get Schedule
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.company_id == current_user.company_id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # 2. Get New Bus
    new_bus = db.query(Bus).filter(
        Bus.id == new_bus_id,
        Bus.company_id == current_user.company_id
    ).first()
    
    if not new_bus:
        raise HTTPException(status_code=404, detail="New bus not found")

    # 3. Check Capacity
    # We count all tickets that are NOT cancelled
    sold_tickets_count = db.query(Ticket).filter(
        Ticket.schedule_id == schedule_id,
        Ticket.status != "cancelled"
    ).count()

    if new_bus.capacity < sold_tickets_count:
        raise HTTPException(
            status_code=400, 
            detail=f"Migration Failed: New bus capacity ({new_bus.capacity}) is less than sold tickets ({sold_tickets_count})."
        )

    # 4. Perform Swap
    old_bus_id = schedule.bus_id
    schedule.bus_id = new_bus_id
    
    # 5. Migrate Tickets
    # Update all non-cancelled tickets to point to the new bus
    db.query(Ticket).filter(
        Ticket.schedule_id == schedule_id
    ).update({Ticket.bus_id: new_bus_id}, synchronize_session=False)

    db.commit()
    db.refresh(schedule)

    # 6. Publish Event for Notifications
    try:
        import pika
        import json
        import os
        
        rabbitmq_url = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
        params = pika.URLParameters(rabbitmq_url)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        
        channel.exchange_declare(exchange='ticketing_events', exchange_type='topic')
        
        message = {
            "event": "bus_swap",
            "schedule_id": schedule.id,
            "old_bus": old_bus_id,
            "new_bus": new_bus_id,
            "affected_passengers": sold_tickets_count
        }
        
        channel.basic_publish(
            exchange='ticketing_events',
            routing_key='bus.swapped',
            body=json.dumps(message)
        )
        connection.close()
    except Exception as e:
        print(f"Failed to publish swap event: {e}")

    return {
        "message": "Bus swapped successfully. Passengers migrated.", 
        "schedule_id": schedule.id, 
        "old_bus": old_bus_id, 
        "new_bus_plate": new_bus.plate_number,
        "tickets_migrated": sold_tickets_count
    }

#  Create a new schedule
@router.post("/", response_model=ScheduleResponse)
def create_schedule(
    schedule: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    #  Check if the bus exists and belongs to the same company
    bus = db.query(Bus).filter(
        Bus.id == schedule.bus_id,
        Bus.company_id == current_user.company_id
    ).first()

    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    #  Check if the RouteSegment exists and belongs to the same company (IF provided)
    if schedule.route_segment_id:
        segment = db.query(RouteSegment).filter(
            RouteSegment.id == schedule.route_segment_id,
            RouteSegment.company_id == current_user.company_id
        ).first()

        if not segment:
            raise HTTPException(status_code=404, detail="RouteSegment not found")

    #  Create new schedule
    new_schedule = Schedule(
        bus_id=schedule.bus_id,
        route_segment_id=schedule.route_segment_id,
        departure_time=schedule.departure_time,
        arrival_time=schedule.arrival_time,
        company_id=current_user.company_id
    )

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule


#  List all schedules (for company users - company-scoped)
@router.get("/", response_model=List[ScheduleResponse])
def list_schedules(
    route_id: Optional[str] = None,
    route_segment_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """List schedules for company users - filtered by company"""
    query = db.query(Schedule).filter(Schedule.company_id == current_user.company_id)
    
    if route_segment_id:
        query = query.filter(Schedule.route_segment_id == route_segment_id)
    elif route_id:
        # Get all segments for this route
        segments = db.query(RouteSegment.id).filter(RouteSegment.route_id == route_id).all()
        segment_ids = [s[0] for s in segments]
        query = query.filter(Schedule.route_segment_id.in_(segment_ids))
    
    return query.all()


# Public endpoint - search schedules by route, date, origin/destination
@router.get("/search", response_model=List[dict])
def search_schedules(
    route_id: Optional[str] = Query(None, description="Filter by route ID"),
    origin_id: Optional[str] = Query(None, description="Filter by origin station ID"),
    destination_id: Optional[str] = Query(None, description="Filter by destination station ID"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Public endpoint to search schedules.
    Returns schedules with bus info, route info, and seat availability.
    """
    query = db.query(Schedule).options(
        joinedload(Schedule.bus),
        joinedload(Schedule.route_segment).joinedload(RouteSegment.route),
        joinedload(Schedule.route_segment).joinedload(RouteSegment.start_station),
        joinedload(Schedule.route_segment).joinedload(RouteSegment.end_station)
    )
    
    # Filter by route if provided
    if route_id:
        segments = db.query(RouteSegment.id).filter(RouteSegment.route_id == route_id).all()
        segment_ids = [s[0] for s in segments]
        query = query.filter(Schedule.route_segment_id.in_(segment_ids))
    
    # Filter by origin/destination stations
    if origin_id or destination_id:
        segment_query = db.query(RouteSegment.id)
        if origin_id:
            segment_query = segment_query.filter(RouteSegment.start_station_id == origin_id)
        if destination_id:
            segment_query = segment_query.filter(RouteSegment.end_station_id == destination_id)
        segment_ids = [s[0] for s in segment_query.all()]
        query = query.filter(Schedule.route_segment_id.in_(segment_ids))
    
    # Filter by date if provided
    if date:
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(
                func.date(Schedule.departure_time) == filter_date
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            
    # Filter out past schedules
    query = query.filter(Schedule.departure_time > datetime.now())
    
    schedules = query.all()
    
    # Format response with full details
    result = []
    for schedule in schedules:
        bus = schedule.bus
        segment = schedule.route_segment
        route = segment.route if segment else None
        
        result.append({
            "id": schedule.id,
            "bus_id": schedule.bus_id,
            "bus_plate_number": bus.plate_number if bus else None,
            "bus_capacity": bus.capacity if bus else None,
            "available_seats": bus.available_seats if bus else 0, # Directly return remaining seats
            "route_id": route.id if route else None,
            "route_segment_id": schedule.route_segment_id,
            "origin": segment.start_station.name if segment and segment.start_station else None,
            "destination": segment.end_station.name if segment and segment.end_station else None,
            "price": segment.price if segment else None,
            "departure_time": schedule.departure_time.isoformat() if schedule.departure_time else None,
            "arrival_time": schedule.arrival_time.isoformat() if schedule.arrival_time else None,
            "company_id": schedule.company_id,
            "company_name": db.query(Company).filter(Company.id == schedule.company_id).first().name if schedule.company_id else None,
            "status": schedule.status.value if hasattr(schedule.status, "value") else schedule.status
        })
    
    return result


#  Get single schedule
@router.get("/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.company_id == current_user.company_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


#  Update schedule
@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: str,
    schedule_update: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.company_id == current_user.company_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    schedule.departure_time = schedule_update.departure_time
    schedule.arrival_time = schedule_update.arrival_time
    db.commit()
    db.refresh(schedule)
    return schedule


#  Delete schedule
@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.company_id == current_user.company_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted successfully"}
