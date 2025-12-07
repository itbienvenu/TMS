import sys
import os

# Add backend directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.dbs import engine, Base
from database.models import Driver

# Create tables
Base.metadata.create_all(bind=engine)
print("Tables created/updated successfully.")
