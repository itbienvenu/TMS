
# Common Database Utils
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

def get_db_engine(service_name: str):
    # Retrieve DB URL from env, or default to localhost for dev
    # Ideally, each service has its own DB, e.g. POSTGRES_USER_DB_URL, POSTGRES_AUTH_DB_URL
    # For MVP, we might share the instance but different DB names.
    
    # We expect env var: DATABASE_URL
    db_url = os.environ.get("DATABASE_URL", f"postgresql://postgres:postgres@localhost:5432/ticketing_system_{service_name}")
    engine = create_engine(db_url)
    return engine

Base = declarative_base()

def get_db_session(engine):
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
