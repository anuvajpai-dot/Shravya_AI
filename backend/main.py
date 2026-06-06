from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import base64
import asyncio
import google.generativeai as genai
from duckduckgo_search import DDGS

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
- summarize long outputs in bullet points
- when web search results are provided in context, use them for accurate and up-to-date answers, and cite the source URL(s) where relevant"""


class Message(BaseModel):
    role: str
    content: str
    image: Optional[str] = None  # base64-encoded image (data URL or raw base64)


class ChatRequest(BaseModel):
    messages: List[Message]


class ChatResponse(BaseModel):
    reply: str


async def web_search(query: str, max_results: int = 4) -> str:
    """Search DuckDuckGo and return formatted snippet results as LLM context."""
    try:
        def _search():
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=max_results))

        results = await asyncio.wait_for(asyncio.to_thread(_search), timeout=8.0)
        if not results:
            return ""
        parts = []
        for r in results:
            title = r.get("title", "")
            body = r.get("body", "")
            href = r.get("href", "")
            parts.append(f"[{title}]\n{body}\nSource: {href}")
        return "\n---\n".join(parts)
    except Exception:
        return ""


@app.get("/")
def root():
    return {"status": "Shravya AI Lite is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    last_msg = request.messages[-1] if request.messages else None
    has_image = last_msg and last_msg.image

    # Augment system prompt with live web search context for non-trivial queries
    system_prompt = SYSTEM_PROMPT
    if last_msg and last_msg.content and len(last_msg.content.split()) >= 3:
        search_results = await web_search(last_msg.content)
        if search_results:
            system_prompt = (
                SYSTEM_PROMPT
                + "\n\n[Live Web Search Results — use these for accurate, up-to-date answers]\n"
                + search_results
            )

    if has_image and GEMINI_API_KEY:
        return await chat_gemini(request, system_prompt)
    else:
        # Ollama handles all text queries and vision (if a vision model is loaded)
        return await chat_ollama(request, system_prompt)


async def chat_ollama(request: ChatRequest, system_prompt: str = SYSTEM_PROMPT) -> ChatResponse:
    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages:
        msg_dict: dict = {"role": msg.role, "content": msg.content}
        if msg.image:
            # Ollama vision format: strip data URL prefix and pass raw base64
            raw_b64 = msg.image.split(",", 1)[-1]
            msg_dict["images"] = [raw_b64]
        messages.append(msg_dict)

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


async def chat_gemini(request: ChatRequest, system_prompt: str = SYSTEM_PROMPT) -> ChatResponse:
    try:
        # Capture snapshots for use inside the thread
        messages_snapshot = list(request.messages)

        def _run_gemini():
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=system_prompt,
            )
            history = []
            for msg in messages_snapshot[:-1]:
                role = "user" if msg.role == "user" else "model"
                history.append({"role": role, "parts": [msg.content]})

            chat_session = model.start_chat(history=history)

            last_msg = messages_snapshot[-1]
            parts = []
            if last_msg.image:
                raw_b64 = last_msg.image.split(",", 1)[-1]
                image_bytes = base64.b64decode(raw_b64)
                mime = "image/jpeg"
                if last_msg.image.startswith("data:"):
                    mime = last_msg.image.split(";")[0].split(":")[1]
                parts.append({"mime_type": mime, "data": image_bytes})
            parts.append(last_msg.content)
            return chat_session.send_message(parts).text

        # Run the blocking Gemini SDK calls in a thread pool to avoid blocking the event loop
        reply = await asyncio.to_thread(_run_gemini)
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")
