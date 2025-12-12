
FROM python:3.11-slim

WORKDIR /app

COPY services/ticketing-service/requirements.txt requirements.txt
RUN python3 -m venv venv
RUN ./venv/bin/pip install --no-cache-dir -r requirements.txt

COPY services/common ./common  
COPY services/ticketing-service .

ENV PYTHONPATH=/app
ENV PATH="/app/venv/bin:$PATH"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]
