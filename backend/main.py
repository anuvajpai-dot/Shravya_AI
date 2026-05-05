from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import base64
import google.generativeai as genai

app = FastAPI(title="Shravya AI Lite")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://shravya.pihudrive.lol"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2.5:1.5b")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """You are Shravya AI Lite, a helpful lightweight assistant.

Rules:
- give short and clear answers
- prioritize coding help and simple automation
- help draft emails and documentation
- keep responses concise to save tokens
- ask follow-up questions only when necessary
- use professional engineering language
- summarize long outputs in bullet points"""


class Message(BaseModel):
    role: str
    content: str
    image: Optional[str] = None  # base64-encoded image (data URL or raw base64)


class ChatRequest(BaseModel):
    messages: List[Message]


class ChatResponse(BaseModel):
    reply: str


@app.get("/")
def root():
    return {"status": "Shravya AI Lite is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Check if any message contains an image
    last_msg = request.messages[-1] if request.messages else None
    has_image = last_msg and last_msg.image

    if has_image and GEMINI_API_KEY:
        return await chat_gemini(request)
    elif has_image and not GEMINI_API_KEY:
        raise HTTPException(status_code=501, detail="Image support requires GEMINI_API_KEY to be configured.")
    else:
        return await chat_ollama(request)


async def chat_ollama(request: ChatRequest) -> ChatResponse:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    payload = {"model": MODEL_NAME, "messages": messages, "stream": False}

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            return ChatResponse(reply=data["message"]["content"])
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Cannot connect to Ollama. Make sure Ollama is running: ollama serve")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def chat_gemini(request: ChatRequest) -> ChatResponse:
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT,
        )

        # Build history (all but last message)
        history = []
        for msg in request.messages[:-1]:
            role = "user" if msg.role == "user" else "model"
            history.append({"role": role, "parts": [msg.content]})

        chat_session = model.start_chat(history=history)

        # Build the last message parts (text + optional image)
        last_msg = request.messages[-1]
        parts = []
        if last_msg.image:
            # Strip data URL prefix if present (e.g. "data:image/png;base64,...")
            raw_b64 = last_msg.image.split(",", 1)[-1]
            image_bytes = base64.b64decode(raw_b64)
            # Detect mime type from data URL or default to jpeg
            mime = "image/jpeg"
            if last_msg.image.startswith("data:"):
                mime = last_msg.image.split(";")[0].split(":")[1]
            parts.append({"mime_type": mime, "data": image_bytes})
        parts.append(last_msg.content)

        response = chat_session.send_message(parts)
        return ChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")
