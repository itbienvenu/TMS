from sqlalchemy.orm import Session
from database.dbs import SessionLocal, engine
from database.models import Permission
import uuid

# Define the permissions list with provided IDs
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

# De-duplicate the list (keeping the first occurrence of logic, though IDs provided are unique in the user's snippet?)
# Actually user pasted the list twice with same IDs. I'll just use a dict to dedupe by ID.
deduped = {}
for pid, pname in permissions_data:
    deduped[pid] = pname

def seed_permissions():
    db = SessionLocal()
    try:
        print("Seeding permissions...")
        for pid, pname in deduped.items():
            # Check if exists by ID
            exists = db.query(Permission).filter(Permission.id == pid).first()
            if not exists:
                # Also check by Name (if we want to reuse existing)? 
                # User specified IDs, so we enforce them.
                # However, name should probably be unique per company (or global).
                # Check if global permission with this name exists but different ID?
                existing_name = db.query(Permission).filter(Permission.name == pname, Permission.company_id == None).first()
                if existing_name:
                    print(f"Skipping {pname} (exists with different ID)")
                    continue

                perm = Permission(
                    id=pid,
                    name=pname,
                    company_id=None # Global permission
                )
                db.add(perm)
                print(f"Added permission: {pname}")
            else:
                print(f"Permission {pname} already exists.")
        
        db.commit()
        print("Seeding complete.")
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_permissions()
