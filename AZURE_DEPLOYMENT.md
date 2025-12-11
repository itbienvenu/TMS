# Deploying the AI Agent (MCP) to Azure

This guide walks you through deploying the `ai-service` to **Azure Container Apps**.

## Prerequisites

1. **Azure CLI**: Make sure you have `az` installed.
   ```bash
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   az login
   ```
2. **Database**: Your PostgreSQL database must be accessible from Azure (either an **Azure Database for PostgreSQL** or a public IP). *Localhost won't work from the cloud.*

## Quick Start (Script)

I have created a helper script at `scripts/deploy_ai_service_azure.sh`.

1. **Edit the script**:
   Open `scripts/deploy_ai_service_azure.sh` and fill in your actual Env Vars in the `az containerapp create` command section:
   - `DATABASE_URL`: Connection string to your cloud database.
   - `OPENAI_API_KEY`: Your key.

2. **Run it**:
   ```bash
   ./scripts/deploy_ai_service_azure.sh
   ```

## Manual Steps

If you prefer to run commands manually:

### 1. Create a Resource Group
```bash
az group create --name TicketingAI_RG --location eastus
```

### 2. Create a Container Registry (ACR)
```bash
az acr create --resource-group TicketingAI_RG --name ticketingacr123 --sku Basic --admin-enabled true
```

### 3. Build & Push Image
Builds the Dockerfile from `services/ai-service` and pushes to ACR.
```bash
az acr build --registry ticketingacr123 --image ai-service:v1 ./services/ai-service
```

### 4. Create Container App Environment
```bash
az containerapp env create --name ticketing-env --resource-group TicketingAI_RG --location eastus
```

### 5. Deploy the Service
```bash
az containerapp create \
  --name ticketing-ai \
  --resource-group TicketingAI_RG \
  --environment ticketing-env \
  --image ticketingacr123.azurecr.io/ai-service:v1 \
  --registry-server ticketingacr123.azurecr.io \
  --target-port 8007 \
  --ingress external \
  --env-vars \
    DATABASE_URL="postgresql://..." \
    OPENAI_API_KEY="sk-..."
```

## Post-Deployment

1. **Copy the URL**: The command output will show your FQDN (e.g., `https://ticketing-ai.happyhill-1234.eastus.azurecontainerapps.io`).
2. **Update Frontend**:
   - Go to `frontend/src/components/ChatWidget.tsx`
   - Go to `super-admin-dashboard/src/components/AdminChatWidget.tsx`
   - Replace `http://localhost:8008` with your new Azure URL.
3. **Redeploy Frontends**: Re-build and deploy your frontend apps so they point to the live AI service.
