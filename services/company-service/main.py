from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# We need to import more routers for full company service (buses, stations, companies)
# For now, we only migrated 'routes' as an example. 
from routers.routes import router as routes_router
# We should ideally have routers.companies, routers.buses, etc.
from common.database import get_db_engine, Base

app = FastAPI(title="Company Service", docs_url="/docs", openapi_url="/openapi.json")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_router)
# app.include_router(buses_router)
# app.include_router(stations_router)
# app.include_router(companies_router)

@app.on_event("startup")
def startup():
    engine = get_db_engine("company")
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "company-service"}
