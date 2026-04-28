export default function ChatMessage({ role, content, elapsed, timestamp }) {
  const isUser = role === 'user'

  // Simple bold markdown rendering (**text**)
  const rendered = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  const timeLabel = timestamp
    ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          isUser ? 'bg-blue-600' : 'bg-violet-600'
        }`}
      >
        {isUser ? 'U' : 'S'}
      </div>

      {/* Bubble + meta */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-tl-sm'
          }`}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
        {/* Timestamp + response time */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 px-1">
          {timeLabel && <span>{timeLabel}</span>}
          {!isUser && elapsed && (
            <span className="text-violet-400 font-medium">{elapsed}s</span>
          )}
        </div>
      </div>
    </div>
  )
}
