from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# We need to import more routers for full company service (buses, stations, companies)
# For now, we only migrated 'routes' as an example. 
from routers.routes import router as routes_router
from routers.buses import router as buses_router
from routers.stations import router as stations_router
from routers.companies import router as companies_router
from routers.drivers import router as drivers_router
from routers.schedules import router as schedules_router
from routers.route_segments import router as route_segments_router
from routers.tickets import router as tickets_router
from routers.search import router as search_router
from routers.roles import router as roles_router
from routers.permissions import router as permissions_router
from routers.driver_api import router as driver_api_router
from routers.pos import router as pos_router
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
app.include_router(buses_router)
app.include_router(stations_router)
app.include_router(companies_router)
app.include_router(drivers_router)
app.include_router(schedules_router)
app.include_router(route_segments_router)
app.include_router(tickets_router)
app.include_router(search_router)
app.include_router(roles_router)
app.include_router(permissions_router)
app.include_router(driver_api_router)
app.include_router(pos_router)


@app.on_event("startup")
def startup():
    engine = get_db_engine("company")
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "company-service"}
