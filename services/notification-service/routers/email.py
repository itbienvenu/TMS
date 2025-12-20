
from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/v1/notification/email", tags=["Email"])

class EmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    body: str

@router.post("/send")
def send_email_endpoint(req: EmailRequest):
    # In production, integrate with SendGrid/SMTP here
    print(f"📧 [MOCK EMAIL] To: {req.to_email} | Subject: {req.subject} | Body: {req.body}")
    return {"status": "sent", "provider": "mock"}
