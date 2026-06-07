from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import base64
import asyncio
from datetime import datetime, timezone
import psutil
import google.generativeai as genai
from tavily import AsyncTavilyClient

app = FastAPI(title="Shravya AI Lite")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://shravya.pihudrive.lol,https://shravya-ai.vercel.app"
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
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

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


def get_system_info() -> str:
    """Return a compact snapshot of current system resources."""
    cpu = psutil.cpu_percent(interval=0.2)
    freq = psutil.cpu_freq()
    freq_str = f"{freq.current:.0f} MHz" if freq else "unknown"
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    disk = psutil.disk_usage('/')
    uptime_secs = int(datetime.now().timestamp() - psutil.boot_time())
    h, rem = divmod(uptime_secs, 3600)
    m, s = divmod(rem, 60)
    uptime_str = f"{h}h {m}m {s}s"
    temps = ""
    try:
        t = psutil.sensors_temperatures()
        if t:
            first = next(iter(t.values()))
            if first:
                temps = f"  CPU temp: {first[0].current:.1f}°C\n"
    except Exception:
        pass
    return (
        f"  CPU usage: {cpu}% @ {freq_str}\n"
        f"  RAM: {mem.used/1024**3:.1f} GB used / {mem.total/1024**3:.1f} GB total ({mem.percent}%)\n"
        f"  Swap: {swap.used/1024**3:.1f} GB / {swap.total/1024**3:.1f} GB\n"
        f"  Disk (/): {disk.used/1024**3:.1f} GB used / {disk.total/1024**3:.1f} GB total ({disk.percent}%)\n"
        + temps +
        f"  System uptime: {uptime_str}"
    )


async def web_search(query: str, max_results: int = 4) -> str:
    """Search via Tavily and return formatted snippet results as LLM context."""
    if not TAVILY_API_KEY:
        return ""
    try:
        client = AsyncTavilyClient(api_key=TAVILY_API_KEY)
        response = await asyncio.wait_for(
            client.search(query, max_results=max_results, search_depth="basic"),
            timeout=10.0,
        )
        results = response.get("results", [])
        if not results:
            return ""
        parts = []
        for r in results:
            title = r.get("title", "")
            body = r.get("content", "")
            href = r.get("url", "")
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


SEARCH_TRIGGERS = (
    "latest", "current", "today", "news", "price", "stock", "weather",
    "who is", "what is", "when did", "when is", "where is", "how much",
    "score", "result", "release", "update", "version", "announced",
    "happened", "trending", "recent", "now", "live",
)


def needs_web_search(text: str) -> bool:
    lower = text.lower()
    # Skip for system/resource queries — already answered by injected system info
    skip_patterns = ("cpu", "ram", "memory", "disk", "uptime", "system", "server")
    if any(p in lower for p in skip_patterns):
        return False
    return any(t in lower for t in SEARCH_TRIGGERS)


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    last_msg = request.messages[-1] if request.messages else None
    has_image = last_msg and last_msg.image

    # Always inject current datetime and live system resources
    now_utc = datetime.now(timezone.utc)
    datetime_context = (
        f"Current date/time: {now_utc.strftime('%A, %B %d, %Y %H:%M:%S UTC')} "
        f"(CEST=UTC+2: {(now_utc.astimezone()).strftime('%H:%M')} if in Central Europe)"
    )
    system_info = await asyncio.to_thread(get_system_info)
    system_prompt = SYSTEM_PROMPT + f"\n\n[System Info]\n{datetime_context}\n{system_info}"
    if last_msg and last_msg.content and needs_web_search(last_msg.content):
        search_results = await web_search(last_msg.content)
        if search_results:
            system_prompt += (
                "\n\n[Live Web Search Results — use these for accurate, up-to-date answers]\n"
                + search_results
            )

    if has_image and GEMINI_API_KEY:
        try:
            return await chat_gemini(request, system_prompt)
        except HTTPException as e:
            if e.status_code in (429, 503):
                # Rate-limited — Ollama is text-only, so strip image and notify user
                text = last_msg.content.strip() if last_msg.content.strip() else "(no text)"
                stripped = [
                    Message(role=m.role, content=m.content)
                    for m in request.messages
                ]
                note = (
                    "⚠️ Image processing is temporarily unavailable (Gemini rate limit). "
                    "I can only process your text right now.\n\n"
                )
                stripped[-1] = Message(role="user", content=note + text)
                stripped_req = ChatRequest(messages=stripped)
                return await chat_ollama(stripped_req, system_prompt)
            raise
    elif has_image and not GEMINI_API_KEY:
        raise HTTPException(status_code=501, detail="Image support requires GEMINI_API_KEY to be configured.")
    else:
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

    payload = {"model": MODEL_NAME, "messages": messages, "stream": False, "options": {"num_predict": 400}}

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
        err = str(e)
        # 429 Resource Exhausted = rate limit; raise as 429 so caller can fall back
        if "429" in err or "Resource has been exhausted" in err or "RESOURCE_EXHAUSTED" in err:
            raise HTTPException(status_code=429, detail="Gemini rate limit reached — falling back to Ollama")
        raise HTTPException(status_code=500, detail=f"Gemini error: {err}")
