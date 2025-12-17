from fastapi import FastAPI, APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
# from openai import OpenAI, AzureOpenAI (Removed)
from app.tools.public import public_tools_definitions, execute_public_tool
from app.tools.company import company_tools_definitions, execute_company_tool
from app.tools.admin import admin_tools_definitions, execute_admin_tool
from dotenv import load_dotenv

load_dotenv()

from app.common.db import get_db
from app.common.models import ChatHistory, CompanyUser, Role, Permission
from sqlalchemy.orm import Session
from sqlalchemy import desc

router = APIRouter(prefix="/api/v1/chat", tags=["AI Agent Chat"])

import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool

# Initialize Clients

USE_GEMINI = False
USE_DEEPSEEK = False
USE_GROQ = False

if os.getenv("GROQ_API_KEY"):
    from openai import OpenAI
    USE_GROQ = True
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    client = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    MODEL_NAME = "llama-3.3-70b-versatile"
    print(f"INFO: Using Groq Provider with model: {MODEL_NAME}")

elif os.getenv("DEEPSEEK_API_KEY"):
    from openai import OpenAI
    USE_DEEPSEEK = True
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
    MODEL_NAME = "deepseek-chat"
    print(f"INFO: Using DeepSeek Provider with model: {MODEL_NAME}")

elif os.getenv("GEMINI_API_KEY"):
    USE_GEMINI = True
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    MODEL_NAME = "gemini-flash-latest"
    print(f"INFO: Using Google Gemini Provider with model: {MODEL_NAME}")
    try:
        print("DEBUG: Available Gemini Models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"WARNING: Could not list models: {e}")
else:
    print("WARNING: No AI API KEY found. Using MockAI.")
    class MockMessage:
        def __init__(self, content, tool_calls=None):
            self.content = content
            self.tool_calls = tool_calls

    class MockChoice:
        def __init__(self, message):
            self.message = message

    class MockCompletion:
        def __init__(self, message):
            self.choices = [MockChoice(message)]

    class MockChat:
        def completions(self): pass
    
    class MockClient:
        def __init__(self):
            self.chat = MockChat()
            self.chat.completions = self
            
        def create(self, messages, model=None, tools=None, tool_choice=None):
            last_msg = messages[-1]['content'].lower()
            
            if tools and "bus" in last_msg and "kigali" in last_msg:
                return MockCompletion(MockMessage(
                    content=None,
                    tool_calls=[type('obj', (object,), {
                        'id': 'call_123',
                        'function': type('obj', (object,), {
                            'name': 'search_routes',
                            'arguments': '{"origin": "Kigali", "destination": "Kampala"}'
                        })()
                    })()]
                ))
            
            if tools and "ticket" in last_msg:
                 return MockCompletion(MockMessage(
                    content=None,
                    tool_calls=[type('obj', (object,), {
                        'id': 'call_124',
                        'function': type('obj', (object,), {
                            'name': 'get_ticket_status',
                            'arguments': '{"ticket_id": "123-mock-id"}'
                        })()
                    })()]
                ))

            if messages[-1]['role'] == 'tool':
                return MockCompletion(MockMessage("Based on the database, I found 3 buses available for that route."))

            return MockCompletion(MockMessage(f"I am running in MOCK MODE (No API Key). You said: {last_msg}"))

    client = MockClient()
    MODEL_NAME = "mock-gpt"

class ChatRequest(BaseModel):
    message: str
    role: str = "customer"
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}

class ChatResponse(BaseModel):
    response: str
    tool_calls: Optional[List[dict]] = None

def convert_tools_to_gemini(tools_def):
    """
    Converts OpenAI-style tool definitions to Gemini FunctionDeclarations
    """
    gemini_funcs = []
    for t in tools_def:
        f = t['function']
        
        gemini_funcs.append(FunctionDeclaration(
            name=f['name'],
            description=f['description'],
            parameters=f['parameters'] 
        ))
    return gemini_funcs

from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

