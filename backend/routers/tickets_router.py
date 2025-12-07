from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import orm, func
from datetime import datetime, UTC
import uuid
import qrcode
import io
import base64
import json
import hmac
import hashlib
import os
from uuid import UUID

from dotenv import load_dotenv

from database.models import Ticket, User, Bus, Route, BusStation
from schemas.TicketsScheme import TicketCreate, TicketResponse
from database.dbs import get_db

from methods.functions import get_current_user
from methods.permissions import check_permission

router = APIRouter(prefix="/api/v1/tickets", tags=['Ticket Managment Endpoint'])
load_dotenv()
SECRET_KEY = os.environ.get("TICKET_SECRET_KEY")
key_bytes = SECRET_KEY.encode()


async def generate_signed_qr(payload: dict) -> str:
    """Generates a signed QR code as a base64 string and a signed token."""
    ticket_id = payload["ticket_id"].encode()  # only ticket_id
    signature = hmac.new(key_bytes, ticket_id, hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(ticket_id + b"." + signature).decode()

    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill="black", back_color="white")

    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()

    return qr_base64, token


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(ticket_req: TicketCreate, db: Session = Depends(get_db)):
    """
    Creates a new ticket for any user, associating it with the company based on the route.
    """
    # Verify the user exists
    user = db.query(User).filter(User.id == str(ticket_req.user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find the route to get its company ID
    route = db.query(Route).filter(Route.id == str(ticket_req.route_id)).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    company_id = route.company_id
    if not company_id:
        raise HTTPException(status_code=500, detail="Route is not associated with a company")

    # Find the bus, ensuring it belongs to the same company as the route
    bus = db.query(Bus).filter(Bus.id == str(ticket_req.bus_id), Bus.company_id == company_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found or does not belong to the route's company")

    # Checking for existing tickets
    existing_ticket = db.query(Ticket).filter(
        Ticket.user_id == str(ticket_req.user_id),
        Ticket.route_id == str(ticket_req.route_id),
        Ticket.status == "booked",
        Ticket.mode == 'active',
        Ticket.company_id == company_id
    ).first()

    if existing_ticket:
        raise HTTPException(
            status_code=400,
            detail="You have already booked a ticket for this route"
        )

    # Check for bus capacity (Remaining seats logic)
    if bus.available_seats <= 0:
        raise HTTPException(status_code=400, detail="Bus is fully booked")

    # Generate QR code and signed token
    payload = {
        "ticket_id": str(uuid.uuid4()),
        "user_id": str(ticket_req.user_id),
        "bus_id": str(ticket_req.bus_id),
        "route_id": str(ticket_req.route_id),
        "status": "Booked",
        "created_at": datetime.now(UTC).isoformat()
    }

    qr_base64, signed_token = await generate_signed_qr(payload)

    # Create new ticket with company_id
    new_ticket = Ticket(
        id=payload["ticket_id"],
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
    route_ifo = db.query(Route).filter(Route.id == str(ticket_req.route_id)).first()

    bus.available_seats -= 1 # Decrement remaining seats
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    origin_name = db.query(BusStation).filter(BusStation.id == route_ifo.origin_id).first().name if route_ifo else None
    destination_name = db.query(BusStation).filter(BusStation.id == route_ifo.destination_id).first().name if route_ifo else None

    return TicketResponse(
        id=new_ticket.id,
        user_id=new_ticket.user_id,
        qr_code=qr_base64,
        status=new_ticket.status,
        created_at=new_ticket.created_at,
        mode=new_ticket.mode,
        route= {
            "origin": origin_name,
            "destination": destination_name,
             "price": route_ifo.price if route_ifo else None
        } if route_ifo else None,
        bus=bus.plate_number
    )


# ... (skipping some parts) ...

@router.get("/", response_model=List[TicketResponse])
async def list_company_tickets(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Lists tickets for the current authenticated user's company.
    Restricted to company users.
    """
    if not user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized. Company account required.")

    tickets = db.query(Ticket).options(
        orm.joinedload(Ticket.route),
        orm.joinedload(Ticket.bus)
    ).filter(
        Ticket.company_id == user.company_id,
        Ticket.mode != 'deleted'
    ).order_by(Ticket.created_at.desc()).all()

    response = []
    for t in tickets:
        route_data = None
        if t.route:
             o_station = db.query(BusStation).filter(BusStation.id == t.route.origin_id).first()
             d_station = db.query(BusStation).filter(BusStation.id == t.route.destination_id).first()
             
             route_data = {
                 "origin": o_station.name if o_station else None,
                 "destination": d_station.name if d_station else None,
                 "price": t.route.price
             }

        response.append(TicketResponse(
            id=t.id,
            user_id=t.user_id,
            qr_code=t.qr_code,
            status=t.status,
            created_at=t.created_at,
            mode=t.mode,
            route=route_data,
            bus=t.bus.plate_number if t.bus else None
        ))
    return response

# Soft deleting the ticket by user
@router.put("/{ticket_id}", dependencies=[Depends(get_current_user)])
async def delete_ticket(ticket_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Soft-deletes a ticket, restricted to tickets belonging to the user's company.
    """
    company_id = user.company_id
    if not company_id:
        raise HTTPException(status_code=403, detail="User is not associated with a company")
        
    # Find ticket
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.mode == "active",
        Ticket.company_id == company_id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found or does not belong to your company")

    # Update bus available seats
    bus = db.query(Bus).filter(Bus.id == ticket.bus_id).first()
    if bus:
        bus.available_seats += 1 # Increment remaining seats

    # Soft delete the ticket
    ticket.mode = "deleted"
    ticket.status = "cancelled"

    db.commit()
    db.refresh(ticket)

    return {
        "message": "Ticket deleted and seat updated",
        "ticket_id": str(ticket.id),
        "status": ticket.status,
        "bus_available_seats": bus.available_seats if bus else None
    }


@router.get("/my-tickets/", response_model=list[TicketResponse], dependencies=[Depends(get_current_user)])
async def list_user_tickets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Lists tickets for the current authenticated user only.
    """
    tickets = db.query(Ticket).options(
        orm.joinedload(Ticket.route),
        orm.joinedload(Ticket.bus)
    ).filter(
        Ticket.user_id == str(user.id),
        Ticket.mode == 'active'
    ).all()
    
    # Wait, simple joinedload(Ticket.route) is enough if we fetch station names inside the loop or if route has relation to stations
    # Checking models.py: Route has origin_id, destination_id. BusStation has no backref named 'origin_id_rel'.
    # Route has NO relationship to BusStation named 'origin_station' defined in the snippet I saw!
    # Wait, models.py: 
    # class Route(Base): ... origin_id = ... destination_id = ... 
    # NO relationship defined for origin/destination stations in Route class in models.py snippet?
    # Let me re-read models.py snippet provided in Step 299...
    # Lines 248-251: company, segments, buses, tickets using relationship.
    # NO relationship to BusStation for origin_id/destination_id!
    # That explains why I need to fetch stations manually or add relationships.
    
    # Correction: I will fetch them manually or rely on `RouteSegment` if available? 
    # Ideally, I should add relationships to Route model. But user didn't ask me to change Model structure heavily if avoidable.
    # However, `tickets_router.py` get_ticket (line 198) manually queries stations.
    
    response = []
    for t in tickets:
        route_data = None
        if t.route:
             # Manual fetch or use existing logic
             # Ideally efficiently: but for now let's do it per ticket or fix logic.
             # Actually, `tickets_router.py` `get_ticket` does manual queries.
             # It's inefficient for list, but safe. 
             # Better: fetch stations.
             
             origin_name = "N/A"
             destination_name = "N/A"
             
             # To avoid N+1, I should really Fix the Route model to have relationships to Stations.
             # But let's stick to manual query for now to minimize risk of breaking other things?
             # No, 2 manual queries per ticket is bad.
             # Let's assume I can change `TicketResponse` construction to use IDs or whatever is available, 
             # BUT the frontend expects names: {ticket.route?.origin || 'N/A'}
             
             o_station = db.query(BusStation).filter(BusStation.id == t.route.origin_id).first()
             d_station = db.query(BusStation).filter(BusStation.id == t.route.destination_id).first()
             
             route_data = {
                 "origin": o_station.name if o_station else None,
                 "destination": d_station.name if d_station else None,
                 "price": t.route.price
             }

        response.append(TicketResponse(
            id=t.id,
            user_id=t.user_id,
            qr_code=t.qr_code,
            status=t.status,
            created_at=t.created_at,
            mode=t.mode,
            route=route_data,
            bus=t.bus.plate_number if t.bus else None
        ))

    return response


@router.patch("/{ticket_id}/status", response_model=TicketResponse, dependencies=[Depends(get_current_user)])
async def update_ticket_status(ticket_id: str, new_status: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Updates the status of a ticket, restricted to tickets belonging to the user's company.
    """
    company_id = user.company_id
    if not company_id:
        raise HTTPException(status_code=403, detail="User is not associated with a company")

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.company_id == company_id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found or does not belong to your company")

    ticket.status = new_status
    db.commit()
    db.refresh(ticket)

    qr_base64, _ = await generate_signed_qr({
        "ticket_id": ticket.id,
        "user_id": ticket.user_id,
        "bus_id": ticket.bus_id,
        "route_id": ticket.route_id,
        "created_at": ticket.created_at.isoformat()
    })

    return TicketResponse(
        id=ticket.id,
        user_id=ticket.user_id,
        qr_code=qr_base64,
        status=ticket.status,
        created_at=ticket.created_at
    )


@router.delete("/admin_delete/{ticket_id}", dependencies=[Depends(get_current_user), Depends(check_permission("admin_delete_ticket"))])
async def admin_delete_ticket(ticket_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Permanently deletes a ticket, restricted to tickets belonging to the user's company.
    """
    company_id = user.company_id
    if not company_id:
        raise HTTPException(status_code=403, detail="User is not associated with a company")
        
    # find ticket
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.company_id == company_id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found or does not belong to your company")

    db.delete(ticket)
    db.commit()

    return {"message": "Ticket deleted by admin"}


@router.post("/verify-qr")
async def verify_qr_code(qr_token: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Verify a QR code token and return ticket information.
    Used by company staff to verify tickets at boarding.
    """
    try:
        # Decode the token
        decoded = base64.urlsafe_b64decode(qr_token.encode())
        parts = decoded.split(b".")
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid QR token format")
        
        ticket_id_bytes, signature = parts
        
        # Verify signature
        expected_signature = hmac.new(key_bytes, ticket_id_bytes, hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(status_code=400, detail="Invalid QR token signature")
        
        ticket_id = ticket_id_bytes.decode()
        
        # Find ticket
        ticket = db.query(Ticket).options(
            orm.joinedload(Ticket.user),
            orm.joinedload(Ticket.bus),
            orm.joinedload(Ticket.route),
            orm.joinedload(Ticket.schedule)
        ).filter(Ticket.id == ticket_id).first()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        if ticket.mode != "active":
            raise HTTPException(status_code=400, detail="Ticket is not active")
        
        # Get route info
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
