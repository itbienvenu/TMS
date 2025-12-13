from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import orm
import base64
import hmac
import hashlib
import os
from common.database import get_db_engine, get_db_session
from database.models import Ticket, BusStation, Ticket, Driver
from methods.permissions import check_permission
from methods.functions import get_current_driver

def get_db():
    engine = get_db_engine("qr")
    db = next(get_db_session(engine))
    try:
        yield db
    finally:
        db.close()

router = APIRouter(prefix="/api/v1/qr", tags=['QR Code'])
SECRET_KEY = os.environ.get("TICKET_SECRET_KEY", "fallback_secret")
key_bytes = SECRET_KEY.encode()

@router.post("/verify")
async def verify_qr_code(
    qr_token: str = Body(..., embed=True), 
    db: Session = Depends(get_db),
    driver: Driver = Depends(get_current_driver)
):
    """
    Separate QR verification service.
    Requires Driver Authentication.
    """
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
        
        # In full microservices, this would call Ticketing Service via gRPC/HTTP
        # For Phase 1 (Shared DB), we query directly.
        ticket = db.query(Ticket).options(
            orm.joinedload(Ticket.user),
            orm.joinedload(Ticket.bus),
            orm.joinedload(Ticket.route)
        ).filter(Ticket.id == ticket_id).first()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # --- Driver Validation Checks ---
        if ticket.company_id != driver.company_id:
             raise HTTPException(status_code=403, detail="Ticket is invalid for this company.")
        
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
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid QR code: {str(e)}")
