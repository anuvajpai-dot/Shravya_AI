import { useState, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatMessage from './components/ChatMessage'
import InputBar from './components/InputBar'
import ShravyaLogo from './components/ShravyaLogo'

const STORAGE_KEY = 'shravya_conversations'

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function newConversation() {
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    messages: [],
    createdAt: new Date().toISOString(),
  }
}

export default function App() {
  const [conversations, setConversations] = useState(() => loadConversations())
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const activeConv = conversations.find((c) => c.id === activeId) || null
  const messages = activeConv?.messages || []

  // Auto-scroll on new messages or loading state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  }, [conversations])

  function startNewChat() {
    const conv = newConversation()
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
  }

  function deleteConversation(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) setActiveId(null)
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return

    // Create conversation on first message if none active
    let convId = activeId
    let currentMessages = []

    if (!convId) {
      const conv = newConversation()
      convId = conv.id
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
    } else {
      currentMessages = conversations.find((c) => c.id === convId)?.messages || []
    }

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const allMessages = [...currentMessages, userMsg]

    // Set title from first user message
    const isFirstMsg = currentMessages.length === 0
    const newTitle = isFirstMsg
      ? text.slice(0, 42) + (text.length > 42 ? '…' : '')
      : undefined

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, messages: allMessages, ...(newTitle ? { title: newTitle } : {}) }
          : c
      )
    )
    setLoading(true)

    const start = performance.now()

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(({ role, content }) => ({ role, content })),
        }),
      })

      const elapsed = ((performance.now() - start) / 1000).toFixed(2)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        elapsed,
        timestamp: new Date().toISOString(),
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c
        )
      )
    } catch (err) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    role: 'assistant',
                    content: `⚠️ Error: ${err.message}`,
                    elapsed,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
            : c
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#212121] text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNew={startNewChat}
        onSelect={setActiveId}
        onDelete={deleteConversation}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Messages or empty state */}
        <main
          className={`flex-1 overflow-y-auto chat-scroll ${
            messages.length === 0 ? 'flex flex-col items-center justify-center' : 'py-8'
          }`}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-4 text-center select-none">
              <ShravyaLogo size={60} />
              <h1 className="text-2xl font-semibold text-gray-200">How can I help you today?</h1>
              <p className="text-sm text-gray-500 max-w-sm">
                Ask me anything — code, debugging, explanations, or just a chat.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 space-y-8">
              {messages.map((msg, i) => (
                <ChatMessage key={i} {...msg} />
              ))}

              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="shrink-0 mt-0.5">
                    <ShravyaLogo size={28} />
                  </div>
                  <div className="flex items-center gap-1.5 pt-2.5">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </main>

        {/* Input bar */}
        <div className="px-4 pb-5 pt-2">
          <div className="max-w-3xl mx-auto w-full">
            <InputBar onSend={sendMessage} disabled={loading} />
            <p className="text-center text-[11px] text-gray-600 mt-2">
              Shravya AI · Qwen 2.5 1.5B · responses may be incorrect
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function App() {
  const [messages, setMessages] = useState([WELCOME])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    if (!text.trim()) return

    const userMsg = { role: 'user', content: text, timestamp: new Date() }
    const history = [...messages.filter((m) => m !== WELCOME), userMsg]
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const start = performance.now()

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      })

      const elapsed = ((performance.now() - start) / 1000).toFixed(2)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Server error')
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, elapsed, timestamp: new Date() },
      ])
    } catch (err) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err.message}`, elapsed, timestamp: new Date() },
      ])
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([WELCOME])
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">S</div>
          <span className="font-semibold text-lg tracking-wide">Shravya AI Lite</span>
          <span className="text-xs text-gray-500 ml-1">Qwen 1.5B</span>
        </div>
        <button
          onClick={clearChat}
          className="text-xs text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-500 px-3 py-1 rounded-md transition"
        >
          Clear
        </button>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} elapsed={msg.elapsed} timestamp={msg.timestamp} />
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold shrink-0">S</div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <InputBar onSend={sendMessage} disabled={loading} />
    </div>
  )
}
