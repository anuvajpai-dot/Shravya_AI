import ShravyaLogo from './ShravyaLogo'

export default function Sidebar({ conversations, activeId, onNew, onSelect, onDelete, open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed md:relative inset-y-0 left-0 z-30
        w-72 md:w-64 shrink-0 bg-[#171717] flex flex-col h-full border-r border-white/5
        transform transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Logo + title */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <ShravyaLogo size={28} />
          <span className="font-semibold text-base text-white tracking-tight">Shravya AI</span>
        </div>

        {/* New chat */}
        <button
          onClick={onNew}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 mx-3 mb-2" />

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 chat-scroll">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-600 px-3 py-6 text-center">No conversations yet</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => { onSelect(conv.id); onClose() }}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors ${
              conv.id === activeId
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="shrink-0 opacity-60"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="flex-1 truncate">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(conv.id)
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0 p-0.5 rounded"
              title="Delete conversation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-6 h-6 rounded-full bg-violet-600/50 flex items-center justify-center text-[10px] font-bold text-violet-200">
            Q
          </div>
          <span className="text-xs text-gray-500">Qwen 2.5 · 1.5B</span>
        </div>
      </div>
    </div>
    </>
  )
}
