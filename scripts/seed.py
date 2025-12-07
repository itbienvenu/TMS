import os
import sys
import asyncio
from datetime import datetime, UTC
import uuid
import hashlib

# Add current dir to path to find services
sys.path.append(os.getcwd())

# Import from common models
try:
    from services.common.models import Base, User, Company, CompanyUser, Bus, Route, BusStation, Driver, Role, LoginOTP
    from services.common.database import get_db_engine, get_db_session
except ImportError:
    from common.models import Base, User, Company, CompanyUser, Bus, Route, BusStation, Driver, Role, LoginOTP
    from common.database import get_db_engine, get_db_session

def get_password_hash(password: str) -> str:
    # Use Passlib locally if available or simple hash for seed ? 
    # To avoid dependency issues inside containers if passlib isn't common (it is).
    # We will assume passlib context.
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

def seed_data():
    engine = get_db_engine("seed")
    Base.metadata.create_all(bind=engine)
    session_gen = get_db_session(engine)
    db = next(session_gen)
    
    try:
        # 1. Create Super Admin (Platform Admin)
        admin_email = "admin@ticketing.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print("Creating Super Admin...")
            admin = User(
                id=str(uuid.uuid4()),
                email=admin_email,
                full_name="Super Admin",
                phone_number="0780000000",
                password_hash=get_password_hash("admin123"),
                created_at=datetime.now(UTC)
            )
            # Assuming Role based? Or is_staff? Current models have User and CompanyUser.
            # Usually Super Admin is in User table or CompanyUser?
            # From admin_router, it seems get_current_super_admin_user checks something.
            # Let's check backend/methods/permissions.py... handled later.
            # For now, we persist the User.
            db.add(admin)
        
        # 2. Create Default Company
        company_name = "Kigali Bus Service"
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            print(f"Creating Company: {company_name}...")
            company = Company(
                id=str(uuid.uuid4()),
                name=company_name,
                email="info@kbs.rw",
                phone_number="0788888888",
                address="Nyabugogo, Kigali",
                created_at=datetime.now(UTC)
            )
            db.add(company)
        
        # 3. Create Company Admin
        comp_admin_email = "admin@kbs.rw"
        comp_admin = db.query(CompanyUser).filter(CompanyUser.email == comp_admin_email).first()
        if not comp_admin:
            print(f"Creating Company Admin: {comp_admin_email}...")
            comp_admin = CompanyUser(
                id=str(uuid.uuid4()),
                email=comp_admin_email,
                login_email="kbs_admin", # Login identifier
                full_name="KBS Admin",
                phone_number="0781111111",
                password_hash=get_password_hash("password123"),
                company_id=company.id,
                created_at=datetime.now(UTC)
            )
            db.add(comp_admin)
            
            # Add Admin Role
            role = Role(
                id=str(uuid.uuid4()),
                name="admin",
                company_id=company.id
                # permissions="all" # SImplified
            )
            db.add(role)
            comp_admin.roles.append(role)

        # 4. Bus Stations (Kigali, Musanze)
        stations = ["Nyabugogo", "Musanze", "Rubavu", "Huye"]
        station_objs = {}
        for s_name in stations:
            st = db.query(BusStation).filter(BusStation.name == s_name).first()
            if not st:
                print(f"Creating Station: {s_name}")
                st = BusStation(
                    id=str(uuid.uuid4()), 
                    name=s_name, 
                    location=s_name, 
                    created_at=datetime.now(UTC)
                )
                db.add(st)
            station_objs[s_name] = st
            
        # 5. Create Route (Kigali -> Musanze)
        if station_objs.get("Nyabugogo") and station_objs.get("Musanze") and company:
            route = db.query(Route).filter(
                Route.origin_id==station_objs["Nyabugogo"].id, 
                Route.destination_id==station_objs["Musanze"].id
            ).first()
            
            if not route:
                print("Creating Route: Kigali -> Musanze")
                route = Route(
                    id=str(uuid.uuid4()),
                    origin_id=station_objs["Nyabugogo"].id,
                    destination_id=station_objs["Musanze"].id,
                    company_id=company.id,
                    price=2500,
                    created_at=datetime.now(UTC)
                )
                db.add(route)
            
            # 6. Create Bus
            bus_plate = "RAC 123 A"
            bus = db.query(Bus).filter(Bus.plate_number == bus_plate).first()
            if not bus:
                print(f"Creating Bus: {bus_plate}")
                bus = Bus(
                    id=str(uuid.uuid4()),
                    plate_number=bus_plate,
                    capacity=30,
                    available_seats=30,
                    company_id=company.id,
                    created_at=datetime.now(UTC)
                )
                db.add(bus)
                
            # 7. Create Driver
            driver_email = "driver@kbs.rw"
            driver = db.query(Driver).filter(Driver.email == driver_email).first()
            if not driver:
                print(f"Creating Driver: {driver_email}")
                driver = Driver(
                    id=str(uuid.uuid4()),
                    full_name="John Driver",
                    email=driver_email,
                    phone_number="0789999999",
                    license_number="DL12345",
                    company_id=company.id,
                    bus_id=bus.id, # Assign to bus
                    created_at=datetime.now(UTC),
                    password_hash=get_password_hash("driver123")
                )
                db.add(driver)

        db.commit()
        print("Data Seeding Completed Successfully.")
        
    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
