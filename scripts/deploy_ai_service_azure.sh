#!/bin/bash

RESOURCE_GROUP="TicketingSystemRG"
LOCATION="eastus"
ACR_NAME="ticketingacr$RANDOM" # Needs to be globally unique
CONTAINER_APP_NAME="ticketing-ai-agent"
IMAGE_NAME="ai-service:v1"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}1. Creating Resource Group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

echo -e "${GREEN}2. Creating Azure Container Registry (ACR)...${NC}"
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Get ACR Credentials
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "passwords[0].value" --output tsv)

echo -e "${GREEN}3. Building and Pushing Docker Image to ACR...${NC}"

az acr build --registry $ACR_NAME --image $IMAGE_NAME ./services/ai-service

echo -e "${GREEN}4. Creating Container App Environment...${NC}"
ENV_NAME="ticketing-env"
az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo -e "${GREEN}5. Deploying AI Service to Container App...${NC}"

az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image "$ACR_LOGIN_SERVER/$IMAGE_NAME" \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 8008 \
  --ingress external \
  --env-vars \
    DATABASE_URL="" \
    OPENAI_API_KEY="" \
    AZURE_OPENAI_ENDPOINT="" \
    AZURE_OPENAI_API_KEY=""

echo -e "${GREEN}Deployment Complete!${NC}"
echo "Your AI Service URL is:"
az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" --output tsv
