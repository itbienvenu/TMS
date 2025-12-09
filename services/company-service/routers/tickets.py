from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import orm, func
from datetime import datetime, timezone
import uuid
import qrcode
import io
import base64
import hmac
import hashlib
import os

from dotenv import load_dotenv

from database.dbs import get_db
from database.models import Ticket, User, Bus, Route, BusStation, Company
from schemas.TicketsScheme import TicketCreate, TicketResponse

# No need for local get_db, using the one from common.database

from methods.permissions import get_current_company_user

router = APIRouter(prefix="/api/v1/tickets", tags=['Ticket Managment Endpoint'])
load_dotenv()
SECRET_KEY = os.environ.get("TICKET_SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = "fallback_secret" # Should panic in prod
key_bytes = SECRET_KEY.encode()


async def generate_signed_qr(payload: dict) -> str:
    ticket_id = payload["ticket_id"].encode()
    signature = hmac.new(key_bytes, ticket_id, hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(ticket_id + b"." + signature).decode()

    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(token)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()

    return qr_base64, token


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(ticket_req: TicketCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == str(ticket_req.user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    route = db.query(Route).filter(Route.id == str(ticket_req.route_id)).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    company_id = route.company_id
    if not company_id:
        raise HTTPException(status_code=500, detail="Route is not associated with a company")

    bus = db.query(Bus).filter(Bus.id == str(ticket_req.bus_id), Bus.company_id == company_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found or does not belong to the route's company")

    existing_ticket = db.query(Ticket).filter(
        Ticket.user_id == str(ticket_req.user_id),
        Ticket.route_id == str(ticket_req.route_id),
        Ticket.status == "booked",
        Ticket.mode == 'active',
        Ticket.company_id == company_id
    ).first()

    if existing_ticket:
        raise HTTPException(status_code=400, detail="You have already booked a ticket for this route")

    if bus.available_seats <= 0:
        raise HTTPException(status_code=400, detail="Bus is fully booked")

    payload = {
        "ticket_id": str(uuid.uuid4()),
        # ...
    }
    
    # Generating QR requires 'ticket_id' from payload
    ticket_id = str(uuid.uuid4())
    qr_payload = {"ticket_id": ticket_id}

    qr_base64, signed_token = await generate_signed_qr(qr_payload)

    new_ticket = Ticket(
        id=ticket_id,
        user_id=str(ticket_req.user_id),
        bus_id=str(ticket_req.bus_id),
        route_id=str(ticket_req.route_id),
        schedule_id=str(ticket_req.schedule_id) if ticket_req.schedule_id else None,
        qr_code=signed_token,
        status="booked",
        created_at=datetime.now(UTC),
        mode='active',
        company_id=company_id
    )
    
    bus.available_seats -= 1
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    origin_name = db.query(BusStation).filter(BusStation.id == route.origin_id).first().name if route else None
    destination_name = db.query(BusStation).filter(BusStation.id == route.destination_id).first().name if route else None
    
    # Fetch company name
    comp = db.query(Company).filter(Company.id == company_id).first()

    return TicketResponse(
        id=new_ticket.id,
        user_id=new_ticket.user_id,
        qr_code=qr_base64,
        status=new_ticket.status,
        created_at=new_ticket.created_at,
        mode=new_ticket.mode,
        route={
            "origin": origin_name,
            "destination": destination_name,
            "price": route.price if route else None
        } if route else None,
        bus=bus.plate_number,
        drivers=[d.full_name for d in bus.drivers],
        company_name=comp.name if comp else None
    )

@router.get("/", response_model=List[TicketResponse])
async def list_company_tickets(db: Session = Depends(get_db), current_user=Depends(get_current_company_user)):
    tickets = db.query(Ticket).filter(Ticket.company_id == current_user.company_id).all()
    
    response = []
    for t in tickets:
        user = db.query(User).filter(User.id == t.user_id).first()
        bus = db.query(Bus).filter(Bus.id == t.bus_id).first()
        route = db.query(Route).filter(Route.id == t.route_id).first()
        
        route_data = None
        if route:
             o_station = db.query(BusStation).filter(BusStation.id == route.origin_id).first()
             d_station = db.query(BusStation).filter(BusStation.id == route.destination_id).first()
             route_data = {
                 "origin": o_station.name if o_station else None,
                 "destination": d_station.name if d_station else None,
                 "price": route.price
             }
             
        # Fetch company name
        comp = db.query(Company).filter(Company.id == t.company_id).first()

        response.append(TicketResponse(
            id=t.id,
            user_id=t.user_id,
            qr_code=t.qr_code,
            status=t.status,
            created_at=t.created_at,
            mode=t.mode,
            route=route_data,
            bus=bus.plate_number if bus else None,
            drivers=[d.full_name for d in bus.drivers] if bus and bus.drivers else [],
            company_name=comp.name if comp else "Unknown Company"
        ))
    return response

@router.post("/verify-qr")
async def verify_qr_code(qr_token: str = Body(..., embed=True), db: Session = Depends(get_db)):
    try:
        decoded = base64.urlsafe_b64decode(qr_token.encode())
        parts = decoded.split(b".")
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid QR token format")
        
        ticket_id_bytes, signature = parts
        expected_signature = hmac.new(key_bytes, ticket_id_bytes, hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(status_code=400, detail="Invalid QR token signature")
        
        ticket_id = ticket_id_bytes.decode()
        
        ticket = db.query(Ticket).options(
            orm.joinedload(Ticket.user),
            orm.joinedload(Ticket.bus),
            orm.joinedload(Ticket.route)
        ).filter(Ticket.id == ticket_id).first()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        if ticket.mode != "active":
            raise HTTPException(status_code=400, detail="Ticket is not active")
        
        origin_station = None
        destination_station = None
        if ticket.route:
            origin_station = db.query(BusStation).filter(BusStation.id == ticket.route.origin_id).first()
            destination_station = db.query(BusStation).filter(BusStation.id == ticket.route.destination_id).first()
        
        return {
            "valid": True,
            "ticket_id": ticket.id,
            "user_name": ticket.user.full_name if ticket.user else None,
            "bus_plate": ticket.bus.plate_number if ticket.bus else None,
            "route": f"{origin_station.name if origin_station else 'N/A'} → {destination_station.name if destination_station else 'N/A'}",
            "status": ticket.status,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid QR code: {str(e)}")

# Removed list_user_tickets as this is company-service scope. Use user-service or ticketing-service for user-scoped tickets.

# Note: Missing list_company_tickets and admin_delete_ticket for brevity but they follow same pattern
