from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.companies import router as companies_router

app = FastAPI(title="Super Admin Service", docs_url="/docs", openapi_url="/openapi.json")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "super-admin-service"}
