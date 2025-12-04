"""
Database seeding script to populate the database with test data.
Run this script to create sample companies, users, buses, routes, schedules, etc.
"""
import sys
import os
from datetime import datetime, UTC, timedelta
from passlib.hash import bcrypt

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.dbs import SessionLocal, engine
from database.models import (
    Base, Company, User, CompanyUser, Bus, BusStation, Route, RouteSegment,
    Schedule, Ticket, Payment, PaymentStatus, Role, Permission, CompanyUser
)
from sqlalchemy import text

# Create all tables
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    try:
        print("🌱 Starting database seeding...")
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        # Order matters due to foreign key constraints
        print("🗑️  Clearing existing data...")
        db.execute(text("DELETE FROM payments"))
        db.execute(text("DELETE FROM tickets"))
        db.execute(text("DELETE FROM login_otps"))
        db.execute(text("DELETE FROM bus_schedules"))
        db.execute(text("DELETE FROM bus_routes"))
        db.execute(text("DELETE FROM schedules"))
        db.execute(text("DELETE FROM route_segments"))
        db.execute(text("DELETE FROM routes"))
        db.execute(text("DELETE FROM bus_stations"))
        db.execute(text("DELETE FROM buses"))
        db.execute(text("DELETE FROM company_user_roles"))
        db.execute(text("DELETE FROM company_user_extra_permissions"))
        db.execute(text("DELETE FROM company_user_revoked_permissions"))
        db.execute(text("DELETE FROM company_users"))
        db.execute(text("DELETE FROM roles"))
        db.execute(text("DELETE FROM permissions"))
        db.execute(text("DELETE FROM users"))
        db.execute(text("DELETE FROM companies"))
        db.commit()
        
        # 1. Create Companies
        print("📦 Creating companies...")
        company1 = Company(
            id="company-001",
            name="Express Bus Lines",
            email="info@expressbus.com",
            phone_number="+225 07 12 34 56 78",
            address="Abidjan, Cocody",
            created_at=datetime.now(UTC)
        )
        
        company2 = Company(
            id="company-002",
            name="Comfort Travel",
            email="contact@comforttravel.com",
            phone_number="+225 05 98 76 54 32",
            address="Abidjan, Yopougon",
            created_at=datetime.now(UTC)
        )
        
        db.add(company1)
        db.add(company2)
        db.commit()
        print(f"✅ Created companies: {company1.name}, {company2.name}")
        
        # 2. Create Regular Users (customers)
        print("👥 Creating regular users...")
        password_hash = bcrypt.hash("password123")
        
        user1 = User(
            id="user-001",
            full_name="John Doe",
            email="john.doe@example.com",
            phone_number="+225 07 11 22 33 44",
            password_hash=password_hash,
            created_at=datetime.now(UTC)
        )
        
        user2 = User(
            id="user-002",
            full_name="Jane Smith",
            email="jane.smith@example.com",
            phone_number="+225 07 55 66 77 88",
            password_hash=password_hash,
            created_at=datetime.now(UTC)
        )
        
        db.add(user1)
        db.add(user2)
        db.commit()
        print(f"✅ Created users: {user1.full_name}, {user2.full_name}")
        
        # 3. Create Super Admin Role and User
        print("👑 Creating super admin...")
        super_admin_role = Role(
            id="role-super-admin",
            name="super_admin",
            company_id=None  # Global role
        )
        db.add(super_admin_role)
        db.commit()
        
        super_admin = CompanyUser(
            id="company-user-super-admin",
            full_name="Super Admin",
            email="superadmin@ticketing.com",
            login_email="admin@ticketing.com",
            phone_number="+225 01 00 00 00 00",
            password_hash=password_hash,
            company_id=company1.id,  # Assign to first company for now
            created_at=datetime.now(UTC)
        )
        super_admin.roles.append(super_admin_role)
        db.add(super_admin)
        db.commit()
        print("✅ Created super admin")
        
        # 4. Create Company Admin Roles
        print("🏢 Creating company admin roles...")
        company_admin_role1 = Role(
            id="role-admin-001",
            name="company_admin",
            company_id=company1.id
        )
        company_admin_role2 = Role(
            id="role-admin-002",
            name="company_admin",
            company_id=company2.id
        )
        db.add(company_admin_role1)
        db.add(company_admin_role2)
        db.commit()
        
        # 5. Create Company Users
        print("👨‍💼 Creating company users...")
        company_user1 = CompanyUser(
            id="company-user-001",
            full_name="Alice Manager",
            email="alice@expressbus.com",
            login_email="admin@expressbus.com",
            phone_number="+225 07 12 34 56 79",
            password_hash=password_hash,
            company_id=company1.id,
            created_at=datetime.now(UTC)
        )
        company_user1.roles.append(company_admin_role1)
        
        company_user2 = CompanyUser(
            id="company-user-002",
            full_name="Bob Director",
            email="bob@comforttravel.com",
            login_email="admin@comforttravel.com",
            phone_number="+225 05 98 76 54 33",
            password_hash=password_hash,
            company_id=company2.id,
            created_at=datetime.now(UTC)
        )
        company_user2.roles.append(company_admin_role2)
        
        db.add(company_user1)
        db.add(company_user2)
        db.commit()
        print(f"✅ Created company users: {company_user1.full_name}, {company_user2.full_name}")
        
        # 6. Create Bus Stations
        print("📍 Creating bus stations...")
        stations = [
            BusStation(id="station-001", name="Gare du Nord", location="Abidjan, Cocody", company_id=company1.id),
            BusStation(id="station-002", name="Gare du Sud", location="Abidjan, Yopougon", company_id=company1.id),
            BusStation(id="station-003", name="Gare Centrale", location="Abidjan, Plateau", company_id=company1.id),
            BusStation(id="station-004", name="Terminal Yopougon", location="Abidjan, Yopougon", company_id=company2.id),
            BusStation(id="station-005", name="Terminal Cocody", location="Abidjan, Cocody", company_id=company2.id),
        ]
        for station in stations:
            db.add(station)
        db.commit()
        print(f"✅ Created {len(stations)} bus stations")
        
        # 7. Create Routes
        print("🛣️  Creating routes...")
        route1 = Route(
            id="route-001",
            origin_id="station-001",
            destination_id="station-002",
            price=2500.0,
            company_id=company1.id,
            created_at=datetime.now(UTC)
        )
        
        route2 = Route(
            id="route-002",
            origin_id="station-001",
            destination_id="station-003",
            price=1500.0,
            company_id=company1.id,
            created_at=datetime.now(UTC)
        )
        
        route3 = Route(
            id="route-003",
            origin_id="station-004",
            destination_id="station-005",
            price=2000.0,
            company_id=company2.id,
            created_at=datetime.now(UTC)
        )
        
        db.add(route1)
        db.add(route2)
        db.add(route3)
        db.commit()
        print(f"✅ Created routes")
        
        # 8. Create Route Segments
        print("🔗 Creating route segments...")
        segment1 = RouteSegment(
            id="segment-001",
            route_id=route1.id,
            start_station_id="station-001",
            end_station_id="station-002",
            price=2500.0,
            stop_order=1,
            company_id=company1.id
        )
        
        segment2 = RouteSegment(
            id="segment-002",
            route_id=route2.id,
            start_station_id="station-001",
            end_station_id="station-003",
            price=1500.0,
            stop_order=1,
            company_id=company1.id
        )
        
        segment3 = RouteSegment(
            id="segment-003",
            route_id=route3.id,
            start_station_id="station-004",
            end_station_id="station-005",
            price=2000.0,
            stop_order=1,
            company_id=company2.id
        )
        
        db.add(segment1)
        db.add(segment2)
        db.add(segment3)
        db.commit()
        print(f"✅ Created route segments")
        
        # 9. Create Buses
        print("🚌 Creating buses...")
        bus1 = Bus(
            id="bus-001",
            plate_number="AB-123-CD",
            capacity=50,
            available_seats=0,
            company_id=company1.id,
            created_at=datetime.now(UTC)
        )
        bus1.routes.append(route1)
        
        bus2 = Bus(
            id="bus-002",
            plate_number="EF-456-GH",
            capacity=40,
            available_seats=0,
            company_id=company1.id,
            created_at=datetime.now(UTC)
        )
        bus2.routes.append(route2)
        
        bus3 = Bus(
            id="bus-003",
            plate_number="IJ-789-KL",
            capacity=45,
            available_seats=0,
            company_id=company2.id,
            created_at=datetime.now(UTC)
        )
        bus3.routes.append(route3)
        
        db.add(bus1)
        db.add(bus2)
        db.add(bus3)
        db.commit()
        print(f"✅ Created buses")
        
        # 10. Create Schedules
        print("📅 Creating schedules...")
        tomorrow = datetime.now(UTC) + timedelta(days=1)
        
        schedule1 = Schedule(
            id="schedule-001",
            bus_id=bus1.id,
            route_segment_id=segment1.id,
            departure_time=tomorrow.replace(hour=8, minute=0, second=0, microsecond=0),
            arrival_time=tomorrow.replace(hour=10, minute=0, second=0, microsecond=0),
            company_id=company1.id
        )
        
        schedule2 = Schedule(
            id="schedule-002",
            bus_id=bus1.id,
            route_segment_id=segment1.id,
            departure_time=tomorrow.replace(hour=14, minute=0, second=0, microsecond=0),
            arrival_time=tomorrow.replace(hour=16, minute=0, second=0, microsecond=0),
            company_id=company1.id
        )
        
        schedule3 = Schedule(
            id="schedule-003",
            bus_id=bus2.id,
            route_segment_id=segment2.id,
            departure_time=tomorrow.replace(hour=9, minute=30, second=0, microsecond=0),
            arrival_time=tomorrow.replace(hour=10, minute=30, second=0, microsecond=0),
            company_id=company1.id
        )
        
        schedule4 = Schedule(
            id="schedule-004",
            bus_id=bus3.id,
            route_segment_id=segment3.id,
            departure_time=tomorrow.replace(hour=7, minute=0, second=0, microsecond=0),
            arrival_time=tomorrow.replace(hour=8, minute=30, second=0, microsecond=0),
            company_id=company2.id
        )
        
        db.add(schedule1)
        db.add(schedule2)
        db.add(schedule3)
        db.add(schedule4)
        db.commit()
        print(f"✅ Created schedules")
        
        # 11. Create Sample Tickets
        print("🎫 Creating sample tickets...")
        import uuid
        import qrcode
        import io
        import base64
        import hmac
        import hashlib
        
        SECRET_KEY = os.environ.get("TICKET_SECRET_KEY", "your-secret-key-here")
        key_bytes = SECRET_KEY.encode()
        
        def generate_qr_token(ticket_id: str) -> str:
            ticket_id_bytes = ticket_id.encode()
            signature = hmac.new(key_bytes, ticket_id_bytes, hashlib.sha256).digest()
            token = base64.urlsafe_b64encode(ticket_id_bytes + b"." + signature).decode()
            return token
        
        ticket1 = Ticket(
            id="ticket-001",
            user_id=user1.id,
            bus_id=bus1.id,
            route_id=route1.id,
            schedule_id=schedule1.id,
            qr_code=generate_qr_token("ticket-001"),
            status="booked",
            mode="active",
            company_id=company1.id,
            created_at=datetime.now(UTC)
        )
        bus1.available_seats += 1
        
        ticket2 = Ticket(
            id="ticket-002",
            user_id=user2.id,
            bus_id=bus2.id,
            route_id=route2.id,
            schedule_id=schedule3.id,
            qr_code=generate_qr_token("ticket-002"),
            status="paid",
            mode="active",
            company_id=company1.id,
            created_at=datetime.now(UTC)
        )
        bus2.available_seats += 1
        
        db.add(ticket1)
        db.add(ticket2)
        db.commit()
        print(f"✅ Created sample tickets")
        
        # 12. Create Sample Payment
        print("💳 Creating sample payment...")
        payment1 = Payment(
            id="payment-001",
            ticket_id=ticket2.id,
            user_id=user2.id,
            phone_number="+225 07 55 66 77 88",
            amount=1500.0,
            provider="momo",
            status=PaymentStatus.success,
            created_at=datetime.now(UTC)
        )
        
        db.add(payment1)
        db.commit()
        print(f"✅ Created sample payment")
        
        print("\n" + "="*50)
        print("✅ Database seeding completed successfully!")
        print("="*50)
        print("\n📋 Test Credentials:")
        print("\n👤 Regular Users (Customer Portal):")
        print("   Email: john.doe@example.com")
        print("   Password: password123")
        print("\n   Email: jane.smith@example.com")
        print("   Password: password123")
        print("\n👨‍💼 Company Users (Company Dashboard):")
        print("   Company: Express Bus Lines")
        print("   Login Email: admin@expressbus.com")
        print("   Password: password123")
        print("   (OTP will be sent to: alice@expressbus.com)")
        print("\n   Company: Comfort Travel")
        print("   Login Email: admin@comforttravel.com")
        print("   Password: password123")
        print("   (OTP will be sent to: bob@comforttravel.com)")
        print("\n👑 Super Admin:")
        print("   Login Email: admin@ticketing.com")
        print("   Password: password123")
        print("   (OTP will be sent to: superadmin@ticketing.com)")
        print("\n" + "="*50)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

