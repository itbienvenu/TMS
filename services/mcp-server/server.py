from mcp.server.fastmcp import FastMCP
import os
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("ticketing-system-context")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://itbienvenu:123@3.12.248.83:5433/ticketing_system")

try:
    engine = create_engine(DATABASE_URL)
except Exception as e:
    print(f"Warning: Could not create database engine: {e}")
    engine = None

@mcp.tool()
def list_tables() -> list[str]:
    """List all tables in the ticketing system database."""
    if not engine:
        return ["Error: Database connection failed."]
    try:
        inspector = inspect(engine)
        return inspector.get_table_names()
    except Exception as e:
        return [f"Error inspecting database: {str(e)}"]

@mcp.tool()
def describe_table(table_name: str) -> str:
    """Get the schema information (columns, types) for a specific table."""
    if not engine:
        return "Error: Database connection failed."
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        # Format for better readability
        schema_info = []
        for col in columns:
            schema_info.append(f"{col['name']} ({col['type']})")
        return "\n".join(schema_info)
    except Exception as e:
        return f"Error describing table: {str(e)}"

@mcp.tool()
def run_sql_query(query: str) -> str:
    """
    Execute a read-only SQL query against the database.
    Use this to retrieve data about tickets, users, companies, buses, etc.
    The query MUST start with SELECT.
    Examples:
    - "SELECT * FROM users WHERE email = 'example@email.com'"
    - "SELECT count(*) FROM tickets"
    - "SELECT name FROM companies"
    """
    if not engine:
        return "Error: Database connection failed."
    
    # Basic safety check
    if not query.strip().upper().startswith("SELECT"):
        return "Error: Only SELECT queries are allowed for safety reasons."
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text(query))
            # Convert rows to list of dicts for JSON serialization
            rows = [dict(row) for row in result.mappings()]
            return str(rows) # Return as string representation of list of dicts
    except Exception as e:
        return f"Database Query Error: {str(e)}"

if __name__ == "__main__":
    mcp.run()
