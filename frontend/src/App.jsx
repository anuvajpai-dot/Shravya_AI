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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  async function sendMessage(text, image = null) {
    if (!text.trim() && !image) return
    if (loading) return

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

    const userMsg = { role: 'user', content: text, image: image || undefined, timestamp: new Date().toISOString() }
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
          messages: allMessages.map(({ role, content, image }) => ({ role, content, ...(image ? { image } : {}) })),
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
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <ShravyaLogo size={22} />
          <span className="font-semibold text-sm text-white">Shravya AI</span>
          <button
            onClick={startNewChat}
            className="ml-auto text-gray-400 hover:text-white transition-colors p-1"
            aria-label="New chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {messages.length === 0 ? (
          /* ── Empty state: input centred in the middle of the screen ── */
          <div className="flex-1 flex flex-col items-center justify-center px-3 md:px-4 pb-4 md:pb-5">
            <div className="w-full max-w-2xl flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-4 text-center select-none">
                <ShravyaLogo size={56} />
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-200">How can I help you today?</h1>
                <p className="text-sm text-gray-500 max-w-xs md:max-w-sm">
                  Ask me anything — code, debugging, explanations, or just a chat.
                </p>
              </div>
              <div className="w-full">
                <InputBar onSend={sendMessage} disabled={loading} />
                <p className="text-center text-[10px] md:text-[11px] text-gray-600 mt-2">
                  Shravya AI · Qwen 2.5 1.5B · responses may be incorrect
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Chat view: messages + input pinned to bottom ── */
          <>
            <main className="flex-1 overflow-y-auto chat-scroll py-6 md:py-8">
              <div className="max-w-3xl mx-auto w-full px-3 md:px-4 space-y-6 md:space-y-8">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} {...msg} />
                ))}

                {loading && (
                  <div className="flex gap-3 items-start">
                    <div className="shrink-0 mt-0.5">
                      <ShravyaLogo size={26} />
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
            </main>

            {/* Input bar pinned to bottom */}
            <div className="px-3 md:px-4 pb-4 md:pb-5 pt-2">
              <div className="max-w-3xl mx-auto w-full">
                <InputBar onSend={sendMessage} disabled={loading} />
                <p className="text-center text-[10px] md:text-[11px] text-gray-600 mt-2">
                  Shravya AI · Qwen 2.5 1.5B · responses may be incorrect
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
