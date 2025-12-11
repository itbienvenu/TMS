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
            "name": "create_bus_plan",
            "description": "Suggest a plan for a new bus. DOES NOT COMMIT TO DB directly in this demo, returns a plan.",
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
        query = "SELECT plate_number, capacity, available_seats FROM buses WHERE company_id = :cid"
        results = execute_read_query(query, {"cid": company_id})
        return f"Your buses: {str(results)}"

    elif name == "create_bus_plan":
        return f"Ready to create bus with Plate {args['plate']} and Capacity {args['capacity']}. Please confirm in the dashboard UI."

    return "Unknown tool."
