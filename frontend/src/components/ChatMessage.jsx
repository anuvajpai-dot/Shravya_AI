import ShravyaLogo from './ShravyaLogo'

function renderContent(text) {
  // Split out fenced code blocks first
  const segments = text.split(/(```[\s\S]*?```)/g)
  return segments.map((seg, i) => {
    if (seg.startsWith('```')) {
      const inner = seg.slice(3, -3)
      // strip optional language tag on first line
      const code = inner.replace(/^[a-zA-Z0-9+\-.]*\n/, '')
      return (
        <pre
          key={i}
          className="bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 my-3 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed"
        >
          <code>{code}</code>
        </pre>
      )
    }
    // Inline formatting
    const html = seg
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[0.8em] font-mono">$1</code>')
    return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
  })
}

export default function ChatMessage({ role, content, image, elapsed, timestamp }) {
  const isUser = role === 'user'

  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] md:max-w-[80%]">
          {image && (
            <div className="mb-2 flex justify-end">
              <img src={image} alt="attachment" className="max-w-[220px] max-h-[220px] rounded-xl border border-white/10 object-cover" />
            </div>
          )}
          {content && (
            <div className="bg-[#2f2f2f] text-gray-100 px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          )}
          {timeLabel && (
            <p className="text-[10px] text-gray-600 mt-1 text-right px-1">{timeLabel}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 mt-0.5">
        <ShravyaLogo size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm leading-relaxed text-gray-100">{renderContent(content)}</div>
        <div className="flex items-center gap-2 mt-1.5">
          {timeLabel && <span className="text-[10px] text-gray-600">{timeLabel}</span>}
          {elapsed && <span className="text-[10px] text-violet-500 font-medium">{elapsed}s</span>}
        </div>
      </div>
    </div>
  )
}
