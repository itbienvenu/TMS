# AI Agent Service Setup

This service acts as the brain of your Ticketing System, allowing customers, companies, and admins to purely ask questions to interact with the system.

## 1. Environment Configuration

To enable the AI capabilities, you must provide an LLM API Key in the root `.env` file or specifically for the `ai-service` container.

**Option A: Standard OpenAI**
```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL_NAME=gpt-4o
```

**Option B: Azure OpenAI** (Preferred for Enterprise)
```bash
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

## 2. Running the Service

The service is included in `docker-compose-micro.yml`.
```bash
docker-compose -f docker-compose-micro.yml up -d --build ai-service
```
Service runs on port **8007**.

## 3. Architecture

- **Public Chat (Customers)**: 
    - Limited to searching routes and checking own ticket status.
    - No access to sensitive company data.
- **Company Chat (Staff)**:
    - Can list fleet, suggest schedules, draft new bus plans.
    - Context-aware (knows which company is asking).
- **Admin Chat (Super Admin)**:
    - Full SQL READ access for analytics.
    - Can query cross-company data.

## 4. Frontend Integration

Two Chat Widgets have been installed:
1. **Public Website (`frontend/`)**: Bottom-right floating button using specific "Customer" role.
2. **Admin Dashboard (`super-admin-dashboard/`)**: Floating "System AI" button using "Super Admin" role.

## 5. Deploying to Azure

1. **Push the Image**: Build `services/ai-service` and push to Azure Container Registry (ACR).
2. **Create Container App**: Deploy the image to Azure Container Apps.
3. **Environment**: Set the Database URL and OpenAI Keys in the Container App settings.
   - *Note*: For valid connection, the Container App needs VNet integration to reach your Postgres DB if it is internal, or allow public access (secured) to Postgres.
4. **Update Frontends**: Change `http://localhost:8007` in `ChatWidget.tsx` and `AdminChatWidget.tsx` to  new Azure Main URL (e.g. `https://ticketing-ai.azurecontainerapps.io`).
