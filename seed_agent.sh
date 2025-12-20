#!/bin/bash

# Configuration
# Adjust these URLs if your services are running on different ports or hosts on the VM
AUTH_SERVICE_URL="http://localhost:8001"
COMPANY_SERVICE_URL="http://localhost:8003"

ADMIN_EMAIL="admin@kbs.rw"
ADMIN_PASSWORD="password123"

# Agent Details
AGENT_EMAIL="agent@kbs.rw"
AGENT_PASSWORD="agent123"
AGENT_NAME="KBS Agent VM"
AGENT_PHONE="0788888899"

echo "=========================================="
echo "Starting Agent Seeding Script"
echo "=========================================="

# 1. Login to get Token
echo "[1/3] Logging in as Admin ($ADMIN_EMAIL)..."

# We use grep/cut to extract token to avoid 'jq' dependency, though 'jq' is preferred if installed.
RESPONSE=$(curl -s -X POST "$AUTH_SERVICE_URL/api/v1/auth/company/login" \
  -H "Content-Type: application/json" \
  -d "{\"login_email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

# Extract access_token
TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ ${#TOKEN} -lt 10 ]; then
  echo "❌ Login failed."
  echo "Response from server: $RESPONSE"
  exit 1
fi

echo "✅ Login successful. Token obtained."

# 2. Create Agent Role
echo "------------------------------------------"
echo "[2/3] Creating 'agent' role..."

ROLE_RESPONSE=$(curl -s -X POST "$COMPANY_SERVICE_URL/api/v1/roles/create_role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "agent"}')

if [[ "$ROLE_RESPONSE" == *"created successfully"* ]] || [[ "$ROLE_RESPONSE" == *"already exists"* ]]; then
     echo "✅ Role 'agent' processed."
else
     # Note: If role already exists, generic 400 might return. 
     # You might want to ignore error if it's "Role name already exists"
     echo "ℹ️ Role creation response: $ROLE_RESPONSE"
fi

# 3. Create Agent User
echo "------------------------------------------"
echo "[3/3] Creating Agent User ($AGENT_EMAIL)..."

USER_RESPONSE=$(curl -s -X POST "$COMPANY_SERVICE_URL/api/v1/companies/company-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"email\": \"$AGENT_EMAIL\",
    \"full_name\": \"$AGENT_NAME\",
    \"phone_number\": \"$AGENT_PHONE\",
    \"password\": \"$AGENT_PASSWORD\",
    \"role_name\": \"agent\"
  }")

if [[ "$USER_RESPONSE" == *"created successfully"* ]]; then
  echo "✅ Agent user created successfully."
else
  echo "ℹ️ User creation response: $USER_RESPONSE"
fi

echo "=========================================="
echo "Seeding Complete."
