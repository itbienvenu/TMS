
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/notification/sms", tags=["SMS"])

class SMSRequest(BaseModel):
    phone_number: str
    message: str

@router.post("/send")
def send_sms_endpoint(req: SMSRequest):
    # In production, integrate with Twilio/AfricasTalking here
    print(f"📱 [MOCK SMS] To: {req.phone_number} | Msg: {req.message}")
    return {"status": "sent", "provider": "mock"}
