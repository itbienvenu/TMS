from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database.dbs import get_db
from database.models import Ticket, Payment, PaymentStatus, Route
from schemas.PaymentScheme import PaymentCreate, PaymentResponse
from methods.functions import get_current_user
from methods.permissions import get_current_company_user, check_permission
from uuid import UUID, uuid4
from datetime import datetime, UTC

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])

@router.post("/", response_model=PaymentResponse)
def initiate_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Initiate a payment for a ticket"""
    # 1. Verify ticket exists
    ticket = db.query(Ticket).filter(Ticket.id == str(payment.ticket_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only pay for your own ticket")

    get_route = db.query(Route).filter(Route.id == ticket.route_id).first()
    if not get_route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # 3. Create Payment record
    ticket.status = "pending payment"
    verify_ticket_availability = db.query(Payment).filter(Payment.ticket_id == ticket.id).first()
    if verify_ticket_availability:
        raise HTTPException(status_code=403, detail="Trip payment has been initialized")
    
    new_payment = Payment(
        id=str(uuid4()),
        ticket_id=str(ticket.id),
        user_id=str(current_user.id),
        phone_number=str(payment.phone_number),
        provider=str(payment.provider.value),
        amount=float(get_route.price), 
        status=PaymentStatus.pending,
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    # TODO: call external payment api

    return new_payment


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get payment details"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Users can only see their own payments
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own payments")
    
    return payment


@router.get("/", response_model=List[PaymentResponse])
def get_my_payments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all payments for the current user"""
    payments = db.query(Payment).filter(Payment.user_id == current_user.id).all()
    return payments


@router.patch("/{payment_id}/status", response_model=PaymentResponse)
def update_payment_status(
    payment_id: str,
    new_status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_company_user)
):
    """Update payment status (for company admins)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify ticket belongs to company
    ticket = db.query(Ticket).filter(Ticket.id == payment.ticket_id).first()
    if not ticket or ticket.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Payment does not belong to your company")
    
    # Validate status
    try:
        payment.status = PaymentStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")
    
    # Update ticket status based on payment
    if payment.status == PaymentStatus.success:
        ticket.status = "paid"
    elif payment.status == PaymentStatus.failed:
        ticket.status = "payment_failed"
    
    db.commit()
    db.refresh(payment)
    
    return payment


@router.post("/webhook")
async def payment_webhook(
    payment_id: str = Body(..., embed=True),
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for payment providers to notify about payment status updates.
    In production, this should verify the webhook signature from the payment provider.
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Update payment status
    try:
        payment.status = PaymentStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    # Update ticket status
    ticket = db.query(Ticket).filter(Ticket.id == payment.ticket_id).first()
    if ticket:
        if payment.status == PaymentStatus.success:
            ticket.status = "paid"
        elif payment.status == PaymentStatus.failed:
            ticket.status = "payment_failed"
    
    db.commit()
    db.refresh(payment)
    
    return {"message": "Payment status updated", "payment_id": payment_id, "status": status}
