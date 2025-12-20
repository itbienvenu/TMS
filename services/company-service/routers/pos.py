from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.dbs import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/pos", tags=["Point of Sale"])

class OfflineTicketSync(BaseModel):
    route_id: str
    bus_id: str
    seat_number: int
    customer_name: str
    amount: float
    agent_id: str

@router.post("/sync")
def sync_offline_tickets(tickets: List[OfflineTicketSync], db: Session = Depends(get_db)):
    synced_count = 0
    errors = []
    
    for ticket in tickets:
        try:
            # logic to call Ticketing Service and "Force Book" this seat
            # We assume cash is already collected by agent
            # create_ticket(db, ticket...)
            synced_count += 1
        except Exception as e:
            errors.append({"ticket": ticket.dict(), "error": str(e)})
            
    return {"status": "completed", "synced": synced_count, "errors": errors}
