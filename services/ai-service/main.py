from fastapi import FastAPI
from app.routers import chat
import uvicorn
import os

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Agent Service", version="1.0.0")

from app.common.db import engine
from app.common.models import Base

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-service"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8008, reload=True)
