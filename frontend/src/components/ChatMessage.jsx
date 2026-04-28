export default function ChatMessage({ role, content }) {
  const isUser = role === 'user'

  // Simple bold markdown rendering (**text**)
  const rendered = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

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

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm'
        }`}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  )
}
