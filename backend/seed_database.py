"""
Database seeding script to populate the database with test data.
Run this script to create sample companies, users, buses, routes, schedules, etc.
"""
import sys
import os
import uuid
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
        print(f"Created companies: {company1.name}, {company2.name}")
        
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
        print(f"Created users: {user1.full_name}, {user2.full_name}")
        
        # 3a. Seed Global Permissions
        print("🔐 Seeding global permissions...")
        permissions_data = [
            ('696f98f1-430a-462b-a810-b22f54fad497','create_user'),
            ('6516d275-8053-4909-945f-95072286a395','view_user'),
            ('4a19375c-b6a5-4025-8150-7ac7f4abf8b4','update_user'),
            ('fc1b8115-ea4a-42b9-ad92-fe8e74042b4a','delete_user'),
            ('3549f256-c0a7-4b6a-b7c7-dd29af5aeb59','view_ticket'),
            ('88e41c2c-1af2-4084-bc02-9fe4376dca9d','update_ticket'),
            ('56cf73f5-c0b5-4a67-b719-f4481b9f9c89','delete_ticket'),
            ('21f21eea-a334-4793-8f61-68a1b12c494b','create_payment'),
            ('86d3ba3c-4622-40b8-ad3f-6c879c186b42','view_payment'),
            ('59bf3bbd-5f74-4e2c-844e-da0c020e3a6b','update_payment'),
            ('e1b67670-a0cc-4aad-acd8-a861ee52db1c','delete_payment'),
            ('bac6d055-27db-451e-9598-a41998099439','create_role'),
            ('f7d245b6-20c6-4383-bc6c-ee558d38e9fd','view_role'),
            ('28f45dc9-c20a-430a-ac59-251234c91cbc','update_role'),
            ('eb0c8ff7-d208-4afb-a914-989090b5f819','delete_role'),
            ('838ca9f5-8dec-4d4e-8117-1a1ea4d23c23','assign_role'),
            ('1b836d28-3a4a-4318-b339-70ac25cb6e22','access_dashboard'),
            ('42c7337b-e0de-4da8-9f82-a731d11a2e93','manage_permissions'),
            ('e9d9702a-864e-4a5c-a3c8-d12cea6adb43','create_permission'),
            ('41b9c441-56c6-4dd5-a895-e9e236fc900e','assign_permission'),
            ('91c05ac9-128d-4b34-ae87-53195993779f','get_permission'),
            ('7b77033b-da6b-4e23-8fde-ee5db856877f','delete_permission'),
            ('c1f01aa5-e5da-4b58-953b-2d26648276bf','view_users'),
            ('244422cb-62b0-4699-8b8d-8984dd338116','list_all_roles'),
            ('64c67587-db9d-411b-93ce-84ca6e4b72f7','create_route'),
            ('d6b4cf86-aa78-463f-820b-92d4c82209b8','update_route'),
            ('fc98764c-c410-43da-aba9-66626f75cb5c','delete_route'),
            ('62f90a53-0629-4c99-9c28-8a6e74559d5d','assign_bus_route'),
            ('4c356884-8053-456a-8046-17b2034fdfd3','delete_db'),
            ('972974b8-16f0-4a82-84c2-0f2950c8e9d1','create_ticket'),
            ('c0b6259e-bb1c-4744-8c46-0ae419431214','see_all_tickets'),
            ('4b040bc2-03c4-43fc-913c-ba6677658042','delete_bus'),
        ]
        
        # Deduplicate by ID
        global_perms_dict = {}
        for pid, pname in permissions_data:
            global_perms_dict[pid] = pname

        for pid, pname in global_perms_dict.items():
            perm = Permission(id=pid, name=pname, company_id=None)
            db.add(perm)
        db.commit()


        # 3b. Create Super Admin Role and User
        print("👑 Creating super admin...")
        super_admin_role = Role(
            id="role-super-admin",
            name="super_admin",
            company_id=None  # Global role
        )
        # Assign all global permissions to super admin role (optional, but good practice)
        all_global_perms = db.query(Permission).filter(Permission.company_id == None).all()
        super_admin_role.permissions = all_global_perms
        
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
        print("Created super admin")
        
        # 4. Create Company Admin Roles with Permissions
        print("🏢 Creating company admin roles...")
        
        # Helper to copy perms
        def copy_perms_to_company(company_id):
            company_perms_list = []
            for gp in all_global_perms:
                 cp = Permission(
                    id=str(uuid.uuid4()),
                    name=gp.name,
                    company_id=company_id
                )
                 company_perms_list.append(cp)
            db.add_all(company_perms_list)
            db.commit()
            return company_perms_list

        # Company 1
        company1_perms = copy_perms_to_company(company1.id)
        company_admin_role1 = Role(
            id="role-admin-001",
            name="company_admin",
            company_id=company1.id
        )
        company_admin_role1.permissions = company1_perms
        
        # Company 2
        company2_perms = copy_perms_to_company(company2.id)
        company_admin_role2 = Role(
            id="role-admin-002",
            name="company_admin",
            company_id=company2.id
        )
        company_admin_role2.permissions = company2_perms

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
        print(f"Created company users: {company_user1.full_name}, {company_user2.full_name}")
        
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
        print(f"Created {len(stations)} bus stations")
        
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
        print(f"Created routes")
        
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
        print(f"Created route segments")
        
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
        print(f"Created buses")
        
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
        print(f"Created schedules")
        
        # 11. Create Sample Tickets
        print("🎫 Creating sample tickets...")
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
        print(f"Created sample tickets")
        
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
        print(f"Created sample payment")
        
        print("\n" + "="*50)
        print("Database seeding completed successfully!")
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

