from app.common.db import execute_read_query

import requests
import json

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
    },
    {
        "type": "function",
        "function": {
            "name": "book_ticket",
            "description": "Book a ticket for a route. Requires route_id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "route_id": {"type": "string", "description": "The UUID of the route"},
                    "bus_id": {"type": "string", "description": "The UUID of the bus (optional)"}
                },
                "required": ["route_id"]
            }
        }
    }
]

def execute_public_tool(name: str, args: dict, context: dict = None):
    if name == "search_routes":
        origin = args.get("origin").title()
        dest = args.get("destination").title()
        
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
    
    elif name == "book_ticket":
         if not context or not context.get("token"):
             return "Error: You must be logged in to book a ticket."
             
         route_id = args.get("route_id")
         bus_id = args.get("bus_id")
         user_id = context.get("user_id")
         
         if not bus_id:
             # Find a bus
             q = """
             SELECT b.id FROM buses b
             JOIN routes r ON r.company_id = b.company_id
             WHERE r.id = :rid AND b.available_seats > 0
             LIMIT 1
             """
             res = execute_read_query(q, {"rid": route_id})
             if not res:
                  return "No available buses found for this route."
             bus_id = res[0]['id']
         
         # Call API
         try:
             # Use the container name 'ticketing-service'
             url = "http://ticketing-service:8004/api/v1/tickets/"
             payload = {
                 "user_id": user_id,
                 "route_id": route_id,
                 "bus_id": str(bus_id)
             }
             headers = {
                 "Authorization": f"Bearer {context.get('token')}",
                 "Content-Type": "application/json"
             }
             
             resp = requests.post(url, json=payload, headers=headers)
             if resp.status_code in [200, 201]:
                 return f"Ticket booked successfully! Response: {resp.text}"
             else:
                 return f"Booking failed with status {resp.status_code}: {resp.text}"
         except Exception as e:
             return f"Error while booking: {str(e)}"

    return "Unknown tool."
