
import React, { useState, useRef, useEffect } from 'react';
import { Document, Category, ChatMessage } from '../types.ts';
import { aiService, AIProviderResponse } from '../services/aiService.ts';

interface PolarisBrainProps {
  count: number;
  documents: Document[];
  categories: Category[];
}

const PolarisBrain: React.FC<PolarisBrainProps> = ({ count, documents, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeModelName, setActiveModelName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsgText = inputValue;
    const userMessage: ChatMessage = {
      role: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);
    setActiveModelName(null);

    try {
      // LANCEMENT DU CONCOURS
      const winner: AIProviderResponse = await aiService.runCompetition(updatedMessages, documents);
      
      if (winner.text) {
        setActiveModelName(winner.source);
        setMessages(prev => [...prev, {
          role: 'model',
          text: winner.text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim(),
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      console.error("Échec du concours IA:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "[ALERTE SYSTÈME]: Connexion à la Matrice interrompue. Les serveurs sont peut-être saturés.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[7000] flex flex-col items-end">
        <button onClick={() => setIsOpen(!isOpen)} className="group relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className={`relative bg-slate-950/80 backdrop-blur-3xl border ${isOpen ? 'border-cyan-400' : 'border-white/10'} px-5 py-3 rounded-[1.5rem] shadow-2xl flex items-center gap-4 transition-all duration-500`}>
             <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-400/30 rounded-xl flex items-center justify-center shadow-neon">
                <i className="fas fa-brain text-cyan-400 text-sm animate-pulse"></i>
             </div>
             <div className="flex flex-col items-start text-left">
                <span className="text-[8px] font-black uppercase text-cyan-400/60 tracking-widest leading-none">Polaris Brain</span>
                <span className="text-[14px] font-black text-white">{count} Archives</span>
             </div>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[550px] max-h-[85vh] z-[8000] bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
          
          <div className="bg-gradient-to-r from-cyan-500/20 to-transparent p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-neon">
                <i className="fas fa-bolt text-slate-950 text-sm"></i>
              </div>
              <div>
                <h3 className="text-white font-black uppercase text-[12px] tracking-widest italic tracking-tighter">Nexus Concours IA</h3>
                <p className="text-[7px] text-cyan-400 font-black uppercase tracking-[0.3em]">Vitesse Maximale Activée</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-2">
                  <i className="fas fa-running text-cyan-400/40"></i>
                </div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-loose">
                  Prêt pour le concours de réponse.<br/>La plus rapide l'emportera.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[11px] leading-relaxed shadow-lg ${
                  msg.role === 'user' 
                  ? 'bg-cyan-500 text-slate-950 font-bold' 
                  : 'bg-slate-900/60 border border-white/10 text-white/90'
                }`}>
                  {msg.text}
                </div>
                <div className="flex items-center gap-2 mt-2 px-2">
                  {msg.role === 'model' && idx === messages.length - 1 && activeModelName && (
                    <span className="text-[6px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                      <i className="fas fa-trophy mr-1"></i> {activeModelName} Gagne
                    </span>
                  )}
                  <span className="text-[7px] text-white/20 font-bold">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2 animate-pulse">
                <div className="bg-slate-900/60 border border-white/10 p-3 rounded-full flex gap-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
                </div>
                <span className="text-[7px] text-cyan-400/50 uppercase font-black self-center tracking-widest">Concours en cours...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6 bg-black/40 border-t border-white/5">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-cyan-500/50 transition-all">
              <input 
                type="text" 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Interroger la Matrice..." 
                className="flex-1 bg-transparent px-4 py-3 text-[11px] font-bold text-white outline-none"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 bg-cyan-500 text-slate-950 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:bg-white hover:scale-105 shadow-neon"
              >
                <i className="fas fa-paper-plane text-xs"></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default PolarisBrain;
