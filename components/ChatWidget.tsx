
import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService.ts';
import { Document, ChatMessage } from '../types.ts';

interface ChatWidgetProps {
  documents: Document[];
}

interface WidgetMessage {
  role: 'model' | 'user';
  text: string;
}

export default function ChatWidget({ documents }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([
    { role: 'model', text: "Bonjour ! Je suis ton assistant pédagogique Polaris. Je suis là pour t'aider à comprendre tes cours de Terminale C4. Quelle notion souhaites-tu explorer aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMsg } as WidgetMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const chatHistory: ChatMessage[] = newMessages.map(m => ({
        role: m.role,
        text: m.text,
        timestamp: new Date().toISOString()
      }));

      const response = await aiService.processMessage(chatHistory, documents);
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Oups, le Nexus est temporairement déconnecté. Réessaye dans un instant !" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[4000] w-16 h-16 bg-cyan-500 rounded-full shadow-2xl shadow-cyan-500/40 flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all duration-300"
      >
        <i className="fas fa-comment-dots text-2xl"></i>
      </button>

      {/* Fenêtre de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[4001] w-[calc(100vw-48px)] max-w-[400px] h-[600px] max-h-[80vh] bg-[#020617] border border-cyan-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,212,255,0.1)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-cyan-500 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-graduation-cap text-black"></i>
              </div>
              <div>
                <h3 className="text-black font-black text-[12px] uppercase tracking-widest">Assistant Polaris</h3>
                <p className="text-black/60 text-[9px] font-bold uppercase">Spécial Terminale C4</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-black hover:rotate-90 transition-transform">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.05)_0%,transparent_100%)]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-3xl text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-100 rounded-tr-none'
                      : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-black/40 border-t border-white/5">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-cyan-500/50 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pose ta question..."
                className="flex-1 bg-transparent px-5 py-4 text-[13px] text-white outline-none placeholder-white/20"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-5 text-cyan-500 hover:text-cyan-400 disabled:opacity-30"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
