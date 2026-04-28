import { useState, useRef, useEffect } from 'react'
import ChatMessage from './components/ChatMessage'
import InputBar from './components/InputBar'

const WELCOME = {
  role: 'assistant',
  content: 'Hi! I am **Shravya AI Lite** — your lightweight coding assistant. How can I help you today?',
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
