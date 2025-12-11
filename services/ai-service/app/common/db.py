import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# Use the internal docker service name if running in docker
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://itbienvenu:123@postgres:5432/ticketing_system")

engine = create_engine(DATABASE_URL)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_read_query(query: str, params: dict = None):
    """Safe helper for read-only raw SQL"""
    with engine.connect() as conn:
        from sqlalchemy import text
        result = conn.execute(text(query), params or {})
        return [dict(row) for row in result.mappings()]
