#!/bin/bash
echo "Starting Ticketing System with AI Agent..."

# Ensure .env has keys
if ! grep -q "OPENAI_API_KEY" .env && ! grep -q "AZURE_OPENAI_API_KEY" .env; then
    echo "WARNING: No OpenAI API Key found in .env!"
    echo "Please add OPENAI_API_KEY=sk-... to your .env file."
    echo "See .env.ai_example for details."
    read -p "Press Enter to continue anyway (AI will fail) or Ctrl+C to abort..."
fi

docker-compose -f docker-compose-micro.yml up -d --build ai-service
docker-compose -f docker-compose-micro.yml up -d

echo "------------------------------------------------"
echo "AI Service running on: http://localhost:8008"
echo "Frontends:"
echo " - Customer Web: http://localhost:5173 (run 'npm run dev' locally if not dockerized)"
echo " - Super Admin: http://localhost:5174 (run locally if not dockerized)"
echo " - Company App: Run via Visual Studio / dotnet run"
echo "------------------------------------------------"
