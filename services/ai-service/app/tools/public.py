from app.common.db import execute_read_query

public_tools_definitions = [
    {
        "type": "function",
        "function": {
            "name": "search_routes",
            "description": "Search for bus routes based on origin and destination names.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {"type": "string", "description": "The starting city or station name (e.g. 'Kigali')"},
                    "destination": {"type": "string", "description": "The destination city or station name (e.g. 'Kampala')"},
                },
                "required": ["origin", "destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ticket_status",
            "description": "Check the status of a specific ticket by ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticket_id": {"type": "string", "description": "UUID of the ticket"}
                },
                "required": ["ticket_id"]
            }
        }
    }
]

def execute_public_tool(name: str, args: dict):
    if name == "search_routes":
        origin = args.get("origin").title()
        dest = args.get("destination").title()
        
        # This is a raw SQL query equivalent to what the logic would do
        # Optimally we would match names fuzzily, but simple ILIKE is fine for MVP
        query = """
        SELECT r.id, r.price, 
               bs_start.name as origin, 
               bs_end.name as destination,
               c.name as company_name
        FROM routes r
        JOIN bus_stations bs_start ON r.origin_id = bs_start.id
        JOIN bus_stations bs_end ON r.destination_id = bs_end.id
        JOIN companies c ON r.company_id = c.id
        WHERE bs_start.name ILIKE :origin AND bs_end.name ILIKE :dest
        """
        results = execute_read_query(query, {"origin": f"%{origin}%", "dest": f"%{dest}%"})
        
        if not results:
            return f"No routes found from {origin} to {dest}."
        
        return f"Found {len(results)} routes: {str(results)}"

    elif name == "get_ticket_status":
        t_id = args.get("ticket_id")
        query = """
        SELECT t.id, t.status, t.mode, bs_start.name as from, bs_end.name as to
        FROM tickets t
        LEFT JOIN routes r ON t.route_id = r.id
        LEFT JOIN bus_stations bs_start ON r.origin_id = bs_start.id
        LEFT JOIN bus_stations bs_end ON r.destination_id = bs_end.id
        WHERE t.id = :tid
        """
        results = execute_read_query(query, {"tid": t_id})
        if not results:
            return "Ticket not found."
        return str(results[0])
    
    return "Unknown tool."
