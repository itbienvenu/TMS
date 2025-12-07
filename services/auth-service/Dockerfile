
FROM python:3.11-slim

WORKDIR /app

COPY services/auth-service/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy common library from root context
COPY services/common ./common  
# Copy service code from root context
COPY services/auth-service .

ENV PYTHONPATH=/app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
