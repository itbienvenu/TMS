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

router = APIRouter(prefix="/api/v1/chat", tags=["AI Agent Chat"])

import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool

# Initialize Clients
print(f"DEBUG: GEMINI_API_KEY='{os.getenv('GEMINI_API_KEY')}'")

USE_GEMINI = False

if os.getenv("GEMINI_API_KEY"):
    USE_GEMINI = True
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    MODEL_NAME = "gemini-2.0-flash"
    print(f"INFO: Using Google Gemini Provider with model: {MODEL_NAME}")
    try:
        print("DEBUG: Available Gemini Models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"WARNING: Could not list models: {e}")
else:
    print("WARNING: No GEMINI_API_KEY found. Using MockAI.")
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

            return MockCompletion(MockMessage(f"I am running in MOCK MODE (No Gemini Key). You said: {last_msg}"))

    client = MockClient()
    MODEL_NAME = "mock-gpt"

class ChatRequest(BaseModel):
    message: str
    role: str = "customer"
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

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """
    Main chat endpoint.
    """
    system_prompt = "You are a helpful AI assistant for a Bus Ticketing System."
    tools = []
    tool_executor = None

    # Role-Based Config
    if req.role == "customer":
        system_prompt += " You help customers find buses, check schedules, and track tickets. You DO NOT have access to private company data."
        tools = public_tools_definitions
        tool_executor = execute_public_tool
    elif req.role == "company_admin":
        system_prompt += f" You help company staff manage their fleet. Company ID: {req.context.get('company_id')}."
        tools = company_tools_definitions
        tool_executor = lambda name, args: execute_company_tool(name, args, req.context)
    elif req.role == "super_admin":
        system_prompt += " You are the Super Admin assistant with full access to the database."
        tools = admin_tools_definitions
        tool_executor = execute_admin_tool
    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    try:
        if USE_GEMINI:
            # --- GEMINI PATH ---
            model = genai.GenerativeModel(MODEL_NAME)
            
            gemini_tools = convert_tools_to_gemini(tools) if tools else None
            if gemini_tools:
                model = genai.GenerativeModel(MODEL_NAME, tools=[Tool(function_declarations=gemini_tools)])

            chat = model.start_chat(history=[
                {"role": "user", "parts": system_prompt}
            ])
            
            response = chat.send_message(req.message)
            
            # Check for function calls
            # Gemini response.candidates[0].content.parts[0].function_call
            if response.candidates and response.candidates[0].content.parts:
                part = response.candidates[0].content.parts[0]
                
                if part.function_call:
                    fc = part.function_call
                    func_name = fc.name
                    func_args = dict(fc.args)
                    
                    try:
                        # Execute Tool
                        result = tool_executor(func_name, func_args)
                        
                        # Send result back
                        # Gemini expects a FunctionResponse
                        from google.ai.generativelanguage_v1beta.types import content
                        
                        function_response = {
                            "function_response": {
                                "name": func_name,
                                "response": {"result": result}
                            }
                        }
                        
                        final_res = chat.send_message([function_response])
                        return ChatResponse(response=final_res.text)
                        
                    except Exception as e:
                         return ChatResponse(response=f"Error executing tool {func_name}: {str(e)}")
            
            return ChatResponse(response=response.text)

        else:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ]

            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                tools=tools if tools else None,
                tool_choice="auto" if tools else None
            )
            
            msg = completion.choices[0].message
            
            if not msg.tool_calls:
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
            
            return ChatResponse(
                response=final_completion.choices[0].message.content
            )

    except Exception as e:
        print(f"LLM Error: {e}")
        return ChatResponse(response="I'm sorry, I encountered an error connecting to the AI Provider (Gemini). Please check server logs.")
