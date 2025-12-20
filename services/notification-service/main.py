
from fastapi import FastAPI, Request
import logging
import os
from routers import email, sms
from core.consumer import start_rabbitmq_consumer
import asyncio

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NotificationService")

app = FastAPI(title="Notification Service", version="1.0.0")

# Include Routers (for manual testing triggers)
app.include_router(email.router)
app.include_router(sms.router)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Notification Service...")
    # Start RabbitMQ Consumer in background
    asyncio.create_task(start_rabbitmq_consumer())

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "notification-service"}
