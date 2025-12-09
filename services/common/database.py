
# Common Database Utils
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

def get_db_engine(service_name: str):
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
