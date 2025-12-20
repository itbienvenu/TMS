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

import redis
import json
import os

# Redis for Idempotency
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379")
redis_client = redis.StrictRedis.from_url(REDIS_URL, decode_responses=True)

@router.post("/mock", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_mock_payment(
    payment_req: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # 1. Idempotency Check
    # If client sends 'idempotency_key', we check recent transactions
    if payment_req.idempotency_key:
        cached_result = redis_client.get(f"payment:idempotency:{payment_req.idempotency_key}")
        if cached_result:
             # Return PREVIOUS result immediately
             return json.loads(cached_result)

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
        created_at=datetime.now(UTC),
        idempotency_key=payment_req.idempotency_key # Save key to DB too for audit
    )
    
    db.add(new_payment)
    ticket.status = "paid" 
    
    db.commit()
    db.refresh(new_payment)
    
    # 2. Serialize and Cache Response
    # Because Payment object is not JSON serializable, we convert to dict using schema dump or simple dict
    response_data = {
        "id": new_payment.id,
        "ticket_id": new_payment.ticket_id,
        "amount": new_payment.amount,
        "status": new_payment.status.value,
        "provider": new_payment.provider,
        "created_at": new_payment.created_at.isoformat()
    }
    
    if payment_req.idempotency_key:
        redis_client.setex(
            f"payment:idempotency:{payment_req.idempotency_key}", 
            86400, # 24 hours
            json.dumps(response_data)
        )
    
    # 3. Publish Event for Notifications
    try:
        import pika
        rabbitmq_url = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
        params = pika.URLParameters(rabbitmq_url)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange='ticketing_events', exchange_type='topic')
        
        event_data = {
            "ticket_id": ticket.id,
            "user_email": user.email,
            "user_phone": user.phone_number,
            "amount": amount,
            "route": f"{route.origin} -> {route.destination}"
        }
        
        channel.basic_publish(
            exchange='ticketing_events',
            routing_key='ticket.paid',
            body=json.dumps(event_data)
        )
        connection.close()
    except Exception as e:
        print(f"Failed to publish payment event: {e}")

    return new_payment
