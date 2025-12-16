from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.admin import router as admin_router
from common.database import get_db_engine, Base
from common.middleware import EncryptionMiddleware

app = FastAPI(title="User Service", docs_url="/docs", openapi_url="/openapi.json")

# Encryption Middleware (before CORS or after? usually before routing, but order matters for CORS)
# BaseHTTPMiddleware usually runs *before* CORS if added *after*? 
# Starlette middleware order: Last added runs first (outermost).
# We want Decrypt -> CORS -> App.
# So add Decrypt *after* CORS (so CORS runs first? No, CORS handles OPTIONS).
# If we encrypt, CORS Preflight (OPTIONS) is not encrypted.
# POST (Encrypted) -> Decrypt -> Router.
# So Decrypt should be Inner. 
# app.add_middleware adds to the "top" of the stack (outermost).
# So:
# 1. add_middleware(Encryption)
# 2. add_middleware(CORS)
# Request -> Encryption -> CORS (Wait, CORS checks Origin).
# The Encryption middleware parses body. CORS doesn't need body.
# Ideally: CORS (Outer) -> Encryption (Inner).
# So add Encryption FIRST (which puts it inner? No, Starlette is weird).
# Starlette/FastAPI: add_middleware adds to the stack. The last added middleware is the FIRST execution layer.
# So:
# app.add_middleware(CORS) -> First to run.
# app.add_middleware(Encryption) -> Second to run.
# So I should add Encryption *after* CORS definition in the file? No, above it.
# Wait, let's just add it.

app.add_middleware(EncryptionMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)

@app.on_event("startup")
def startup():
    engine = get_db_engine("user")
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "user-service"}
