from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import router as auth_router
from common.database import get_db_engine, Base
from common.middleware import EncryptionMiddleware

app = FastAPI(title="Auth Service", docs_url="/docs", openapi_url="/openapi.json")

app.add_middleware(EncryptionMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(auth_router)

@app.on_event("startup")
def startup():
    engine = get_db_engine("auth")
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auth-service"}
