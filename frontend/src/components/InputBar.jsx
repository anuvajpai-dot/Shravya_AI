import { useState, useRef } from 'react'

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [image, setImage] = useState(null) // base64 data URL
  const fileRef = useRef(null)

  function handleSend() {
    if ((!text.trim() && !image) || disabled) return
    onSend(text.trim(), image)
    setText('')
    setImage(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result)
    reader.readAsDataURL(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Image preview */}
      {image && (
        <div className="relative w-20 h-20 ml-1">
          <img src={image} alt="attachment" className="w-full h-full object-cover rounded-xl border border-white/10" />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1a1a1a] border border-white/20 rounded-full flex items-center justify-center text-gray-400 hover:text-white text-xs"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      <div className="relative flex items-end bg-[#2f2f2f] rounded-2xl border border-white/10 focus-within:border-violet-500/50 transition-colors shadow-lg">
        {/* Image attach button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="shrink-0 ml-3 mb-3.5 text-gray-500 hover:text-gray-300 disabled:opacity-40 transition-colors"
          aria-label="Attach image"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <textarea
          className="flex-1 resize-none bg-transparent text-gray-100 placeholder-gray-500 px-3 py-4 pr-14 text-sm outline-none min-h-[56px] max-h-48 leading-relaxed"
          placeholder="Message Shravya AI…"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !image)}
          className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-gray-600 text-white transition-colors"
          aria-label="Send"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
