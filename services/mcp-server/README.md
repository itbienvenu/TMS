# Ticketing System MCP Server

This MCP (Model Context Protocol) server exposes the Ticketing System's data to AI assistants (like Claude). It connects directly to the system's database, allowing you to ask questions like:
- "How many active tickets are there?"
- "List all companies and their email addresses."
- "Find the user with email 'example@test.com' and show their tickets."

## Prerequisites

- Python 3.10+
- The `postgres` database container must be running (from `docker-compose-micro.yml`).

## Installation

1. Create a virtual environment and install dependencies:
   ```bash
   cd services/mcp-server
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

## Configuration

The server defaults to connecting to `localhost:5433` (the host port mapped to Postgres). If your database is on a different host or port, set the `DATABASE_URL` environment variable.

## Usage with Claude Desktop

To connect this MCP server to Claude Desktop:

1. Open your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json` (if applicable)

2. Add the following entry to the `mcpServers` object:

   ```json
   {
     "mcpServers": {
       "ticketing-system": {
         "command": "/absolute/path/to/ticketing-system/services/mcp-server/.venv/bin/python",
         "args": [
           "/absolute/path/to/ticketing-system/services/mcp-server/server.py"
         ],
         "env": {
           "DATABASE_URL": "postgresql://itbienvenu:123@localhost:5433/ticketing_system"
         }
       }
     }
   }
   ```
   *Note: Replace `/absolute/path/to/...` with your actual full path.*

3. Restart Claude Desktop.

## Usage with Other MCP Clients

You can run the server directly to test:
```bash
python server.py
```
It communicates over Stdio by default.
