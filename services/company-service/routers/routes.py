from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.orm import aliased
from uuid import UUID
from datetime import datetime, UTC
from typing import List

from common.database import get_db_engine, get_db_session
from database.models import Route, Bus, BusStation, Company, bus_routes, Ticket, RouteSegment
from schemas.RoutesScheme import RegisterRoute, RouteOut, UpdateRoute, AssignBusRequest
from methods.functions import get_current_user
from methods.permissions import check_permission

# Depends
def get_db():
    engine = get_db_engine("company")
    db = next(get_db_session(engine))
    try:
        yield db
    finally:
        db.close()
        
router = APIRouter(prefix="/api/v1/routes", tags=['Routes End Points'])

# ... (Logic copied from routes_router.py) ...

@router.post("/register", dependencies=[Depends(check_permission("create_route"))], response_model=RouteOut)
async def register_routes(route: RegisterRoute, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    company_id = user.company_id
    if not company_id:
        raise HTTPException(status_code=403, detail="User is not associated with a company")

    origin_station = db.query(BusStation).filter(BusStation.id == str(route.origin_id)).first()
    destination_station = db.query(BusStation).filter(BusStation.id == str(route.destination_id)).first()

    if not origin_station or not destination_station:
        raise HTTPException(status_code=400, detail="Invalid origin or destination station ID")

    existing_route = db.query(Route).filter(
        Route.origin_id == str(route.origin_id),
        Route.destination_id == str(route.destination_id),
        Route.company_id == str(company_id)
    ).first()

    if existing_route:
        raise HTTPException(status_code=400, detail="This route already exists for your company")

    new_route = Route(
        origin_id=str(route.origin_id),
        destination_id=str(route.destination_id),
        price=route.price,
        company_id=str(company_id)
    )
    db.add(new_route)
    db.commit()
    
    # Auto-create default full-length segment
    default_segment = RouteSegment(
        route_id=new_route.id,
        start_station_id=str(route.origin_id),
        end_station_id=str(route.destination_id),
        price=route.price,
        stop_order=1,
        company_id=str(company_id)
    )
    db.add(default_segment)
    db.commit()
    db.refresh(new_route)

    return RouteOut(
        id=new_route.id,
        price=new_route.price,
        origin=origin_station.name,
        company_id=new_route.company_id,
        destination=destination_station.name,
        created_at=new_route.created_at
    )

@router.get("/", response_model=List[RouteOut], dependencies=[Depends(get_current_user)])
async def get_all_routes(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    OriginStation = aliased(BusStation)
    DestinationStation = aliased(BusStation)

    routes = (
        db.query(
            Route.id, Route.price, Route.created_at, Route.company_id,
            OriginStation.name.label("origin"),
            DestinationStation.name.label("destination"),
        )
        .join(OriginStation, OriginStation.id == Route.origin_id)
        .join(DestinationStation, DestinationStation.id == Route.destination_id)
        .all()
    )

    return [
        RouteOut(
            id=r.id,
            price=r.price,
            origin=r.origin,
            destination=r.destination,
            company_id = r.company_id,
            created_at=r.created_at or datetime.now(UTC)
        )
        for r in routes
    ]

# ... other endpoints (update, delete, assign-bus) logic is identical, just need to ensure correct DB context