SECRET_KEY = os.getenv("SECRET_KEY", "thisisaverystrongsecretkeythatilike_touse")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def get_current_user_optional(token: str = Depends(oauth2_scheme)):
    if not token:
        return None
    try:
        print(f"DEBUG: Decoding token: {token[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        # Add original token to payload for passing to downstream services
        payload["token"] = token 
        payload["user_id"] = user_id
        return payload
    except JWTError as e:
        print(f"DEBUG: JWT Error: {e}")
        return None

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_optional)):
    """
    Main chat endpoint.
    """
    # ... inside chat_endpoint ...
    
    # 1. Fetch User and Permissions if logged in
    system_prompt = (
        "You are a helpful assistant for the Bus Ticketing System. "
        "IMPORTANT: You MUST use the native tool calling capability for actions. "
        "Do NOT write JSON or text like 'tool_call' in your response content to simulate a tool call. "
        "If you need to use a tool, generate a proper tool call object. "
        "Always format your text responses in Markdown (tables, bold, lists) for better readability."
    )
    tools = []
    tool_executor = None
    user_permissions = set()
    if current_user and current_user.get("user_id"):
        user_db = db.query(CompanyUser).filter(CompanyUser.id == current_user["user_id"]).first()
        if user_db:
             # FORCE overwrite company_id from authenticated DB record to ensure security
             req.context["company_id"] = user_db.company_id
             print(f"DEBUG: Enforcing Company ID from DB: {user_db.company_id}")
             
             # Flatten permissions
             for role in user_db.roles:
                 for perm in role.permissions:
                     user_permissions.add(perm.name)
    
    # ... Role Determination ...
    if current_user:
        # If user has 'chat_with_ai' permission, grant access (mapped to company_admin logic for now but filtered)
        if "chat_with_ai" in user_permissions or "manage_ai_context" in user_permissions or "admin" in current_user.get("roles", []):
             user_role = "company_admin" # Internal role name for "Company Staff with AI Access"
        else:
             user_role = "customer" # Default to customer if no special AI permission

        req.role = user_role

    # ... Tool Selection ...
    if req.role == "customer":
        system_prompt += " You help customers find buses, check schedules, and track tickets. You DO NOT have access to private company data."
        tools = public_tools_definitions
        tool_executor = lambda name, args: execute_public_tool(name, args, req.context)
        
    elif req.role == "company_admin":
        system_prompt += f" You help company staff manage their fleet. Company ID: {req.context.get('company_id')}."
        
        
        allowed_tools = company_tools_definitions
        tools = allowed_tools
        system_prompt += f" You have access to the following tools: {[t['function']['name'] for t in tools]}."
        system_prompt += f" You have access to the following tools: {[t['function']['name'] for t in tools]}."
        
        tool_executor = lambda name, args: execute_company_tool(name, args, req.context)
    elif req.role == "super_admin":
        # ... same ...
        system_prompt += " You are the Super Admin assistant with full access to the database."
        tools = admin_tools_definitions
        tool_executor = execute_admin_tool
    else:
        pass

    if tool_executor is None:
         if not current_user:
             system_prompt += " You are a public assistant."
             tools = public_tools_definitions
             tool_executor = lambda name, args: execute_public_tool(name, args, req.context)
         else:
             raise HTTPException(status_code=400, detail="Invalid role or configuration")

    try:
        history = []
        if req.session_id:
            past_messages = db.query(ChatHistory).filter(ChatHistory.session_id == req.session_id).order_by(desc(ChatHistory.created_at)).limit(20).all()
            past_messages.reverse()

        # Save USER message to DB
        if req.session_id:
            db.add(ChatHistory(session_id=req.session_id, role="user", content=req.message))
            db.commit()

        if USE_GEMINI:
            model = genai.GenerativeModel(MODEL_NAME)
            
            gemini_tools = convert_tools_to_gemini(tools) if tools else None
            if gemini_tools:
                model = genai.GenerativeModel(MODEL_NAME, tools=[Tool(function_declarations=gemini_tools)])

            chat_history = [{"role": "user", "parts": system_prompt}]
            
            if req.session_id:
                 for msg in past_messages:
                    chat_history.append({"role": msg.role, "parts": msg.content})

            chat = model.start_chat(history=chat_history)
            
            response = chat.send_message(req.message)
            
            if response.candidates and response.candidates[0].content.parts:
                part = response.candidates[0].content.parts[0]
                
                if part.function_call:
                    fc = part.function_call
                    func_name = fc.name
                    func_args = dict(fc.args)
                    
                    try:
                        # Execute Tool
                        result = tool_executor(func_name, func_args)
                        
                        from google.ai.generativelanguage_v1beta.types import content
                        
                        function_response = {
                            "function_response": {
                                "name": func_name,
                                "response": {"result": result}
                            }
                        }
                        
                        final_res = chat.send_message([function_response])
                        
                        # Save MODEL response (after tool use) to DB
                        if req.session_id:
                            db.add(ChatHistory(session_id=req.session_id, role="model", content=final_res.text))
                            db.commit()
                            
                        return ChatResponse(response=final_res.text)
                        
                    except Exception as e:
                         return ChatResponse(response=f"Error executing tool {func_name}: {str(e)}")
            
            # Save MODEL response to DB
            if req.session_id:
                db.add(ChatHistory(session_id=req.session_id, role="model", content=response.text))
                db.commit()

            return ChatResponse(response=response.text)

        else:
            messages = [{"role": "system", "content": system_prompt}]
            
            if req.session_id:
                # Limit to 20 previous messages to allow for better context
                past_messages = db.query(ChatHistory).filter(ChatHistory.session_id == req.session_id).order_by(desc(ChatHistory.created_at)).limit(20).all()
                past_messages.reverse()

                for msg in past_messages:
                    role = "assistant" if msg.role == "model" else msg.role
                    content = msg.content
                    
                    # If this message was a massive tool output or error, skip it or truncate heavily
                    if len(content) > 200:
                         content = content[:200] + "... [truncated]"
                    
                    # Sanitize: Remove fake tool calls from history to prevent model confusion
                    if content.strip().startswith("tool_call") or "tool_call create_bus" in content:
                        continue 

                    messages.append({"role": role, "content": content})

            messages.append({"role": "user", "content": req.message})

            print(f"DEBUG: Sending {len(messages)} messages to AI.")
            # Debug total char count
            total_chars = sum(len(str(m.get('content', ''))) for m in messages)
            print(f"DEBUG: Total content chars: {total_chars}")

            # Construct arguments dynamically to avoid sending 'tool_choice': None which Groq interprets as invalid
            request_args = {
                "model": MODEL_NAME,
                "messages": messages
            }
            if tools:
                request_args["tools"] = tools
            else:
                 request_args["tool_choice"] = "none"

            print(f"DEBUG: Request Args: {json.dumps({k: v for k, v in request_args.items() if k != 'messages'}, default=str)}")
            
            completion = client.chat.completions.create(**request_args)
            
            msg = completion.choices[0].message
            
            if not msg.tool_calls:
                # Save response
                if req.session_id:
                    db.add(ChatHistory(session_id=req.session_id, role="model", content=msg.content))
                    db.commit()
                return ChatResponse(response=msg.content)

            messages.append(msg)
            
            for tool_call in msg.tool_calls:
                try:
                    args = json.loads(tool_call.function.arguments)
                    result = tool_executor(tool_call.function.name, args)
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(result)
                    })
                except Exception as e:
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": f"Error executing tool: {str(e)}"
                    })

            final_completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages
            )
            
            final_content = final_completion.choices[0].message.content
             # Save final response
            if req.session_id:
                db.add(ChatHistory(session_id=req.session_id, role="model", content=final_content))
                db.commit()

            return ChatResponse(
                response=final_content
            )

    except Exception as e:
        print(f"LLM Error: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(response=f"I'm sorry, I encountered an error connecting to the AI Provider: {str(e)}")
