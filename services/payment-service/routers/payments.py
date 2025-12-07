from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, UTC
import uuid

from common.database import get_db_engine, get_db_session
from database.models import Payment, Ticket, User, Route, PaymentStatus
from schemas.PaymentScheme import PaymentCreate, PaymentResponse
from methods.functions import get_current_user

# Simple Dependency Wrapper
def get_db():
    engine = get_db_engine("payment")
    db = next(get_db_session(engine))
    try:
        yield db
    finally:
        db.close()

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])

@router.post("/mock", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_mock_payment(
    payment_req: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # ... logic copied ...
    ticket_id = str(payment_req.ticket_id)
    
    # In microservices, Ticket might be in another DB. 
    # For MVP (Phase 1), we share the DB instance so we can still query Ticket.
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.user_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized to pay for this ticket")
        
    if ticket.status == "paid":
        raise HTTPException(status_code=400, detail="Ticket is already paid")
    if ticket.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot pay for cancelled ticket")
        
    route = db.query(Route).filter(Route.id == ticket.route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route information missing")
        
    amount = route.price
    
    new_payment = Payment(
        id=str(uuid.uuid4()),
        ticket_id=ticket.id,
        user_id=str(user.id),
        phone_number=payment_req.phone_number if payment_req.phone_number else "N/A",
        amount=amount,
        provider=payment_req.provider,
        status=PaymentStatus.success, 
        created_at=datetime.now(UTC)
    )
    
    db.add(new_payment)
    ticket.status = "paid" 
    
    db.commit()
    db.refresh(new_payment)
    
    return new_payment
