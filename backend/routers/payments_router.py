from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, UTC
import uuid

from database.models import Payment, Ticket, User, Route, PaymentStatus
from schemas.PaymentScheme import PaymentCreate, PaymentResponse
from database.dbs import get_db
from methods.functions import get_current_user

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])

@router.post("/mock", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_mock_payment(
    payment_req: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Simulates a payment process for a ticket.
    """
    ticket_id = str(payment_req.ticket_id)
    
    # 1. Find the ticket
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check ownership
    if ticket.user_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized to pay for this ticket")
        
    # Check status
    if ticket.status == "paid":
        raise HTTPException(status_code=400, detail="Ticket is already paid")
    if ticket.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot pay for cancelled ticket")
        
    # 2. Get Amount from Route
    # We need to fetch route to get price.
    route = db.query(Route).filter(Route.id == ticket.route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route information missing")
        
    amount = route.price
    
    # 3. Create Payment Record (Simulated Success)
    # Validation for phone number if provider is mobile money could be added here
    # but for mockup we assume valid.
    
    new_payment = Payment(
        id=str(uuid.uuid4()),
        ticket_id=ticket.id,
        user_id=str(user.id),
        phone_number=payment_req.phone_number if payment_req.phone_number else "N/A",
        amount=amount,
        provider=payment_req.provider,
        status=PaymentStatus.success, # Mocking success immediately
        created_at=datetime.now(UTC)
    )
    
    db.add(new_payment)
    
    # 4. Update Ticket Status
    ticket.status = "paid" 
    
    db.commit()
    db.refresh(new_payment)
    db.refresh(ticket)
    
    return new_payment
