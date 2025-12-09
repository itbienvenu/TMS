from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from database.dbs import get_db
from database.models import Schedule, RouteSegment, BusStation, Bus, Company
from schemas.SearchScheme import SearchResult
from schemas.StationsScheme import BusStationResponse

router = APIRouter(prefix="/api/v1/search", tags=["Search"])

@router.get("/stations", response_model=List[BusStationResponse])
def get_all_stations(db: Session = Depends(get_db)):
    """
    List all available bus stations for the dropdowns.
    """
    stations = db.query(BusStation).all()
    return stations

@router.get("/trips", response_model=List[SearchResult])
def search_trips(
    origin_id: str,
    destination_id: str,
    travel_date: Optional[str] = None, # YYYY-MM-DD
    db: Session = Depends(get_db)
):
    """
    Search for trips based on origin, destination, and optional date.
    """
    
    # 1. Find RouteSegments that match origin -> destination
    # Note: This assumes a direct segment. For multi-hop, logic would be more complex.
    segments_query = db.query(RouteSegment).filter(
        RouteSegment.start_station_id == origin_id,
        RouteSegment.end_station_id == destination_id
    )
    
    matching_segments = segments_query.all()
    segment_ids = [seg.id for seg in matching_segments]
    
    if not segment_ids:
        return []

    # 2. Find Schedules for these segments
    schedules_query = db.query(Schedule).options(
        joinedload(Schedule.route_segment).joinedload(RouteSegment.start_station),
        joinedload(Schedule.route_segment).joinedload(RouteSegment.end_station),
        joinedload(Schedule.bus),
        joinedload(Schedule.company)
    ).filter(
        Schedule.route_segment_id.in_(segment_ids)
    )

    # 3. Filter by date if provided
    if travel_date:
        try:
            date_obj = datetime.strptime(travel_date, "%Y-%m-%d").date()
            # Filter where departure_time is on this date
            # We can cast to date, or check range
            schedules_query = schedules_query.filter(
                Schedule.departure_time >= datetime.combine(date_obj, datetime.min.time()),
                Schedule.departure_time <= datetime.combine(date_obj, datetime.max.time())
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    schedules = schedules_query.all()
    
    results = []
    for sched in schedules:
        # Calculate available seats (simple logic: bus capacity - booked tickets)
        # For now, we use the bus.available_seats field which should be updated on booking
        
        results.append(SearchResult(
            schedule_id=sched.id,
            company_name=sched.company.name if sched.company else "Unknown",
            origin_station=sched.route_segment.start_station.name,
            destination_station=sched.route_segment.end_station.name,
            departure_time=sched.departure_time,
            arrival_time=sched.arrival_time if sched.arrival_time else sched.departure_time, # Fallback
            price=sched.route_segment.price,
            available_seats=sched.bus.available_seats,
            bus_plate=sched.bus.plate_number,
            route_id=sched.route_segment.route_id
        ))
        
    return results
