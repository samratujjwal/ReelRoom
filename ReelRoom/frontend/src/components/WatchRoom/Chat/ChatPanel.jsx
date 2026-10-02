import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';

const EMOJI_REACTIONS = ['❤️', '🔥', '🎉', '😮', '😂', '👏', '🚀', '💯'];

export const ChatPanel = () => {
  const { chatMessages, emitSendMessage, emitSendReaction } = useRoom();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      emitSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const getRoleBadge = (role) => {
    const base = 'role-badge';
    switch (role) {
      case 'Host':
        return <span className={`${base} bg-coral/10 text-coraldeep border-coral/25`}>Host</span>;
      case 'Moderator':
        return <span className={`${base} bg-forest/10 text-forest border-forest/20`}>Mod</span>;
      case 'Viewer':
        return <span className={`${base} bg-sand/60 text-inksoft border-ink/15`}>Viewer</span>;
      case 'Participant':
      default:
        return <span className={`${base} bg-ink/5 text-inksoft border-ink/15`}>Participant</span>;
    }
  };

  return (
    <div className="flex flex-col h-[480px] lg:h-[560px] card overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3.5 bg-parchment/60 border-b hairline flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-forest" />
          <h3 className="font-display text-base font-semibold text-ink">Room chat</h3>
        </div>
        <span className="text-[11px] font-mono text-inksoft tabular-nums">{chatMessages.length}</span>
      </div>

      {/* Reaction Bar */}
      <div className="px-3 py-2.5 bg-cream border-b hairline flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] text-inksoft uppercase tracking-widest font-bold shrink-0">React</span>
        <div className="flex items-center gap-1">
          {EMOJI_REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => emitSendReaction(emoji)}
              aria-label={`Send reaction ${emoji}`}
              className="w-8 h-8 rounded-lg hover:bg-parchment hover:scale-110 flex items-center justify-center text-base transition-all active:scale-95 shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-cream">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-11 h-11 rounded-2xl bg-forest/10 border border-forest/15 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-forest" />
            </div>
            <p className="font-display text-base font-semibold text-ink">The room is quiet…</p>
            <p className="text-xs text-inksoft mt-1">Say hello — or send a reaction instead.</p>
          </div>
        ) : (
          chatMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${msg.isSystem ? 'px-3 py-2 rounded-xl bg-forest/5 border border-forest/10 text-center' : ''}`}
            >
              {msg.isSystem ? (
                <span className="text-[11px] text-forest font-medium">⚡ {msg.text}</span>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-ink truncate">{msg.username}</span>
                      {getRoleBadge(msg.role)}
                    </div>
                    <span className="text-[10px] text-ink/40 font-mono shrink-0 tabular-nums">{msg.timestamp}</span>
                  </div>
                  <p className="text-[13px] text-ink bg-parchment/70 px-3 py-2.5 rounded-xl rounded-tl-sm border hairline leading-relaxed break-words">
                    {msg.text}
                  </p>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-parchment/60 border-t hairline flex items-center gap-2 shrink-0">
        <label htmlFor="chat-input" className="sr-only">Type a message</label>
        <input
          id="chat-input"
          type="text"
          placeholder="Type a message…"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          className="field !py-2.5 flex-1"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          aria-label="Send message"
          className="btn-primary !p-2.5 !rounded-xl shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
