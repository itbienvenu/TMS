import os
import sys
import asyncio
from datetime import datetime, UTC
import uuid

# Add current dir to path
sys.path.append(os.getcwd())

from services.common.models import Base, User, Company, CompanyUser, Bus, Route, BusStation, Driver, Role
from services.common.database import get_db_engine, get_db_session

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)
except ImportError:
    import bcrypt
    def get_password_hash(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode(), salt).decode()

def seed_data():
    engine = get_db_engine("seed")
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    session_gen = get_db_session(engine)
    db = next(session_gen)
    
    try:
        print("Starting Seeding...")

        admin_company = db.query(Company).filter(Company.name == "Ticketing Admin").first()
        if not admin_company:
            print("Creating Admin Company...")
            admin_company = Company(
                 id=str(uuid.uuid4()),
                 name="Ticketing Admin",
                 email="admin@system.com",
                 address="System",
                 created_at=datetime.now(UTC)
            )
            db.add(admin_company)
            db.flush()

        super_role = db.query(Role).filter(Role.name == "super_admin").first()
        if not super_role:
            print("Creating super_admin Role...")
            super_role = Role(
                id=str(uuid.uuid4()),
                name="super_admin",
                company_id=admin_company.id # specific to admin company?
            )
            db.add(super_role)
            db.flush()

        # 3. Create Super Admin User (CompanyUser)
        admin_email = "admin@ticketing.com"
        # Check if exists in CompanyUser
        super_admin = db.query(CompanyUser).filter(CompanyUser.email == admin_email).first()
        
        if not super_admin:
            print(f"Creating Super Admin User: {admin_email}...")
            super_admin = CompanyUser(
                id=str(uuid.uuid4()),
                email=admin_email,
                login_email="super_admin", # Login ID
                full_name="Super Administrator",
                phone_number="0000000000",
                password_hash=get_password_hash("admin123"),
                company_id=admin_company.id,
                created_at=datetime.now(UTC)
            )
            super_admin.roles.append(super_role)
            db.add(super_admin)
        else:
            print("Super Admin already exists.")
            # Ensure role is assigned
            if super_role not in super_admin.roles:
                 super_admin.roles.append(super_role)


        # 4. Standard Seed Data (KBS)
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
            db.flush()
        
        # KBS Admin
        comp_admin_email = "admin@kbs.rw"
        comp_admin = db.query(CompanyUser).filter(CompanyUser.email == comp_admin_email).first()
        if not comp_admin:
            print(f"Creating KBS Admin: {comp_admin_email}...")
            comp_admin = CompanyUser(
                id=str(uuid.uuid4()),
                email=comp_admin_email,
                login_email="kbs_admin",
                full_name="KBS Admin",
                phone_number="0781111111",
                password_hash=get_password_hash("password123"),
                company_id=company.id,
                created_at=datetime.now(UTC)
            )
            # Create 'admin' role for KBS
            kbs_admin_role = Role(id=str(uuid.uuid4()), name="admin", company_id=company.id)
            db.add(kbs_admin_role)
            comp_admin.roles.append(kbs_admin_role)
            db.add(comp_admin)

        # Stations
        stations = ["Nyabugogo", "Musanze", "Rubavu", "Huye"]
        station_objs = {}
        for s_name in stations:
            st = db.query(BusStation).filter(BusStation.name == s_name).first()
            if not st:
                st = BusStation(id=str(uuid.uuid4()), name=s_name, location=s_name, company_id=company.id if company else None, created_at=datetime.now(UTC))
                db.add(st)
            station_objs[s_name] = st
            
        db.commit()
        print("Seeding Complete.")
        
    except Exception as e:
        print(f"Seeding Failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
