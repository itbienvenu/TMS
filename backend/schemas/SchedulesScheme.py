from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ScheduleBase(BaseModel):
    bus_id: Optional[str] = None
    route_segment_id: Optional[str] = None
    departure_time: datetime
    arrival_time: Optional[datetime] = None

class ScheduleCreate(ScheduleBase):
    bus_id: str
    route_segment_id: str

class ScheduleUpdate(BaseModel):
    departure_time: datetime
    arrival_time: Optional[datetime] = None

class ScheduleResponse(ScheduleBase):
    id: str
    company_id: str

    class Config:
        from_attributes = True
