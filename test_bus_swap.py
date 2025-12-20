
import requests
import json
import sys

# Configuration
AUTH_URL = "http://localhost:8001/api/v1/auth/company/login"
COMPANY_URL = "http://localhost:8003/api/v1"

ADMIN_EMAIL = "admin@kbs.rw"
ADMIN_PASSWORD = "password123"

def main():
    print("--- Testing Bus Swap Logic ---")
    
    # 1. Login
    print("[1] Logging in...")
    try:
    # Try both fields to be safe against old/new versions
        resp = requests.post(AUTH_URL, json={"login_email": ADMIN_EMAIL, "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            sys.exit(1)
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Logged in.")
    except Exception as e:
        print(f"❌ Failed to reach auth service: {e}")
        sys.exit(1)

    # 2. Setup Data (We need a schedule)
    # For this test to be robust without creating garbage, 
    # we ideally creating a mock bus and schedule, but that's complex.
    # We will try to fetch an existing schedule and an existing bus.
    
    print("[2] Fetching Schedules...")
    schedules_resp = requests.get(f"{COMPANY_URL}/schedules", headers=headers)
    if schedules_resp.status_code != 200:
        print(f"Failed to fetch schedules: {schedules_resp.text}")
        sys.exit(1)
        
    schedules = schedules_resp.json()
    if not schedules:
        print("⚠️ No schedules found. Cannot test swap.")
        # Create a schedule? Skipping for now as user likely has seed data.
        sys.exit(0)
    
    target_schedule = schedules[0]
    schedule_id = target_schedule["id"]
    current_bus_id = target_schedule["bus_id"]
    
    print(f"✅ Found Schedule: {schedule_id}")
    print(f"   Current Bus: {current_bus_id}")

    # 3. Find a DIFFERENT Bus
    print("[3] Fetching Buses...")
    buses_resp = requests.get(f"{COMPANY_URL}/buses", headers=headers)
    buses = buses_resp.json()
    
    new_bus = None
    for bus in buses:
        if bus["id"] != current_bus_id:
            new_bus = bus
            break
            
    if not new_bus:
        print("⚠️ No alternative bus found into company. Cannot test swap.")
        sys.exit(0)
        
    print(f"✅ Found Target Bus for Swap: {new_bus['plate_number']} (ID: {new_bus['id']})")
    
    # 4. Attempt Swap
    print(f"[4] Attempting to swap Schedule {schedule_id} to Bus {new_bus['plate_number']}...")
    
    swap_payload = {
        "new_bus_id": new_bus["id"]
    }
    
    swap_resp = requests.post(
        f"{COMPANY_URL}/schedules/{schedule_id}/swap-bus",
        json=swap_payload,
        headers=headers
    )
    
    if swap_resp.status_code == 200:
        data = swap_resp.json()
        print("✅ SWAP SUCCESSFUL!")
        print(json.dumps(data, indent=2))
        
        # Verify
        print("[5] Verifying...")
        verify_resp = requests.get(f"{COMPANY_URL}/schedules/{schedule_id}", headers=headers)
        updated_schedule = verify_resp.json()
        
        if updated_schedule["bus_id"] == new_bus["id"]:
            print("✅ Verification Passed: Schedule now points to new bus.")
        else:
            print("❌ Verification Failed: Schedule still points to old bus (or other).")
    else:
        print(f"❌ Swap Failed: {swap_resp.status_code}")
        print(swap_resp.text)

if __name__ == "__main__":
    main()
