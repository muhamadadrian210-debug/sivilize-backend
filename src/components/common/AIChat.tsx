import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { getAIService } from '../../services/aiService';
import { useStore } from '../../store/useStore';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const AIChat = () => {
  const { activeTab } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Halo! Saya asisten AI SIVILIZE HUB PRO. Tanya apa saja seputar RAB, material, AHSP, atau konstruksi.' }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const aiService = getAIService('id');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      aiService.setUserContext({
        currentPage: activeTab,
        lastAction: 'chat',
        hasMultipleProjects: false,
      });
      const response = await aiService.getResponse(userText);
      setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Maaf, terjadi error. Silakan coba lagi.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover transition-all hover:scale-110"
          title="Tanya AI"
        >
          <MessageCircle size={24} className="text-white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[520px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-white" />
              <div>
                <p className="text-white font-bold text-sm">SIVILIZE AI</p>
                <p className="text-white/70 text-xs">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={14} className="text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-background border border-border text-white rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center shrink-0 mt-1">
                    <User size={14} className="text-text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-primary" />
                </div>
                <div className="bg-background border border-border px-3 py-2 rounded-xl rounded-bl-none">
                  <Loader2 size={16} className="text-primary animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Tanya seputar RAB, material..."
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-white text-sm focus:border-primary outline-none"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
