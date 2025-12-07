from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.payments import router as payments_router
from common.database import get_db_engine, Base

app = FastAPI(title="Payment Service", docs_url="/docs", openapi_url="/openapi.json")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payments_router)

@app.on_event("startup")
def startup():
    engine = get_db_engine("payment")
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "payment-service"}
