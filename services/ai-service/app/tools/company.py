from app.common.db import execute_read_query, engine
from sqlalchemy import text

company_tools_definitions = [
    {
        "type": "function",
        "function": {
            "name": "list_my_buses",
            "description": "List all buses belonging to the authenticated company.",
            "parameters": {
                "type": "object",
                "properties": {},
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_bus",
            "description": "Create a new bus in the database. Requires plate number and capacity.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plate": {"type": "string"},
                    "capacity": {"type": "integer"}
                },
                "required": ["plate", "capacity"]
            }
        }
    }
]

def execute_company_tool(name: str, args: dict, context: dict):
    company_id = context.get("company_id")
    if not company_id:
        return "Error: No company context found."

    if name == "list_my_buses":
        print(f"DEBUG: list_my_buses called for cid={company_id}")
        query = "SELECT plate_number, capacity, available_seats FROM buses WHERE company_id = :cid"
        results = execute_read_query(query, {"cid": company_id})
        
        print(f"DEBUG: execute_read_query returned {len(results)} rows: {results}")
        if not results:
            return f"No buses found for your company (ID: {company_id}). Debug: Query returned 0 results."

        # Format as Markdown Table
        md = "| Plate Number | Capacity | Available Seats |\n|---|---|---|\n"
        for row in results:
            # Row is likely a tuple or dict depending on sqlalchemy driver. 
            # execute_read_query usually returns KeyedTuple or similar.
            # Safe access:
            p = row._mapping['plate_number'] if hasattr(row, '_mapping') else row[0]
            c = row._mapping['capacity'] if hasattr(row, '_mapping') else row[1]
            a = row._mapping['available_seats'] if hasattr(row, '_mapping') else row[2]
            md += f"| {p} | {c} | {a} |\n"
            
        return f"Here are your buses:\n\n{md}"

    elif name == "create_bus":
        plate = args.get('plate')
        capacity = args.get('capacity')
        
        # Validation checks could go here
        
        insert_query = """
        INSERT INTO buses (id, plate_number, capacity, available_seats, company_id, created_at, updated_at)
        VALUES (uuid_generate_v4(), :plate, :cap, :cap, :cid, NOW(), NOW())
        RETURNING id
        """
        
        try:
            # We need to use a connection that commits
            from sqlalchemy import text
            with engine.connect() as conn:
                result = conn.execute(text(insert_query), {"plate": plate, "cap": capacity, "cid": company_id})
                conn.commit()
                new_id = result.fetchone()[0]
            return f"Success! Created new bus with Plate {plate} and Capacity {capacity}. Bus ID: {new_id}"
        except Exception as e:
            return f"Failed to create bus: {str(e)}"

    return "Unknown tool."
