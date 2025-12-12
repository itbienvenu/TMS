FROM python:3.10-slim

ENV PATH="/app/venv/bin:$PATH"

WORKDIR /app

COPY requirements.txt .

RUN python3 -m venv venv

RUN ./venv/bin/pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8008"]
