import { useState } from 'react'

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('')

  function handleSend() {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative flex items-end bg-[#2f2f2f] rounded-2xl border border-white/10 focus-within:border-violet-500/50 transition-colors shadow-lg">
      <textarea
        className="flex-1 resize-none bg-transparent text-gray-100 placeholder-gray-500 px-4 py-4 pr-14 text-sm outline-none min-h-[56px] max-h-48 leading-relaxed"
        placeholder="Message Shravya AI…"
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-gray-600 text-white transition-colors"
        aria-label="Send"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  )
}
