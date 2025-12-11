
FROM python:3.11-slim

WORKDIR /app

COPY services/super-admin-service/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/common ./common  
COPY services/super-admin-service .

ENV PYTHONPATH=/app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8007"]
