from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SearchResult(BaseModel):
    schedule_id: str
    company_name: str
    origin_station: str
    destination_station: str
    departure_time: datetime
    arrival_time: datetime
    price: float
    available_seats: int
    bus_plate: str
    route_id: str

    class Config:
        from_attributes = True
