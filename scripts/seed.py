import os
import sys
import asyncio
from datetime import datetime, UTC
import uuid

# Add current dir to path
sys.path.append(os.getcwd())

from services.common.models import Base, User, Company, CompanyUser, Bus, Route, BusStation, Driver, Role, Permission
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
        kbs_admin_role = None
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
        else:
            # If admin exists, try to find the role
            kbs_admin_role = db.query(Role).filter(Role.name == "admin", Role.company_id == company.id).first()

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

        # Seed Bus and Driver
        bus_plate = "RAC 777 Z"
        bus = db.query(Bus).filter(Bus.plate_number == bus_plate).first()
        if not bus:
             print(f"Creating Bus: {bus_plate}...")
             bus = Bus(
                 id=str(uuid.uuid4()),
                 plate_number=bus_plate,
                 capacity=30,
                 available_seats=30,
                 company_id=company.id,
                 created_at=datetime.now(UTC)
             )
             db.add(bus)
             db.flush()
        
        driver_email = "driver@kbs.rw"
        driver = db.query(Driver).filter(Driver.email == driver_email).first()
        if not driver:
             print(f"Creating Driver: {driver_email}...")
             driver = Driver(
                 id=str(uuid.uuid4()),
                 full_name="John Driver",
                 email=driver_email,
                 phone_number="0789999999",
                 password_hash=get_password_hash("driver123"),
                 license_number="DL-123456",
                 company_id=company.id,
                 bus_id=bus.id,
                 created_at=datetime.now(UTC)
             )
             db.add(driver)

        # Permissions List
        permissions_list = [
            'create_user', 'view_user', 'update_user', 'delete_user',
            'view_ticket', 'update_ticket', 'delete_ticket',
            'create_payment', 'view_payment', 'update_payment', 'delete_payment',
            'create_role', 'view_role', 'update_role', 'delete_role', 'assign_role',
            'access_dashboard', 'manage_permissions', 'create_permission', 'assign_permission',
            'get_permission', 'delete_permission', 'view_users', 'list_all_roles',
            'create_route', 'update_route', 'delete_route', 'assign_bus_route',
            'delete_db', 'create_ticket', 'see_all_tickets', 'delete_bus',
            'create_station', 'update_station', 'delete_station',
             'create_bus', 'update_bus', 'view_bus',
             'create_schedule', 'view_schedule', 'update_schedule', 'delete_schedule'
        ]

        print("Seeding Permissions...")
        
        # Function to ensure permissions exist for a company and return them
        def ensure_company_permissions(company_id_val, role_obj):
             for perm_name in permissions_list:
                # check if exist for this company
                perm = db.query(Permission).filter(Permission.name == perm_name, Permission.company_id == company_id_val).first()
                if not perm:
                    perm = Permission(id=str(uuid.uuid4()), name=perm_name, company_id=company_id_val)
                    db.add(perm)
                    db.flush() # get ID
                
                # Assign to role
                if perm not in role_obj.permissions:
                    role_obj.permissions.append(perm)

        # Assign to Super Admin
        if super_role:
             # For super admin we might want global permissions (company_id=None) or specific to their company
             # Let's assign them permissions scoped to the Admin Company
             ensure_company_permissions(admin_company.id, super_role)

        # Assign to KBS Admin
        if kbs_admin_role:
             ensure_company_permissions(company.id, kbs_admin_role)

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
