from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from .encryption import decrypt_payload
import json

class EncryptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only check POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            encrypted_header = request.headers.get("x-encrypted-body") # Headers are case-insensitive, get returns value
            print(f"DEBUG: Middleware method={request.method} header={encrypted_header} url={request.url}")
            
            if encrypted_header == "true":
                try:
                    # Consuming body to decrypt
                    body_bytes = await request.body()
                    if not body_bytes:
                         return await call_next(request)
                         
                    body_json = json.loads(body_bytes)
                    if "encrypted_data" in body_json:
                        payload = body_json["encrypted_data"]
                        decrypted_data = decrypt_payload(payload)
                        if decrypted_data is None:
                            return JSONResponse({"detail": "Decryption failed"}, status_code=400)
                        
                        # Replace body with decrypted data
                        # We must reset the receive channel so downstream reads the new body
                        new_body_bytes = json.dumps(decrypted_data).encode()
                        
                        # Define a new receive awaitable
                        async def new_receive():
                            return {"type": "http.request", "body": new_body_bytes, "more_body": False}
                        
                        request._receive = new_receive
                        
                except Exception as e:
                    # If parsing fails or anything goes wrong, we let it pass? 
                    # Or block? If X-Encrypted-Body is true, we should probably block on failure.
                    print(f"Middleware Decryption Error: {e}")
                    return JSONResponse({"detail": f"Decryption Middleware Error: {str(e)}"}, status_code=400)

        response = await call_next(request)
        return response
