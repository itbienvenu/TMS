import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Company, CompanyUser, Role
from passlib.hash import bcrypt
import uuid

# Configuration
# By default, use the internal docker network URL if running inside container
DATABASE_URL = "postgresql://itbienvenu:123@postgres:5432/ticketing_system" 

# Agent Details
AGENT_EMAIL = "agent@kbs.rw"
AGENT_FULL_NAME = "KBS Agent"
AGENT_PHONE = "0788888899"
AGENT_PASSWORD = "agent123"
ROLE_NAME = "agent"

def seed_agent():
    print("--- Starting Agent Seeding (Direct DB) ---")
    
    # 1. Connect to Database
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        print("✅ Connected to database.")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)

    try:
        # 2. Find Company (Assume first company available or "Kigali Bus Service")
        # You can customize this to find a specific company by name if needed
        company = db.query(Company).first()
        if not company:
            print("❌ No company found in the database. Please create a company first.")
            sys.exit(1)
        
        print(f"✅ Found Company: {company.name} (ID: {company.id})")

        # 3. Create or Get 'agent' Role
        # Note: Role name is unique per company logically, but schema allows duplicates potentially if no unique constraint
        # We filter by name AND company_id
        role = db.query(Role).filter(Role.name == ROLE_NAME, Role.company_id == company.id).first()
        
        if not role:
            print(f"ℹ️ Role '{ROLE_NAME}' does not exist. Creating...")
            role = Role(
                id=str(uuid.uuid4()),
                name=ROLE_NAME,
                company_id=company.id
            )
            db.add(role)
            db.commit()
            db.refresh(role)
            print(f"✅ Created Role: {role.name}")
        else:
            print(f"✅ Role '{ROLE_NAME}' already exists.")

        # 4. Create or Get Agent User
        # Check by email or login_email
        agent_user = db.query(CompanyUser).filter(CompanyUser.email == AGENT_EMAIL).first()
        
        if not agent_user:
            print(f"ℹ️ User '{AGENT_EMAIL}' does not exist. Creating...")
            hashed_password = bcrypt.hash(AGENT_PASSWORD)
            
            agent_user = CompanyUser(
                id=str(uuid.uuid4()),
                full_name=AGENT_FULL_NAME,
                email=AGENT_EMAIL,
                login_email=AGENT_EMAIL, # Use email as login_email
                phone_number=AGENT_PHONE,
                password_hash=hashed_password,
                company_id=company.id
            )
            
            # append role
            agent_user.roles.append(role)
            
            db.add(agent_user)
            db.commit()
            print(f"✅ Created Agent User: {agent_user.email} (Password: {AGENT_PASSWORD})")
            print(f"✅ Assigned Role '{ROLE_NAME}' to user.")
            
        else:
            print(f"ℹ️ User '{AGENT_EMAIL}' already exists.")
            # Ensure role is assigned
            if role not in agent_user.roles:
                print(f"ℹ️ Assigning missing role '{ROLE_NAME}'...")
                agent_user.roles.append(role)
                db.commit()
                print("✅ Role assigned.")
            else:
                print(f"✅ User already has role '{ROLE_NAME}'.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        db.rollback()
    finally:
        db.close()
        print("--- Seeding Complete ---")

if __name__ == "__main__":
    seed_agent()
