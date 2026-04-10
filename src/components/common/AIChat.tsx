import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `Kamu adalah Kiro, AI Assistant expert di SIVILIZE HUB PRO — platform RAB & Teknik Sipil Indonesia.

Keahlianmu:
- Perhitungan RAB (Rencana Anggaran Biaya) sesuai AHSP/SNI
- Permen PUPR No. 1 Tahun 2022
- Analisa Harga Satuan Pekerjaan (AHSP)
- Jenis pondasi & rekomendasi berdasarkan jenis tanah
- Material bangunan & harga pasar Indonesia
- K3 (Keselamatan & Kesehatan Kerja) proyek konstruksi
- Struktur bangunan, atap, MEP (Mekanikal, Elektrikal, Plumbing)

Gaya bicara: santai, pakai bahasa Indonesia, panggil user "Bro", jawaban singkat & to the point.
Kalau ditanya di luar konstruksi/RAB, tetap bantu tapi ingatkan fokus utama kamu adalah teknik sipil.`;

const callGemini = async (messages: Message[], userInput: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key tidak ditemukan');

  // Build conversation history
  const history = messages.slice(-10).map(m => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userInput }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak ada respons.';
};

const AIChat = () => {
  useStore(); // keep store subscription
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Halo Bro! Gue Kiro, AI assistant SIVILIZE HUB PRO. Tanya apa aja seputar RAB, material, AHSP, pondasi, atau konstruksi — gue siap bantu! 🏗️',
      timestamp: new Date()
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');

    const userMsg: Message = { sender: 'user', text: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await callGemini(messages, userText);
      setMessages(prev => [...prev, { sender: 'ai', text: reply, timestamp: new Date() }]);
    } catch {
      // Fallback ke response sederhana
      const fallbacks: Record<string, string> = {
        'rab': 'RAB (Rencana Anggaran Biaya) adalah dokumen estimasi biaya konstruksi. Di SIVILIZE, lo bisa generate RAB otomatis di menu Kalkulator RAB bro!',
        'pondasi': 'Pilihan pondasi tergantung jenis tanah. Tanah keras → batu kali, tanah lunak → strauss pile, gambut → tiang pancang. Cek fitur rekomendasi pondasi di Kalkulator RAB!',
        'harga': 'Harga material bervariasi per daerah. SIVILIZE udah punya database harga 34 provinsi + faktor regional untuk pelosok. Cek di AHSP Database → HSPK Regional.',
      };
      const key = Object.keys(fallbacks).find(k => userText.toLowerCase().includes(k));
      const fallbackText = key ? fallbacks[key] : 'Maaf bro, koneksi ke AI lagi gangguan. Coba lagi ya!';
      setMessages(prev => [...prev, { sender: 'ai', text: fallbackText, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      sender: 'ai',
      text: 'Chat dibersihkan. Ada yang bisa gue bantu bro? 🏗️',
      timestamp: new Date()
    }]);
  };

  // Quick prompts
  const quickPrompts = [
    'Cara hitung RAB rumah 100m²?',
    'Pondasi apa untuk tanah lunak?',
    'Berapa harga beton K-225?',
    'Apa itu bowplank?',
  ];

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary-hover transition-all hover:scale-110 active:scale-95"
          title="Tanya Kiro AI"
        >
          <Sparkles size={22} className="text-white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[60] w-[360px] md:w-96 h-[560px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-orange-600">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Kiro AI</p>
                <p className="text-white/70 text-[10px]">Powered by Gemini • Expert Konstruksi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} className="text-white/70 hover:text-white transition-colors p-1" title="Hapus chat">
                <Trash2 size={15} />
              </button>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={13} className="text-primary" />
                  </div>
                )}
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-background border border-border text-white rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center shrink-0 mt-1">
                    <User size={13} className="text-text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles size={13} className="text-primary" />
                </div>
                <div className="bg-background border border-border px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts — tampil kalau belum ada percakapan */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickPrompts.map((p, i) => (
                <button key={i} onClick={() => { setInput(p); inputRef.current?.focus(); }}
                  className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Tanya Kiro seputar RAB..."
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-40 active:scale-95"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
