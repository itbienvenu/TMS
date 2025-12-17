FROM python:3.10-slim

ENV PATH="/app/venv/bin:$PATH"

WORKDIR /app

COPY services/ai-service/requirements.txt .

RUN python3 -m venv venv

RUN ./venv/bin/pip install --no-cache-dir -r requirements.txt

COPY services/ai-service .

# Copy Shared Code (Inject into app)
COPY services/common/encryption.py app/common/
COPY services/common/middleware.py app/common/

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8008"]
