from app.common.db import execute_read_query

admin_tools_definitions = [
    {
        "type": "function",
        "function": {
            "name": "run_sql_query",
            "description": "Run a read-only SQL query on the system. Use widely for analytics.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The SQL query string"}
                },
                "required": ["query"]
            }
        }
    }
]

def execute_admin_tool(name: str, args: dict):
    if name == "run_sql_query":
        q = args.get("query")
        if not q.strip().upper().startswith("SELECT"):
            return "Error: Restricted to SELECT queries only."
        try:
            results = execute_read_query(q)
            return str(results)
        except Exception as e:
            return f"SQL Error: {e}"
            
    return "Unknown tool."
